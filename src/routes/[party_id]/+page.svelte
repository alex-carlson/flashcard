<script>
    import { params } from "svelte-spa-router";
    import { onMount, onDestroy } from "svelte";
    import { supabase } from "../../lib/supabaseClient";
    import FlashCards from "../../lib/FlashCards.svelte";
    import { socket } from "../../stores/socket.js";
    import { user } from "../../stores/user.js";
    import ProfilePicture from "../../lib/ProfilePicture.svelte";

    let party_id = null;
    let players = [];
    let scores = {};
    let partyData = null;
    let author_id = null;
    let category = null;
    let flashCardsRef;

    let socketInstance = null;

    // Subscribe to socket store
    const unsubscribeSocket = socket.subscribe((instance) => {
        socketInstance = instance;
    });

    // Subscribe to user store (if you need user info here)
    let currentUser;
    const unsubscribeUser = user.subscribe((u) => {
        currentUser = u;
    });

    // Setup socket event listeners when socket is ready
    function setupSocketListeners() {
        if (!socketInstance) return;

        // Remove any previous listeners to avoid duplicates
        socketInstance.off("room-update");
        socketInstance.off("game-started");

        socketInstance.on("room-update", (room) => {
            console.log("Room update received:", room);
            if (room.roomCode === party_id) {
                players = room.players;
                console.log("Updated player list:", players);
            }
        });

        socketInstance.on("game-started", (data) => {
            console.log("Game started:", data);
            partyData = { ...partyData, isStarted: true };
        });

        socketInstance.on("score-updated", (data) => {
            const { scores: newScores, cardIndex } = data;

            // Ensure keys are stringified
            scores = { ...scores, ...newScores };

            if (flashCardsRef) {
                flashCardsRef.setRevealed(cardIndex, true);
            } else {
                // try to set the ref
                console.warn("FlashCards reference not ready yet");
            }
        });

        socketInstance.on("player-joined", (playerId) => {
            console.log("Player joined:", playerId);
            if (!players.includes(playerId)) {
                players.push(playerId);
            }
        });

        socketInstance.on("player-left", (playerId) => {
            console.log("Player left:", playerId);
            players = players.filter((p) => p !== playerId);
        });
    }

    // Emit join-room event once socket & party_id ready
    function joinRoom() {
        if (socketInstance && party_id) {
            socketInstance.emit("join-room", { code: party_id });
        } else {
            console.warn("Socket or party_id not ready to join room");
        }
    }

    onMount(() => {
        if ($params && $params.party_id) {
            party_id = $params.party_id;
            getPartyData(party_id);
        }

        // Wait for socket instance to be ready, then setup listeners & join room
        const waitForSocket = setInterval(() => {
            if (socketInstance) {
                setupSocketListeners();
                joinRoom();
                clearInterval(waitForSocket);
            }
        }, 100);

        // Add disconnect handler
        window.addEventListener("beforeunload", handleDisconnect);
    });

    onDestroy(() => {
        if (socketInstance) {
            socketInstance.off("room-update");
            socketInstance.off("game-started");
        }

        unsubscribeSocket();
        unsubscribeUser();

        // Manually emit disconnect if navigating within app
        handleDisconnect();

        window.removeEventListener("beforeunload", handleDisconnect);
    });

    function handleDisconnect() {
        if (socketInstance && party_id && currentUser?.id) {
            socketInstance.emit("player-left", {
                code: party_id,
                playerId: currentUser.id,
            });
        }
    }

    function getCollectionInformation(collectionId) {
        supabase
            .from("collections")
            .select("author_id, category")
            .eq("id", collectionId)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error(
                        "Error fetching collection information:",
                        error,
                    );
                } else {
                    console.log("Collection information:", data);
                    author_id = data.author_id;
                    category = data.category;
                }
            });
    }

    function getPartyData(party_id) {
        fetch(`${import.meta.env.VITE_API_URL}/party/${party_id}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("Party data:", data);
                document.title = `Party - ${data.name || "Unknown Party"}`;
                players = data.players || [];
                partyData = data;
                getCollectionInformation(data.collectionId);
            })
            .catch((error) => {
                console.error("Error fetching party data:", error);
            });
    }

    function scorePoint(cardIndex) {
        // If cardIndex is an object with an 'index' property, extract it
        const idx =
            typeof cardIndex === "object" &&
            cardIndex !== null &&
            "index" in cardIndex
                ? cardIndex.index
                : cardIndex;
        socketInstance.emit("score-point", {
            code: party_id,
            playerId: currentUser?.id,
            cardIndex: idx,
        });
    }

    // Reactive update if route param changes
    $: if ($params && $params.party_id && $params.party_id !== party_id) {
        party_id = $params.party_id;
        getPartyData(party_id);

        // Rejoin the new room if socket connected
        if (socketInstance) {
            socketInstance.emit("join-room", { code: party_id });
        }
    }

    function startGame() {
        if (!socketInstance) {
            console.error("Socket not connected yet");
            return;
        }
        socketInstance.emit("start-game", party_id);
    }
</script>

<div class="container white partymode">
    <div class="padding">
        <h1>Party ID: {party_id}</h1>
        {#if players.length > 0 && !partyData.isStarted}
            <p>Connected players:</p>
            <ul class="players-list">
                {#each players as player}
                    <li>
                        <ProfilePicture userId={player} size={32} />
                    </li>
                {/each}
            </ul>
        {/if}

        {#if partyData && partyData.hostId === currentUser?.id && !partyData.isStarted}
            <button class="button" on:click={startGame}>Start Game</button>
        {/if}

        {#if partyData && partyData.isStarted && author_id}
            <h2>Scores:</h2>
            <ul class="scores-list padding">
                {#each players as playerId}
                    <li>
                        <ProfilePicture userId={playerId} size={32} />
                        <span>{scores[playerId] || 0}</span>
                    </li>
                {/each}
            </ul>
            <FlashCards
                collection={category}
                isPartyMode={true}
                bind:this={flashCardsRef}
                {author_id}
                on:correctAnswer={(e) => scorePoint(e.detail)}
            />
        {:else}
            <p>
                The game has not started yet. Waiting for the host to start...
            </p>
        {/if}
    </div>
</div>
