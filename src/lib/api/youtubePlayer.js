// Singleton YouTube Player Service
// @ts-check

/**
 * @typedef {Object} PlayerState
 * @property {boolean} isPlaying
 * @property {boolean} playerReady
 * @property {boolean} isMuted
 * @property {boolean} isLoading
 * @property {number} duration
 * @property {number} currentTime
 * @property {number} progress
 * @property {string|null} currentVideoId
 * @property {string|null} error
 */

class YouTubePlayerService {
    constructor() {
        this.player = null;
        this.currentVideoId = null;
        this.isPlaying = false;
        this.playerReady = false;
        this.isMuted = false;
        this.isLoading = false; this.duration = 0;
        this.currentTime = 0;
        this.progress = 0;
        this.progressInterval = null;
        this.subscribers = new Set();
        this.containerId = 'player';
        this.youtubeAPILoaded = null;
        this.playerInitialized = null;
        this.error = null;
        this.preloadedVideos = new Map(); // Cache for preloaded video data
        this.preloadPromises = new Map(); // Track ongoing preload operations
    }    // Get user-friendly error message for YouTube error codes
    getErrorMessage(errorCode) {
        const errorMessages = {
            2: 'Invalid video ID or video not found',
            5: 'Video cannot be played in HTML5 player',
            100: 'Video not found or has been removed',
            101: 'Video is private or restricted',
            150: 'Video is private, removed, or restricted for your location'
        };
        return errorMessages[errorCode] || `Unknown player error (${errorCode})`;
    }    // Subscribe to player state changes
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Clear any existing error
    clearError() {
        this.error = null;
        this.notifySubscribers();
    }// Notify all subscribers of state changes
    notifySubscribers() {
        const state = {
            isPlaying: this.isPlaying,
            playerReady: this.playerReady,
            isMuted: this.isMuted,
            isLoading: this.isLoading,
            duration: this.duration,
            currentTime: this.currentTime,
            progress: this.progress,
            currentVideoId: this.currentVideoId,
            error: this.error
        };
        this.subscribers.forEach(callback => callback(state));
    }// Load YouTube IFrame API
    async loadYouTubeAPI() {
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

    // Initialize the YouTube player
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
            container.style.cssText = 'width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(container);
        }

