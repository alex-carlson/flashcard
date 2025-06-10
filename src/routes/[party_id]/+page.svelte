<script>
    import { params } from "svelte-spa-router";
    import { onMount, onDestroy } from "svelte";
    import { supabase } from "../../lib/supabaseClient";
    import FlashCards from "../../lib/FlashCards.svelte";
    import { socket } from "../../stores/socket.js";
    import { user } from "../../stores/user.js";
    import ProfilePicture from "../../lib/ProfilePicture.svelte";

    import { faFlag } from "@fortawesome/free-solid-svg-icons";
    import Fa from "svelte-fa";

    let party_id = null;
    let partyData = null;
    let author_id = null;
    let category = null;
    let flashCardsRef;
    let isHost = false;

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
            partyData = {
                ...partyData,
                ...room,
            };
            updatePre();
        });

        socketInstance.on("game-started", (data) => {
            console.log("Game started:", data);
            partyData = { ...partyData, isStarted: true };
            updatePre();
        });

        socketInstance.on("score-updated", (data) => {
            const { scores: newScores, cardIndex, playerId: pID } = data;

            // Merge new scores
            partyData = {
                ...partyData,
                scores: {
                    ...(partyData.scores || {}),
                    ...newScores,
                },
            };

            // Sort players by score descending
            if (partyData.scores && partyData.players) {
                partyData.players = [...partyData.players].sort(
                    (a, b) =>
                        (partyData.scores[b] || 0) - (partyData.scores[a] || 0),
                );
            }

            updatePre();

            if (flashCardsRef) {
                flashCardsRef.setRevealed(cardIndex, true, pID);
            } else {
                // try to set the ref
                console.warn("FlashCards reference not ready yet");
            }
        });

        socketInstance.on("player-gave-up", (data) => {
            const { playerId, finishedPlayers } = data;
            console.log("Player gave up:", playerId);
            // set partyData.finishedPlayers to the new array
            partyData = {
                ...partyData,
                finishedPlayers: finishedPlayers || [],
            };

            updatePre();
        });

        socketInstance.on("game-finished", () => {
            console.log("Game finished");
            // Handle game finish logic here, e.g., show results or reset state
            partyData = {
                ...partyData,
                isStarted: false,
                isFinished: true,
                finishedPlayers: [],
            };
            updatePre();
        });

        socketInstance.on("room-closed", () => {
            console.log("Room closed");
            // Handle room closed logic here, e.g., redirect or show message
            partyData = null;
            document.title = "Party Closed";
            updatePre();
            window.location.hash = "#/party";
        });
    }

    function updatePre() {
        // This function is not used in the current code, but can be used to update the pre element
        // if needed in the future.
        const preElement = document.getElementById("party-data");
        if (preElement) {
            preElement.textContent = JSON.stringify(partyData, null, 2);
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
                clearInterval(waitForSocket);
            }
        }, 100);
    });

    onDestroy(() => {
        if (socketInstance) {
            socketInstance.off("room-update");
            socketInstance.off("game-started");
        }

        unsubscribeSocket();
        unsubscribeUser();
    });

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
                partyData = data;
                console.log("Party data fetched:", partyData);
                updatePre();

                isHost = data.hostId === currentUser?.id;

                partyData.hostId = data.hostId;
                partyData.collectionId = data.collectionId;

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
            playerId: currentUser?.id || localStorage.getItem("playerId"),
            cardIndex: idx,
        });
    }

    function giveUp() {
        socketInstance.emit("give-up", {
            code: party_id,
            playerId: currentUser?.id || localStorage.getItem("playerId"),
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
        <pre class="debug-box padding" id="party-data"></pre>
        <h1 class="room-label">{party_id}</h1>
        {#if partyData && partyData.players.length > 0 && !partyData.isStarted}
            <p>Connected players:</p>
            <ul class="players-list">
                {#each partyData.players as player}
                    <li>
                        <ProfilePicture userId={player} size={32} />
                    </li>
                {/each}
            </ul>
        {/if}

        {#if partyData && isHost && !partyData.isStarted && !partyData.isFinished}
            <button class="button" on:click={startGame}>Start Game</button>
        {/if}

        {#if partyData && partyData.isFinished}
            <h2>That's a wrap!</h2>
            <ul class="final-scores-list padding">
                {#each partyData.players as playerId}
                    <li>
                        <ProfilePicture userId={playerId} size={64} />
                        <span>{partyData.scores[playerId] || 0}</span>
                    </li>
                {/each}
            </ul>
        {/if}

        {#if partyData && partyData.isStarted && author_id && !partyData.isFinished}
            <ul class="scores-list padding">
                {#each Object.entries(partyData.scores) as [playerId, score]}
                    <li
                        class:finishedPlayer={partyData.finishedPlayers &&
                            partyData.finishedPlayers.includes(playerId)}
                    >
                        <ProfilePicture userId={playerId} size={32} />
                        <span>{score}</span>
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
            <!-- add give up button with white flag icon -->
            <button class="button" on:click={giveUp}>
                Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" />
            </button>
        {:else if partyData && !partyData.isFinished}
            <p>
                The game has not started yet. Waiting for the host to start...
            </p>
        {/if}
    </div>
</div>
