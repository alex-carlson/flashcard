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

export async function getUserQuizScores(id) {
    console.log('Fetching quiz scores for ID:', id);
    if (id === '0') {
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('quizzes_completed')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching quiz scores:', error);
        return null;
    }

    return data.quizzes_completed || null;
}

export async function getCollectionMetadataFromId(collectionId) {
    console.log('Fetching collection name for ID:', collectionId);
    if (!collectionId) {
        return null;
    }

    const { data, error } = await supabase
        .from('collections')
        .select('category, author, created_at, author_id')
        .eq('id', collectionId)
        .single();

    if (error) {
        console.error('Error fetching collection name:', error);
        return null;
    }

    return data || null;
}