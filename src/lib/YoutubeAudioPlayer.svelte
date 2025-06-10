<script>
    import { onMount, onDestroy } from "svelte";

    export let videoId;

    let player;
    let isPlaying = false;
    let playerReady = false;
    let containerId = `yt-player-${Math.random().toString(36).slice(2)}`;

    function togglePlay() {
        console.log("Toggling play state");
        if (!playerReady) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    onMount(() => {
        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            loadYouTubeAPI().then(createPlayer);
        }
    });

    onDestroy(() => {
        if (player && player.destroy) {
            player.destroy();
        }
    });

    function createPlayer() {
        player = new YT.Player(containerId, {
            height: "0",
            width: "0",
            videoId,
            playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
            },
            events: {
                onReady: () => {
                    playerReady = true;
                },
                onStateChange: (event) => {
                    isPlaying = event.data === YT.PlayerState.PLAYING;
                },
            },
        });
    }

    function loadYouTubeAPI() {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => resolve();
        });
    }
</script>

<div class="player-container">
    <button on:click={togglePlay} disabled={!playerReady}>
        {#if isPlaying}
            ⏸ Pause
        {:else}
            ▶ Play
        {/if}
    </button>
    <div id={containerId} class="hidden-iframe"></div>
</div>

<style>
    .player-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .hidden-iframe {
        width: 0;
        height: 0;
        overflow: hidden;
        position: absolute;
        pointer-events: none;
    }

    button {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
    }

    button:disabled {
        background: #aaa;
    }
</style>
