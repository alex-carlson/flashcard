import { writable, get } from 'svelte/store';

interface CacheEntry {
    data: unknown;
    timestamp: number;
    expiry: number;
}

interface CacheStore {
    latest: Record<string, CacheEntry>;
    random: Record<string, CacheEntry>;
    collections: Record<string, CacheEntry>;
}

export const cachedData = writable<CacheStore>({
    latest: {},
    random: {},
    collections: {}
});

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.expiry;
}

export async function fetchLatestCollections(limit = 12, cacheDuration = DEFAULT_CACHE_DURATION) {
    const cacheKey = `limit_${limit}`;
    const currentData = get(cachedData);

    // Check if we have valid cached data
    const cachedEntry = currentData.latest[cacheKey];
    if (cachedEntry && !isExpired(cachedEntry)) {
        console.log('Returning cached latest collections');
        return cachedEntry.data;
    }

    try {
        console.log(`Fetching latest collections (limit: ${limit})`);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/collections/latest?limit=${limit}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch latest collections: ${res.statusText}`);
        }

        const data = await res.json();

        // Update cache
        cachedData.update(cache => ({
            ...cache,
            latest: {
                ...cache.latest,
                [cacheKey]: {
                    data,
                    timestamp: Date.now(),
                    expiry: cacheDuration
                }
            }
        }));

        return data;
    } catch (error) {
        console.error('Error fetching latest collections:', error);

        // Return stale data if available
        if (cachedEntry) {
            console.log('Returning stale cached data due to fetch error');
            return cachedEntry.data;
        }

        throw error;
    }
}

export async function fetchRandomCollections(limit = 10, cacheDuration = DEFAULT_CACHE_DURATION) {
    const cacheKey = `limit_${limit}`;
    const currentData = get(cachedData);

    // Check if we have valid cached data
    const cachedEntry = currentData.random[cacheKey];
    if (cachedEntry && !isExpired(cachedEntry)) {
        console.log('Returning cached random collections');
        return cachedEntry.data;
    }

    try {
        console.log(`Fetching random collections (limit: ${limit})`);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/collections/random/${limit}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch random collections: ${res.statusText}`);
        }

        const data = await res.json();

        // Update cache
        cachedData.update(cache => ({
            ...cache,
            random: {
                ...cache.random,
                [cacheKey]: {
                    data,
                    timestamp: Date.now(),
                    expiry: cacheDuration
                }
            }
        }));

        return data;
    } catch (error) {
        console.error('Error fetching random collections:', error);

        // Return stale data if available
        if (cachedEntry) {
            console.log('Returning stale cached data due to fetch error');
            return cachedEntry.data;
        }

        throw error;
    }
}

export async function fetchCollectionData(collectionId: string, cacheDuration = DEFAULT_CACHE_DURATION) {
    const cacheKey = collectionId;
    const currentData = get(cachedData);

    // Check if we have valid cached data
    const cachedEntry = currentData.collections[cacheKey];
    if (cachedEntry && !isExpired(cachedEntry)) {
        console.log(`Returning cached collection data for ${collectionId}`);
        return cachedEntry.data;
    }

    try {
        console.log(`Fetching collection data for ${collectionId}`);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/collections/${collectionId}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch collection: ${res.statusText}`);
        }

        const data = await res.json();

        // Update cache
        cachedData.update(cache => ({
            ...cache,
            collections: {
                ...cache.collections,
                [cacheKey]: {
                    data,
                    timestamp: Date.now(),
                    expiry: cacheDuration
                }
            }
        }));

        return data;
    } catch (error) {
        console.error(`Error fetching collection ${collectionId}:`, error);

        // Return stale data if available
        if (cachedEntry) {
            console.log('Returning stale cached data due to fetch error');
            return cachedEntry.data;
        }

        throw error;
    }
}

// Clear all cached data
export function clearCache() {
    cachedData.set({
        latest: {},
        random: {},
        collections: {}
    });
}

// Clear specific cache type
export function clearCacheType(type: 'latest' | 'random' | 'collections') {
    cachedData.update(cache => ({
        ...cache,
        [type]: {}
    }));
}

// Clear expired entries
export function clearExpiredCache() {
    cachedData.update(cache => {
        const cleanCache = (entries: Record<string, CacheEntry>) => {
            const cleaned: Record<string, CacheEntry> = {};
            Object.entries(entries).forEach(([key, entry]) => {
                if (!isExpired(entry)) {
                    cleaned[key] = entry;
                }
            });
            return cleaned;
        };

        return {
            latest: cleanCache(cache.latest),
            random: cleanCache(cache.random),
            collections: cleanCache(cache.collections)
        };
    });
}