// Singleton YouTube Player Service
// @ts-check

/**
 * @typedef {Object} PlayerState
 * @property {boolean} isPlaying
 * @property {boolean} playerReady
 * @property {number} duration
 * @property {number} currentTime
 * @property {number} progress
 * @property {string|null} currentVideoId
 */

class YouTubePlayerService {
    constructor() {
        this.player = null;
        this.currentVideoId = null;
        this.isPlaying = false;
        this.playerReady = false;
        this.duration = 0;
        this.currentTime = 0;
        this.progress = 0;
        this.progressInterval = null;
        this.subscribers = new Set();
        this.youtubeAPILoaded = null;
        this.playerInitialized = null; // Track initialization promise
        this.containerId = 'shared-yt-player';
    }

    // Subscribe to player state changes
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers of state changes
    notifySubscribers() {
        const state = {
            isPlaying: this.isPlaying,
            playerReady: this.playerReady,
            duration: this.duration,
            currentTime: this.currentTime,
            progress: this.progress,
            currentVideoId: this.currentVideoId
        };
        this.subscribers.forEach(callback => callback(state));
    } async loadYouTubeAPI() {
        // @ts-expect-error - YT is loaded dynamically
        if (window.YT && typeof window.YT.Player === "function") {
            return Promise.resolve();
        }

        if (this.youtubeAPILoaded) return this.youtubeAPILoaded;

        this.youtubeAPILoaded = new Promise((resolve) => {
            const existingScript = document.querySelector(
                "script[src='https://www.youtube.com/iframe_api']",
            );
            if (!existingScript) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }

            const checkYT = () => {
                // @ts-expect-error - YT is loaded dynamically
                if (window.YT && typeof window.YT.Player === "function") {
                    resolve(true);
                } else {
                    setTimeout(checkYT, 50);
                }
            };

            // @ts-expect-error - onYouTubeIframeAPIReady is a YouTube API callback
            window.onYouTubeIframeAPIReady = () => resolve(true);
            checkYT();
        });

