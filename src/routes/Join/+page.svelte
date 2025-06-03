<script>
    import { onDestroy } from "svelte";
    import { socket } from "../../stores/socket.js";

    let roomCode = "";
    let socketInstance = null;

    // Subscribe to socket store to get socket instance
    const unsubscribe = socket.subscribe((instance) => {
        socketInstance = instance;
    });

    function joinRoom() {
        if (!roomCode) {
            alert("Please enter a room code.");
            return;
        }

        if (!socketInstance) {
            alert("Socket not connected yet, please try again shortly.");
            return;
        }

        // Emit join-room event with roomCode
        socketInstance.emit("join-room", { code: roomCode });

        // Listen once for room-update event to confirm join
        socketInstance.once("room-update", (room) => {
            console.log("Joined room:", room);
            window.location.href = `#/party/${room.roomCode}`;
        });
    }

    onDestroy(() => {
        // Clean up socket event listeners to avoid leaks
        if (socketInstance) {
            socketInstance.off("room-update");
        }
        unsubscribe();
    });
</script>

<div class="container white">
    <h1>Join a Quizzboxx</h1>

    <div class="join-container">
        <input
            type="text"
            placeholder="Enter room code"
            bind:value={roomCode}
            class="join-input"
        />
        <button on:click={joinRoom} class="button">Join Room</button>
    </div>
</div>
