// src/routes/[author_slug]/[slug]/+page.server.ts
export const prerender = false;
import { fetchUserBySlug } from '$lib/api/user';
import { fetchCollectionByAuthorAndSlug, fetchCollectionById } from '$lib/api/collections';

export const load = async ({ params }) => {
    const { author_slug, slug } = params;
    const author = await fetchUserBySlug(author_slug);
    if (!author) return { status: 404 };

    // Fetch collection thumbnail from DB or API
    const collectionId = await fetchCollectionByAuthorAndSlug(author.public_id, slug, { includeThumbnail: true });
    const collection = await fetchCollectionById(collectionId);
    const score = getScoreByQuizId(author?.quizzes_completed, collectionId);

    console.log("Collection thumbnail_url: ", collection?.thumbnail_url);

    return {
        author: author.username,
        category: collection?.category,
        thumbnail: collection?.thumbnail_url || null,
        collectionId: collection?.id,
        quizScore: score,
    };
};

function getScoreByQuizId(data, quizId) {
    const entry = data.find(item => item.quiz_id === quizId);
    return entry ? entry.percentage : null; // or any fallback value
}

