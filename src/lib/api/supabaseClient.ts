import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Custom storage wrapper to prevent memory leaks and excessive events
class ThrottledStorage {
    private updateTimeout: number | null = null;
    private storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    getItem(key: string): string | null {
        try {
            return this.storage.getItem(key);
        } catch (error) {
            console.warn('Storage getItem error:', error);
            return null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            // Throttle storage writes to prevent excessive events
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }

            this.updateTimeout = window.setTimeout(() => {
                try {
                    this.storage.setItem(key, value);
                } catch (error) {
                    console.warn('Storage setItem error:', error);
                }
                this.updateTimeout = null;
            }, 50); // 50ms throttle
        } catch (error) {
            console.warn('Storage setItem error:', error);
        }
    }

    removeItem(key: string): void {
        try {
            this.storage.removeItem(key);
        } catch (error) {
            console.warn('Storage removeItem error:', error);
        }
    }

    clear(): void {
        try {
            this.storage.clear();
        } catch (error) {
            console.warn('Storage clear error:', error);
        }
    }

    get length(): number {
        try {
            return this.storage.length;
        } catch (error) {
            console.warn('Storage length error:', error);
            return 0;
        }
    }

    key(index: number): string | null {
        try {
            return this.storage.key(index);
        } catch (error) {
            console.warn('Storage key error:', error);
            return null;
        }
    }
}

// Create throttled storage instance
const throttledStorage = typeof window !== 'undefined'
    ? new ThrottledStorage(window.localStorage)
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Ensure session persistence
        autoRefreshToken: true, // Automatically refresh tokens
        detectSessionInUrl: true, // Detect session in URL
        storage: throttledStorage as any, // Use throttled storage
        storageKey: 'quizzems-auth-token', // Custom storage key
        flowType: 'pkce' // Use PKCE flow for better security
    }
});

export async function getSession() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error);
            return null;
        }

        return data.session;
    } catch (e) {
        console.error('Supabase getSession threw:', e);
        return null;
    }
}

// Get current user from session
export async function getCurrentUser() {
    try {
        const session = await getSession();
        return session?.user ?? null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

export async function getImageUrl(path: string) {
    const parts = path.split('/');
    const filename = parts.pop();
    const folder = parts.join('/');

    const { data: files, error } = await supabase
        .storage
        .from('uploads')
        .list(folder, { limit: 100 }); // Adjust limit if needed

    if (error || !files?.some(file => file.name === filename)) {
        return null;
    }

    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return data?.publicUrl ?? null;
}