<script>
    import { onMount, onDestroy } from "svelte";
    import Fa from "svelte-fa";
    import {
        faPlayCircle,
        faPauseCircle,
    } from "@fortawesome/free-solid-svg-icons";
    export let videoId;

    let player;
    let isPlaying = false;
    let playerReady = false;
    let containerId = `yt-player-${Math.random().toString(36).slice(2)}`;

    function togglePlay() {
        if (!playerReady) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    onMount(async () => {
        await loadYouTubeAPI();
        createPlayer();
    });

    onDestroy(() => {
        if (player && player.destroy) {
            player.destroy();
        }
    });

    function createPlayer() {
        player = new YT.Player(containerId, {
            height: "45",
            width: "80%",
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

    // Shared loader to prevent duplicate script tags or missed events
    let youtubeAPILoaded = null;
    function loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            return Promise.resolve();
        }

        if (youtubeAPILoaded) return youtubeAPILoaded;

        youtubeAPILoaded = new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);

            window.onYouTubeIframeAPIReady = () => resolve();
        });

        return youtubeAPILoaded;
    }
</script>

<div class="player-container">
    <button on:click={togglePlay} disabled={!playerReady}>
        {#if isPlaying}
            <Fa icon={faPauseCircle} /><span> Pause </span>
        {:else}
            <Fa icon={faPlayCircle} />
            <span> Play </span>
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
