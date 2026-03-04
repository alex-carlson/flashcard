/**
 * Image preloader service for flash cards
 * Intelligently preloads images based on user behavior and scroll position
 */

class ImagePreloader {
    constructor() {
        this.preloadCache = new Map();
        this.preloadQueue = new Set();
        this.maxConcurrentPreloads = 2;
        this.currentPreloads = 0;
        this.observer = null;

        // Low-end device detection
        this.isLowEndDevice = this.detectLowEndDevice();
        this.adaptiveSettings = this.getAdaptiveSettings();
    }

    detectLowEndDevice() {
        // Estimate device capability
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const connection = navigator.connection;

        const isSlowConnection = connection && (
            connection.effectiveType === 'slow-2g' ||
            connection.effectiveType === '2g' ||
            connection.effectiveType === '3g'
        );

        return memory <= 2 || cores <= 2 || isSlowConnection;
    }

    getAdaptiveSettings() {
        if (this.isLowEndDevice) {
            return {
                maxConcurrentPreloads: 1,
                preloadDistance: 2, // Only preload next 2 cards
                enableThumbnails: true,
                maxImageSize: 300
            };
        }

        return {
            maxConcurrentPreloads: 3,
            preloadDistance: 5,
            enableThumbnails: false,
            maxImageSize: 800
        };
    }

    /**
     * Setup intersection observer for visible cards
     */
    setupIntersectionObserver(callback) {
        const options = {
            root: null,
            rootMargin: this.isLowEndDevice ? '100px' : '200px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    callback(entry.target.dataset.cardIndex);
                }
            });
        }, options);

        return this.observer;
    }

    /**
     * Preload images for cards near the viewport
     */
    async preloadImagesForRange(cards, startIndex, direction = 'forward') {
        const { preloadDistance } = this.adaptiveSettings;

        const endIndex = direction === 'forward'
            ? Math.min(startIndex + preloadDistance, cards.length)
            : Math.max(startIndex - preloadDistance, 0);

        const indices = direction === 'forward'
            ? Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i)
            : Array.from({ length: startIndex - endIndex }, (_, i) => startIndex - i);

        for (const index of indices) {
            const card = cards[index];
            if (card?.imageUrl && !this.preloadCache.has(card.imageUrl)) {
                await this.preloadImage(card.imageUrl, index);
            }
        }
    }

    /**
     * Preload a single image with priority queue
     */
    async preloadImage(imageUrl, priority = 0) {
        if (this.preloadCache.has(imageUrl) || this.preloadQueue.has(imageUrl)) {
            return;
        }

        if (this.currentPreloads >= this.adaptiveSettings.maxConcurrentPreloads) {
            // Add to queue for later processing
            this.preloadQueue.add(imageUrl);
            return;
        }

        return this.loadImage(imageUrl, priority);
    }

    async loadImage(imageUrl, priority = 0) {
        this.currentPreloads++;
        this.preloadQueue.delete(imageUrl);

        try {
            const img = new Image();

            // Set loading priority for modern browsers
            if ('loading' in img) {
                img.loading = priority > 0 ? 'eager' : 'lazy';
            }

            // Create promise for image loading
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    this.preloadCache.set(imageUrl, img);
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn(`Failed to preload image: ${imageUrl}`);
                    reject(new Error(`Failed to load ${imageUrl}`));
                };
            });

            // Add timeout for low-end devices
            if (this.isLowEndDevice) {
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Preload timeout')), 5000)
                );
                await Promise.race([loadPromise, timeout]);
            } else {
                await loadPromise;
            }

            img.src = imageUrl;

        } catch (error) {
            console.warn('Image preload failed:', error);
        } finally {
            this.currentPreloads--;

            // Process next item in queue
            if (this.preloadQueue.size > 0) {
                const nextUrl = this.preloadQueue.values().next().value;
                this.loadImage(nextUrl, 0);
            }
        }
    }

    /**
     * Preload images based on quiz patterns
     */
    smartPreload(cards, currentIndex, userPattern = 'linear') {
        const patterns = {
            linear: () => this.preloadImagesForRange(cards, currentIndex + 1, 'forward'),
            random: () => this.preloadRandomSelection(cards, currentIndex),
            backward: () => this.preloadImagesForRange(cards, currentIndex - 1, 'backward')
        };

        return patterns[userPattern] || patterns.linear;
    }

    async preloadRandomSelection(cards, excludeIndex) {
        const { preloadDistance } = this.adaptiveSettings;
        const availableCards = cards
            .map((card, index) => ({ card, index }))
            .filter(({ index }) => index !== excludeIndex)
            .sort(() => Math.random() - 0.5)
            .slice(0, preloadDistance);

        for (const { card } of availableCards) {
            if (card.imageUrl) {
                await this.preloadImage(card.imageUrl);
            }
        }
    }

    /**
     * Clear cache to free memory on low-end devices
     */
    clearCache() {
        this.preloadCache.clear();
        this.preloadQueue.clear();
    }

    /**
     * Clean up observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.clearCache();
    }
}

export const imagePreloader = new ImagePreloader();