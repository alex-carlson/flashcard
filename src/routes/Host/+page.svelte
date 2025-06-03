<script>
    import { supabase } from "$lib/supabaseClient";
    import Search from "../../lib/Search.svelte";
    import { onMount } from "svelte";
    import { socketStore } from "../../stores/socket";

    let socket;

    const unsubscribe = socketStore.subscribe((s) => {
        socket = s;
    });

    let collection = null;
    let userId = null;

    onMount(async () => {
        document.title = "Host a Match";

        if (!socket.connected) {
            socket.connect();
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
            console.error(
                "[Host Page] Session error:",
                error?.message || "No session found",
            );
            return;
        }

        const session = data.session;
        userId = session.user.id; // Set userId on auth

        console.log("User ID:", userId);

        const { error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError.message);
        }

        socket.on("connect", () => console.log("Socket connected:", socket.id));
        socket.on("connect_error", (err) =>
            console.error("Socket connection error:", err.message),
        );
    });

    async function createRoom() {
        console.log("Creating room with collection:", collection);

        // Authorize socket if not authorized
        if (!socket.auth?.userId) {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) {
                console.error(
                    "[Host Page] Session error:",
                    error?.message || "No session found",
                );
                return;
            }
            socket.auth = { userId: data.session.user.id };
            socket.connect();
        }

        socket.emit("create-room", {
            collectionId: collection.id,
            userId,
        });
        socket.once("room-created", ({ code, hostId }) => {
            localStorage.setItem("hostId", hostId);
            window.location.href = `#/party/${code}`;
        });
    }

    function autoCreateRoom() {
        socket.emit("create-room", {
            collectionId: 30,
            userId,
        });
        socket.once("room-created", ({ code, hostId }) => {
            localStorage.setItem("hostId", hostId);
            window.location.href = `#/party/${code}`;
        });
    }
</script>

<div class="container white">
    <h1>{collection ? collection.category : "Host a match"}</h1>
    <div class="categoryPicker padding">
        <Search
            on:SearchItemClicked={(e) => {
                collection = e.detail;
                document.title = `Create a match - ${collection.category}`;
            }}
        />

        <button class="test" on:click={autoCreateRoom}>Dev Test Room</button>

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
                    Start Match
                </button>
            </div>
        {:else}
            <p>Select a collection to host a match.</p>
        {/if}
    </div>
</div>
