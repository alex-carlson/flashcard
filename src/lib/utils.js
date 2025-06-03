import { supabase } from '../lib/supabaseClient';

/**
 * Gets the user's name from the Supabase `profiles` table by their ID.
 * Returns "Anonymous" if ID is "0", or null if not found or on error.
 */
export async function getUserName(id) {
    console.log('Fetching username for ID:', id);
    if (id === '0') {
        return 'Anonymous';
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching username:', error);
        return null;
    }

    return data?.username || "Anonymous";
}
