<script>
    import { onMount, onDestroy } from "svelte";
    import Fa from "svelte-fa";
    import {
        faPlayCircle,
        faPauseCircle,
    } from "@fortawesome/free-solid-svg-icons";
    export let videoId;
    export let id;

    let player;
    let isPlaying = false;
    let playerReady = false;
    let containerEl;

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
        player = new YT.Player(containerEl, {
            width: "640",
            height: "480",
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
        if (window.YT && typeof window.YT.Player === "function") {
            return Promise.resolve();
        }

        if (youtubeAPILoaded) return youtubeAPILoaded;

        youtubeAPILoaded = new Promise((resolve) => {
            const existingScript = document.querySelector(
                "script[src='https://www.youtube.com/iframe_api']",
            );
            if (!existingScript) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }

            const checkYT = () => {
                if (window.YT && typeof window.YT.Player === "function") {
                    resolve();
                } else {
                    setTimeout(checkYT, 50);
                }
            };

            // Handle case where iframe API is already loaded before we set `onYouTubeIframeAPIReady`
            window.onYouTubeIframeAPIReady = () => resolve();
            checkYT();
        });

        return youtubeAPILoaded;
    }
</script>

<div class="player-container">
    {#if !playerReady}
        <span>Loading...</span>
    {:else}
        <button on:click={togglePlay} disabled={!playerReady}>
            {#if isPlaying}
                <Fa icon={faPauseCircle} /><span> Pause </span>
            {:else}
                <Fa icon={faPlayCircle} />
                <span> Play </span>
            {/if}
        </button>
    {/if}
    <div
        bind:this={containerEl}
        class="hidden-iframe"
        id={"yt-player-" + id}
    ></div>
</div>

<style>
    .hidden-iframe {
        width: 0;
        height: 0;
        overflow: hidden;
        position: absolute;
        pointer-events: none;
    }
</style>
