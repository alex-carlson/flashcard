import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Ensure session persistence
        autoRefreshToken: true, // Automatically refresh tokens
        detectSessionInUrl: true, // Detect session in URL
    }
});

export async function getSession() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) console.error('Session error:', error);

        return data.session; // ✅ Return the session directly
    } catch (e) {
        console.error('Supabase getSession threw:', e);
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