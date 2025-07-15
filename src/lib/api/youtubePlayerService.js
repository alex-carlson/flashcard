// Shared YouTube Player Service for managing multiple players
class YouTubePlayerService {
    constructor() {
        this.players = new Map();
        this.apiReady = false;
        this.apiLoading = false;
        this.readyCallbacks = [];
        this.subscribers = new Map();

        // Initialize API loading
        this.initializeAPI();
    }

    async initializeAPI() {
        if (this.apiReady) return Promise.resolve();
        if (this.apiLoading) {
            return new Promise(resolve => {
                this.readyCallbacks.push(resolve);
            });
        }

        this.apiLoading = true;

        return new Promise((resolve) => {
            if (typeof YT !== 'undefined' && YT.Player) {
                this.apiReady = true;
                this.apiLoading = false;
                resolve();
                return;
            }

            // Set up global callback
            window.onYouTubeIframeAPIReady = () => {
                this.apiReady = true;
                this.apiLoading = false;
                resolve();

                // Call all waiting callbacks
                this.readyCallbacks.forEach(callback => callback());
                this.readyCallbacks = [];
            };

            // Load the API script
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        });
    }

    async createPlayer(videoId, containerId, callbacks) {
        await this.initializeAPI();

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID ${containerId} not found`);
        }

        const player = new YT.Player(container, {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                showinfo: 0,
                loop: 0,
                mute: 0
            },
            events: {
                onReady: (event) => {
                    this.players.set(videoId, player);
                    if (callbacks.onReady) callbacks.onReady(event);
                },
                onStateChange: (event) => {
                    if (callbacks.onStateChange) callbacks.onStateChange(event);
                },
                onError: (event) => {
                    if (callbacks.onError) callbacks.onError(event);
                }
            }
        });

        return player;
    }

    getPlayer(videoId) {
        return this.players.get(videoId);
    }

    destroyPlayer(videoId) {
        const player = this.players.get(videoId);
        if (player && player.destroy) {
            player.destroy();
            this.players.delete(videoId);
        }
    }

    // Subscribe to player events
    subscribe(videoId, callback) {
        if (!this.subscribers.has(videoId)) {
            this.subscribers.set(videoId, []);
        }
        this.subscribers.get(videoId).push(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(videoId);
            if (subs) {
                const index = subs.indexOf(callback);
                if (index > -1) {
                    subs.splice(index, 1);
                }
            }
        };
    }

    notify(videoId, data) {
        const subs = this.subscribers.get(videoId);
        if (subs) {
            subs.forEach(callback => callback(data));
        }
    }
}

// Create singleton instance
export const youtubePlayerService = new YouTubePlayerService();
