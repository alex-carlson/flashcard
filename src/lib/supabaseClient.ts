import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSession() {
    console.log('Supabase getSession called');
    console.log('localStorage:', typeof localStorage !== 'undefined');

    try {
        console.log('Calling supabase.auth.getSession...');
        const { data, error } = await supabase.auth.getSession();

        if (data) console.log('Session data:', data);
        if (error) console.error('Session error:', error);

        return { data, error };
    } catch (e) {
        console.error('Supabase getSession threw:', e);
        return { data: null, error: e };
    }
}
