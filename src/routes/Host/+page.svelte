<script>
    import { onDestroy, onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import Search from "../../lib/Search.svelte";
    import { socket } from "../../stores/socket.js";
    import { user } from "../../stores/user.js";

    let collection = null;
    let userId = null;
    let socketInstance = null;

    // Subscribe to socket instance
    const unsubscribeSocket = socket.subscribe((instance) => {
        socketInstance = instance;
    });

    // Subscribe to user store to get userId
    const unsubscribeUser = user.subscribe((u) => {
        userId = u?.id ?? null;
    });

    onDestroy(() => {
        unsubscribeSocket();
        unsubscribeUser();
    });

    onMount(() => {
        document.title = "Host a Match";

        if (!socketInstance) return;

        socketInstance.on("connect", () =>
            console.log("Socket connected:", socketInstance.id),
        );
        socketInstance.on("connect_error", (err) =>
            console.error("Socket connection error:", err.message),
        );
    });

    async function createRoom() {
        console.log("Creating room with collection:", collection);

        if (!socketInstance) {
            console.error("Socket not initialized yet");
            return;
        }

        if (!userId) {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) {
                console.error(
                    "[Host Page] Session error:",
                    error?.message || "No session found",
                );
                return;
            }
            userId = data.session.user.id;
        }

        socketInstance.emit("create-room", {
            collectionId: collection.id,
            userId,
        });

        socketInstance.once("room-created", ({ code, hostId }) => {
            localStorage.setItem("hostId", hostId);
            window.location.href = `#/party/${code}`;
        });
    }
</script>

<div class="container white">
    <h1>Room Setup</h1>
    <div class="categoryPicker padding">
        <Search
            on:SearchItemClicked={(e) => {
                collection = e.detail;
                document.title = `Create a match - ${collection.category}`;
            }}
        />

        {#if collection}
            <div class="roomSetup">
                <div class="collection">
                    {#if collection.items.length > 0}
                        <img
                            src={collection.items[0].image}
                            alt={collection.category}
                            class="collection-image"
                        />
                    {/if}
                    <h3>{collection.category}</h3>
                    <p>Author: {collection.author}</p>
                </div>
                <button class="button" on:click={createRoom}>
                    Create Room
                </button>
            </div>
        {:else}
            <p>Pick a collection to host a match.</p>
        {/if}
    </div>
</div>
