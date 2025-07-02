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
        this.iframe = null;
        this.currentVideoId = null;
        this.isPlaying = false;
        this.playerReady = false;
        this.duration = 0;
        this.currentTime = 0;
        this.progress = 0;
        this.progressInterval = null;
        this.subscribers = new Set();
        this.iframeId = 'youtube-player';
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
    }    // Get the iframe element
    getIframe() {
        if (!this.iframe) {
            this.iframe = document.getElementById(this.iframeId);
        }
        return this.iframe;
    }

    // Initialize the iframe (just check if it exists)
    async initializePlayer() {
        const iframe = this.getIframe();
        if (iframe) {
            this.playerReady = true;
            this.notifySubscribers();
            return Promise.resolve();
        } else {
            console.error(`Iframe with id "${this.iframeId}" not found`);
            return Promise.reject(new Error('Iframe not found'));
        }
    }

    async loadVideo(videoId) {
        const iframe = this.getIframe();
        if (!iframe) {
            console.error('YouTube iframe not found');
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

        // Load new video by changing iframe src with autoplay for audio
        this.currentVideoId = videoId;
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1`;
        /** @type {HTMLIFrameElement} */ (iframe).src = embedUrl;

        // Set playing state and start progress tracking
        this.isPlaying = true;
        this.duration = 0;
        this.currentTime = 0;
        this.progress = 0;
        this.startProgressInterval();
        this.notifySubscribers();
    } play() {
        const iframe = this.getIframe();
        if (!iframe || !this.currentVideoId) {
            console.error('No iframe or video available to play');
            return;
        }

        if (!this.isPlaying) {
            // Reload iframe with autoplay to resume playback
            const embedUrl = `https://www.youtube.com/embed/${this.currentVideoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1`;
            /** @type {HTMLIFrameElement} */ (iframe).src = embedUrl;
            this.isPlaying = true;
            this.startProgressInterval();
            this.notifySubscribers();
        }
    }

    pause() {
        const iframe = this.getIframe();
        if (!iframe || !this.currentVideoId) {
            return;
        }

        if (this.isPlaying) {
            // Reload iframe without autoplay to pause playback
            const embedUrl = `https://www.youtube.com/embed/${this.currentVideoId}?autoplay=0&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1`;
            /** @type {HTMLIFrameElement} */ (iframe).src = embedUrl;
            this.isPlaying = false;
            this.stopProgressInterval();
            this.notifySubscribers();
        }
    }

    async togglePlay(videoId) {
        if (this.currentVideoId !== videoId) {
            await this.loadVideo(videoId);
        } else {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }
    } seek(percent) {
        // Note: Seeking is not easily implemented with iframe approach
        // This would require YouTube Player API for precise control
        console.warn('Seeking not supported with iframe approach', percent);
    }

    updateProgress() {
        // Note: Progress tracking is not easily implemented with iframe approach
        // This would require YouTube Player API for precise control
        if (this.isPlaying) {
            // Simulate progress for basic functionality
            this.currentTime += 0.2; // Assume 200ms intervals
            this.duration = 60; // Assume 60 seconds max
            const maxTime = Math.min(this.duration, 60);
            this.progress = maxTime ? (this.currentTime / maxTime) * 100 : 0;

            // Stop after 60 seconds
            if (this.currentTime >= 60) {
                this.pause();
            }

            this.notifySubscribers();
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

        // Clear the iframe src to stop video
        const iframe = this.getIframe();
        if (iframe) {
            /** @type {HTMLIFrameElement} */ (iframe).src = 'about:blank';
        }

        this.iframe = null;
        this.playerReady = false;
        this.isPlaying = false;
        this.currentVideoId = null;
        this.subscribers.clear();
    }
}

// Export singleton instance
export const youtubePlayerService = new YouTubePlayerService();