        return this.youtubeAPILoaded;
    }

    async initializePlayer() {
        // Return existing initialization promise if already in progress
        if (this.playerInitialized) {
            return this.playerInitialized;
        }

        // If player already exists and is ready, return immediately
        if (this.player && this.playerReady) {
            return Promise.resolve();
        }

        // Create initialization promise
        this.playerInitialized = this._createPlayer();

        try {
            await this.playerInitialized;
        } catch (error) {
            console.error('Failed to initialize player:', error);
            // Reset initialization promise on failure so we can retry
            this.playerInitialized = null;
            throw error;
        }

        return this.playerInitialized;
    }

    async _createPlayer() {
        await this.loadYouTubeAPI();

        // Create container if it doesn't exist
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.style.cssText = 'position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
            document.body.appendChild(container);
        }

        return new Promise((resolve, reject) => {
            // Set a timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                reject(new Error('YouTube player initialization timeout'));
            }, 10000); // 10 second timeout

            // @ts-expect-error - YT is loaded dynamically
            this.player = new YT.Player(this.containerId, {
                width: "640",
                height: "480",
                videoId: "dQw4w9WgXcQ", // Use a default video to initialize
                playerVars: {
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    autoplay: 0,
                    mute: 1
                },
                events: {
                    onReady: () => {
                        clearTimeout(timeout);
                        this.playerReady = true;
                        this.notifySubscribers();
                        resolve(true);
                    },
                    onStateChange: (event) => {
                        // @ts-expect-error - YT is loaded dynamically
                        this.isPlaying = event.data === YT.PlayerState.PLAYING;
                        if (this.isPlaying) {
                            this.startProgressInterval();
                        } else {
                            this.stopProgressInterval();
                        }
                        this.notifySubscribers();
                    },
                    onError: (event) => {
                        clearTimeout(timeout);
                        console.error('YouTube player error:', event);
                        reject(new Error(`YouTube player error: ${event.data}`));
                    }
                },
            });
        });
    } async loadVideo(videoId) {
        if (!this.player) {
            await this.initializePlayer();
        }

        // Wait for player to be ready with a timeout
        let retries = 0;
        while (!this.playerReady && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (!this.playerReady) {
            console.error('YouTube player not ready after timeout');
            return;
        }

        if (this.currentVideoId === videoId && this.isPlaying) {
            // Same video is already playing, pause it
            this.pause();
            return;
        }

        // Stop current video if playing
        if (this.isPlaying) {
            this.pause();
        }

        // Load new video
        this.currentVideoId = videoId; try {

            // Try loadVideoById first, then cueVideoById as fallback
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(videoId, 0, 'default');
            } else if (this.player && typeof this.player.cueVideoById === 'function') {
                this.player.cueVideoById(videoId, 0, 'default');
            } else {
                console.error('No video loading methods available');
                console.error('Player state:', this.player);
                return;
            }

            // Unmute the player when loading a new video
            if (typeof this.player.unMute === 'function') {
                this.player.unMute();
            }

            this.duration = 0;
            this.currentTime = 0;
            this.progress = 0;
            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading video:', error);
        }
    } play() {
        if (!this.player) {
            console.error('No player available');
            return;
        }

        if (!this.playerReady) {
            console.error('Player not ready');
            return;
        }

        try {

            if (typeof this.player.playVideo === 'function') {
                // Unmute the player before playing
                if (typeof this.player.unMute === 'function') {
                    this.player.unMute();
                }
                this.player.playVideo();
            } else {
                console.error('playVideo method not available');
                console.error('Player object:', this.player);
            }
        } catch (error) {
            console.error('Error playing video:', error);
        }
    }

    pause() {
        if (this.player && this.playerReady) {
            try {
                if (typeof this.player.pauseVideo === 'function') {
                    this.player.pauseVideo();
                } else {
                    console.error('pauseVideo method not available');
                }
            } catch (error) {
                console.error('Error pausing video:', error);
            }
        }
    } async togglePlay(videoId) {
        if (this.currentVideoId !== videoId) {
            await this.loadVideo(videoId);
            // Give the video a moment to load before playing
            setTimeout(() => {
                if (this.playerReady) {
                    this.play();
                }
            }, 500);
        } else {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }
    } seek(percent) {
        if (!this.playerReady || !this.duration) return;
        try {
            if (this.player && typeof this.player.seekTo === 'function') {
                const seekToTime = Math.min(60, this.duration) * percent;
                this.player.seekTo(seekToTime, true);
            }
        } catch (error) {
            console.error('Error seeking video:', error);
        }
    }

    updateProgress() {
        if (this.player && this.playerReady) {
            try {
                if (typeof this.player.getCurrentTime === 'function' && typeof this.player.getDuration === 'function') {
                    this.currentTime = this.player.getCurrentTime();
                    this.duration = this.player.getDuration();

                    // Limit playback to 60 seconds
                    if (this.currentTime >= 60) {
                        this.pause();
                    } else {
                        const maxTime = Math.min(this.duration, 60);
                        this.progress = maxTime ? (this.currentTime / maxTime) * 100 : 0;
                    }
                    this.notifySubscribers();
                }
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        }
    }

    startProgressInterval() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => this.updateProgress(), 200);
    }

    stopProgressInterval() {
        if (this.progressInterval) clearInterval(this.progressInterval);
    }

    formatTime(sec) {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    } destroy() {
        this.stopProgressInterval();
        if (this.player && this.player.destroy) {
            this.player.destroy();
            this.player = null;
        }
        this.playerReady = false;
        this.playerInitialized = null; // Reset initialization promise
        this.subscribers.clear();

        // Remove container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.remove();
        }
    }
}

// Export singleton instance
export const youtubePlayerService = new YouTubePlayerService();
