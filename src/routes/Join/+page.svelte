<script>
    import { socketStore } from "../../stores/socket";

    let roomCode = "";

    function joinRoom() {
        if (!roomCode) {
            alert("Please enter a room code.");
            return;
        }

        socketStore.emit("join-room", { code: roomCode });
    }

    socketStore.on("room-update", (room) => {
        console.log("Joined room:", room);
        // Redirect to the game page with the room code
        window.location.href = `#/party/${room.roomCode}`;
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
