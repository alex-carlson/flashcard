import { supabase } from '$lib/api/supabaseClient';

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
    if (!collectionId) {
        return null;
    }

    const { data, error } = await supabase
        .from('collections')
        .select('category, author, created_at, author_public_id, slug')
        .eq('id', collectionId)
        .single();

    if (error) {
        console.error('Error fetching collection name:', error);
        return null;
    }

    return data || null;
}

export function areStringsClose(a, b, threshold = 0.8) {
    a = a
        .replace(/\bthe\b/gi, "") // remove "the"
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ""); // remove all spaces

    b = b
        .replace(/\bthe\b/gi, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    if (!a || !b) return false;

    if (a.length < b.length) return false;

    const lenA = a.length;
    const lenB = b.length;
    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= lenB; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= lenA; j++) {
        matrix[0][j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= lenB; i++) {
        for (let j = 1; j <= lenA; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1, // deletion
                );
            }
        }
    }

    const distance = matrix[lenB][lenA];
    const maxLen = Math.max(lenA, lenB);
    const similarity = 1 - distance / maxLen;

    return similarity >= threshold;
}

export function mapCards(rawItems) {
    return rawItems
        .filter((card) => card != null)
        .map((card) => {
            const hasImage = !!card.image;
            const hasText = !!card.question;
            const hasAudio = !!card.audio;

            let type = "unknown";
            if (hasImage) type = "image";
            else if (hasText) type = "text";
            else if (hasAudio) type = "audio";

            return {
                ...card,
                imageUrl: card.image,
                revealed: false,
                loaded: false,
                hidden: false,
                scale: 1,
                userAnswer: "",
                answer: card.answer || "",
                type,
            };
        });
}