        return new Promise((resolve, reject) => {
            // Set a timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                reject(new Error('YouTube player initialization timeout'));
            }, 10000); // 10 second timeout            // @ts-expect-error - YT is loaded dynamically
            this.player = new YT.Player(this.containerId, {
                width: "1",
                height: "1", playerVars: {
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    autoplay: this.isFirefox() ? 0 : 1, // Firefox: disable autoplay, Chrome: enable
                    mute: this.isFirefox() ? 1 : 0, // Firefox: start muted, Chrome: start unmuted
                    playsinline: 1,
                    fs: 0, // Disable fullscreen
                    cc_load_policy: 0, // Disable captions
                    disablekb: 1, // Disable keyboard controls
                    enablejsapi: 1 // Enable JavaScript API
                },
                events: {
                    onReady: () => {
                        clearTimeout(timeout);
                        this.playerReady = true;

                        // Initialize mute state
                        if (typeof this.player.isMuted === 'function') {
                            this.isMuted = this.player.isMuted();
                        }

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
                    }, onError: (event) => {
                        const errorCode = event.data;
                        const errorMessage = this.getErrorMessage(errorCode);

                        console.error('YouTube player error:', {
                            code: errorCode,
                            message: errorMessage,
                            event: event
                        });

                        // Store error for UI display
                        this.error = errorMessage;
                        this.isLoading = false;
                        this.notifySubscribers();

                        // Don't reject initialization for video-specific errors
                        // Only reject for critical player initialization errors
                        if (errorCode === 2 || errorCode === 5) {
                            clearTimeout(timeout);
                            reject(new Error(errorMessage));
                        }
                    }
                },
            });
        });
    } async loadVideo(videoId, autoPlay = true) {
        if (!this.player) {
            await this.initializePlayer();
        }

        // Check if video is preloaded and available
        const preloadedData = this.getPreloadedVideo(videoId);
        if (preloadedData && !preloadedData.available) {
            this.error = preloadedData.error || 'Video is not available';
            this.isLoading = false;
            this.notifySubscribers();
            return;
        }

        // Wait until player is ready
        let retries = 0;
        while (!this.playerReady && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (!this.playerReady) {
            console.error('YouTube player not ready after timeout');
            return;
        }

        const isSameVideo = this.currentVideoId === videoId;

        // If same video is playing, just toggle
        if (isSameVideo && this.isPlaying) {
            this.pause();
            return;
        }

        if (this.isPlaying) {
            this.pause();
        }        // Set loading state and clear any previous errors
        this.isLoading = true;
        this.currentVideoId = videoId;
        this.clearError();
        this.notifySubscribers(); try {
            if (this.player && typeof this.player.loadVideoById === 'function') {
                // Use loadVideoById which automatically plays with autoplay: 1
                this.player.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0,
                    suggestedQuality: 'small'
                });

                // Wait for video to be loaded
                await new Promise(resolve => setTimeout(resolve, 500));

                // Clear loading state
                this.isLoading = false;

                // Firefox-specific handling: Always pause after loading since autoplay is disabled
                if (this.isFirefox()) {
                    setTimeout(() => {
                        this.pause();
                    }, 100);
                } else {
                    // Chrome/other browsers: If autoPlay is false, pause after loading
                    if (!autoPlay) {
                        setTimeout(() => {
                            this.pause();
                        }, 100);
                    }
                }
            } else {
                console.error('No video loading method available');
                this.isLoading = false;
            }

            this.duration = 0;
            this.currentTime = 0;
            this.progress = 0;
            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading video:', error);
            this.isLoading = false;
            this.notifySubscribers();
        }
    }
    play() {
        console.log('play() called - player:', !!this.player, 'ready:', this.playerReady, 'Firefox:', this.isFirefox());

        if (!this.player) {
            console.error('No player available');
            return;
        }

        if (!this.playerReady) {
            console.error('Player not ready');
            return;
        }

        try {
            // Always unmute when playing (for all browsers)
            if (typeof this.player.unMute === 'function' && typeof this.player.isMuted === 'function') {
                if (this.player.isMuted()) {
                    console.log('Unmuting video before play');
                    this.player.unMute();
                    this.isMuted = false;
                }
            }

            if (typeof this.player.playVideo === 'function') {
                console.log('Calling player.playVideo()');
                this.player.playVideo();

                // Additional unmute check after play for Firefox
                if (this.isFirefox()) {
                    setTimeout(() => {
                        if (this.player && typeof this.player.unMute === 'function') {
                            console.log('Firefox: Double-checking unmute state');
                            this.player.unMute();
                            this.isMuted = false;
                            this.notifySubscribers();
                        }
                    }, 200);
                }
            } else {
                console.error('playVideo method not available');
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
    }
    async togglePlay(videoId) {
        console.log('togglePlay called with videoId:', videoId, 'current:', this.currentVideoId, 'isPlaying:', this.isPlaying, 'Firefox:', this.isFirefox());

        if (this.currentVideoId !== videoId) {
            // New video — load and play
            console.log('Loading new video:', videoId);
            await this.loadVideo(videoId, true);
        } else {
            // Toggle existing video
            if (this.isPlaying) {
                console.log('Pausing current video');
                this.pause();
            } else {
                console.log('Playing current video (Firefox requires special handling)');

                // Firefox-specific: Make sure we're unmuted before attempting to play
                if (this.isFirefox() && typeof this.player.unMute === 'function') {
                    console.log('Firefox: Pre-play unmute');
                    this.player.unMute();
                    this.isMuted = false;
                }

                this.play();
            }
        }
    }

    // New method to just load a video without playing
    async loadVideoOnly(videoId) {
        console.log('loadVideoOnly called for videoId:', videoId);
        await this.loadVideo(videoId, false);
    }
    // Helper method to check if we're on Firefox
    isFirefox() {
        return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
    }

    // Helper method to check if we're on a mobile device
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }    // Method to handle first user interaction for mobile and Firefox
    async handleUserInteraction() {
        if ((this.isMobileDevice() || this.isFirefox()) && this.player && this.playerReady) {
            try {
                console.log('Handling first user interaction for', this.isFirefox() ? 'Firefox' : 'mobile', '...');

                // Firefox-specific audio unlock - simpler approach
                if (this.isFirefox()) {
                    console.log('Firefox: Setting volume and unmuting');

                    // Set volume first
                    if (typeof this.player.setVolume === 'function') {
                        this.player.setVolume(50);
                    }

                    // Unmute
                    if (typeof this.player.unMute === 'function') {
                        this.player.unMute();
                        this.isMuted = false;
                    }

                    console.log('Firefox: User interaction setup completed');
                } else {
                    // Mobile device handling
                    if (typeof this.player.setVolume === 'function') {
                        const currentVolume = this.player.getVolume ? this.player.getVolume() : 50;
                        this.player.setVolume(1);

                        // Try a quick play/pause to unlock audio context
                        if (typeof this.player.playVideo === 'function' && typeof this.player.pauseVideo === 'function') {
                            this.player.playVideo();
                            setTimeout(() => {
                                this.player.pauseVideo();
                                this.player.setVolume(currentVolume);
                            }, 50);
                        }
                    }
                }

                this.notifySubscribers();
                console.log('User interaction handled successfully');
            } catch (error) {
                console.warn('User interaction handling failed:', error);
            }
        } else {
            console.log('Device detected - playback should work with user interaction');
        }
    }
    toggleMute() {
        if (!this.player || !this.playerReady) {
            console.warn('Player not ready for muting');
            return;
        }

        try {
            if (typeof this.player.isMuted === 'function' &&
                typeof this.player.mute === 'function' &&
                typeof this.player.unMute === 'function') {

                const currentlyMuted = this.player.isMuted();

                if (currentlyMuted) {
                    this.player.unMute();
                    this.isMuted = false;
                } else {
                    this.player.mute();
                    this.isMuted = true;
                }

                console.log('Mute toggled:', this.isMuted);
                this.notifySubscribers();
            } else {
                console.error('Mute/unmute methods not available on player');
            }
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    } seek(percent) {
        if (!this.player || !this.playerReady) {
            console.warn('Player not ready for seeking');
            return;
        }

        // Ensure percent is in valid range (0-100)
        const clampedPercent = Math.max(0, Math.min(100, percent));

        try {
            if (typeof this.player.getDuration === 'function' && typeof this.player.seekTo === 'function') {
                const duration = this.player.getDuration();

                if (duration <= 0) {
                    console.warn('Video duration not available for seeking');
                    return;
                }

                const seekTime = (clampedPercent / 100) * duration;

                console.log(`Seeking to ${clampedPercent.toFixed(1)}% (${seekTime.toFixed(1)}s of ${duration.toFixed(1)}s)`);

                // The second parameter (allowSeekAhead) should be true to allow seeking to unbuffered parts
                this.player.seekTo(seekTime, true);

                // Update progress immediately for better UX
                this.currentTime = seekTime;
                this.progress = clampedPercent;
                this.notifySubscribers();
            } else {
                console.error('Seek methods not available on player');
            }
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }

    updateProgress() {
        if (!this.player || !this.playerReady || !this.isPlaying) {
            return;
        }

        try {
            if (typeof this.player.getCurrentTime === 'function' && typeof this.player.getDuration === 'function') {
                this.currentTime = this.player.getCurrentTime();
                this.duration = this.player.getDuration();
                this.progress = this.duration ? (this.currentTime / this.duration) * 100 : 0;
                this.notifySubscribers();
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    } startProgressInterval() {
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
    }
    destroy() {
        this.stopProgressInterval();

        // Properly destroy the YouTube player
        if (this.player && typeof this.player.destroy === 'function') {
            try {
                this.player.destroy();
            } catch (error) {
                console.error('Error destroying YouTube player:', error);
            }
        }

        // Clean up the container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        } this.player = null;
        this.playerReady = false;
        this.isPlaying = false;
        this.isMuted = false;
        this.isLoading = false;
        this.currentVideoId = null;
        this.error = null;
        this.playerInitialized = null;
        this.youtubeAPILoaded = null;
        this.subscribers.clear();
    }

    // Preload video metadata without creating iframe
    async preloadVideo(videoId) {
        if (this.preloadedVideos.has(videoId)) {
            return this.preloadedVideos.get(videoId);
        }

        if (this.preloadPromises.has(videoId)) {
            return this.preloadPromises.get(videoId);
        }

        const preloadPromise = this._fetchVideoMetadata(videoId);
        this.preloadPromises.set(videoId, preloadPromise);

        try {
            const metadata = await preloadPromise;
            this.preloadedVideos.set(videoId, metadata);
            this.preloadPromises.delete(videoId);
            return metadata;
        } catch (error) {
            this.preloadPromises.delete(videoId);
            console.error('Failed to preload video:', videoId, error);
            return null;
        }
    }

    // Fetch video metadata using YouTube oEmbed API (no API key required)
    async _fetchVideoMetadata(videoId) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            return {
                videoId,
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
                duration: null, // oEmbed doesn't provide duration
                available: true,
                preloaded: true
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Video ${videoId} may not be available:`, errorMessage);
            return {
                videoId,
                title: 'Video Unavailable',
                author: 'Unknown',
                thumbnail: null,
                duration: null,
                available: false,
                preloaded: true,
                error: errorMessage
            };
        }
    }

    // Preload multiple videos at once
    async preloadVideos(videoIds) {
        console.log('Preloading videos:', videoIds);
        const preloadPromises = videoIds.map(id => this.preloadVideo(id));
        const results = await Promise.allSettled(preloadPromises);

        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Preloaded ${successful}/${videoIds.length} videos`);

        return results.map((result, index) => ({
            videoId: videoIds[index],
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }

    // Get preloaded video data
    getPreloadedVideo(videoId) {
        return this.preloadedVideos.get(videoId) || null;
    }

    // Check if video is available before attempting to load
    async isVideoAvailable(videoId) {
        const preloaded = this.getPreloadedVideo(videoId);
        if (preloaded) {
            return preloaded.available;
        }

        const metadata = await this.preloadVideo(videoId);
        return metadata ? metadata.available : false;
    }
}

// Export singleton instance
export const youtubePlayerService = new YouTubePlayerService();
