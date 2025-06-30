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
    let duration = 0;
    let currentTime = 0;
    let progress = 0;
    let progressInterval;

    // Global event to coordinate playback between multiple players
    const AUDIO_PLAYER_EVENT = 'yt-audio-player-play';

    function togglePlay() {
        if (!playerReady) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            // Notify other players to pause
            window.dispatchEvent(new CustomEvent(AUDIO_PLAYER_EVENT, { detail: id }));
            player.playVideo();
        }
    }

    // Listen for global pause events
    window.addEventListener(AUDIO_PLAYER_EVENT, (e) => {
        if (e.detail !== id && isPlaying && player) {
            player.pauseVideo();
        }
    });

    function updateProgress() {
        if (player && player.getCurrentTime && player.getDuration) {
            currentTime = player.getCurrentTime();
            duration = player.getDuration();
            // Limit playback to 60 seconds
            if (currentTime >= 60) {
                player.pauseVideo();
                // Don't seekTo(0, true) or reset currentTime/progress here, just pause
                isPlaying = false;
                stopProgressInterval();
            } else {
                progress = duration ? (currentTime / Math.min(duration, 60)) * Math.min(currentTime, 60) / 60 * 100 : 0;
            }
        }
    }

    function seek(e) {
        if (!playerReady || !duration) return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        let seekToTime = 60 * percent; // Always seek within 0-60s
        player.seekTo(seekToTime, true);
    }

    function startProgressInterval() {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(updateProgress, 200);
    }

    function stopProgressInterval() {
        if (progressInterval) clearInterval(progressInterval);
    }

    onMount(async () => {
        await loadYouTubeAPI();
        createPlayer();
    });

    onDestroy(() => {
        if (player && player.destroy) {
            player.destroy();
        }
        stopProgressInterval();
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
                    duration = player.getDuration();
                    updateProgress();
                },
                onStateChange: (event) => {
                    isPlaying = event.data === YT.PlayerState.PLAYING;
                    if (isPlaying) {
                        startProgressInterval();
                    } else {
                        stopProgressInterval();
                    }
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

    function formatTime(sec) {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }
</script>

<div class="player-container">
    {#if !playerReady}
        <span>Loading...</span>
    {:else}
            <div class="controls">
                <button on:click={togglePlay} disabled={!playerReady}>
                    {#if isPlaying}
                        <Fa icon={faPauseCircle} />
                    {:else}
                        <Fa icon={faPlayCircle} />
                    {/if}
                </button>
                <div class="progress-bar-container" on:click={seek}>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: {progress}%"></div>
                    </div>
                </div>
            </div>
            <span class="progress-time">{formatTime(Math.min(currentTime, 60))} / 1:00</span>
    {/if}
    <div
        bind:this={containerEl}
        class="hidden-iframe"
        id={"yt-player-" + id}
    ></div>
</div>