<script>
    import { params } from "svelte-spa-router";
    import { io } from "socket.io-client";
    import { onMount } from "svelte";
    import { user } from "$stores/user";
    import FlashCards from "../../lib/FlashCards.svelte";
    import { supabase } from "../../lib/supabaseClient";

    let party_id = null;
    let players = []; // 🧠 reactive player list
    let partyData = null;
    let author_id = null; // Assuming you will set this based on your application logic
    let category = null; // Assuming you will set this based on your application logic

    // Listen for real-time updates
    socket.on("room-update", (room) => {
        console.log("Room update received:", room);
        if (room.roomCode === party_id) {
            players = room.players;
            console.log("Updated player list:", players);
        }
    });

    socket.on("game-started", (data) => {
        console.log("Game started:", data);
        if (data.code === party_id) {
            partyData.isStarted = true; // Update the partyData to reflect the game has started
        }
    });

    onMount(() => {
        if ($params && $params.party_id) {
            party_id = $params.party_id;
            getPartyData(party_id);
            socket.emit("join-room", { code: party_id });
        }
    });

    function getCollectionInformation(collectionId) {
        // get author_id and category from collections in supabase
        supabase
            .from("collections")
            .select("author_id, category")
            .eq("id", collectionId) // Assuming collectionId is the ID of the collection
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
                    category = data.category; // Assuming you want to use this in FlashCards
                }
            });
    }

    function getPartyData(party_id) {
        // Fetch party data using the party_id
        fetch(`${import.meta.env.VITE_API_URL}/party/${party_id}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("Party data:", data);
                document.title = `Party - ${data.name || "Unknown Party"}`;
                players = data.players || [];
                partyData = data;
                getCollectionInformation(data.collectionId); // Fetch author_id based on collectionId
            })
            .catch((error) => {
                console.error("Error fetching party data:", error);
            });
    }

    $: if ($params) {
        party_id = $params.party_id;
        getPartyData(party_id);
    }
</script>

<div class="container white">
    <div class="padding">
        <h1>Party ID: {party_id}</h1>
        <p>Welcome to the party! Here you can see the players in your party.</p>
        {#if players.length > 0}
            <ul class="players-list">
                {#each players as player}
                    <li>{player}</li>
                {/each}
            </ul>
        {:else}
            <div class="players-list">
                <p>
                    No players found. Click the button to see the players in
                    this party.
                </p>
            </div>
        {/if}
        {#if partyData && partyData.hostId === $user.id && !partyData.isStarted}
            <button
                class="button"
                on:click={() => {
                    socket.emit("start-game", party_id);
                }}
            >
                Start Game
            </button>
        {/if}

        <!-- if partyData.isStarted == true, render flashcards for collectionid -->
        {#if partyData && partyData.isStarted && author_id}
            <p>The game has started! Get ready to play with the flashcards.</p>
            <FlashCards collection={category} author_id />
        {:else}
            <p>
                The game has not started yet. Waiting for the host to start...
            </p>
        {/if}
    </div>
</div>
