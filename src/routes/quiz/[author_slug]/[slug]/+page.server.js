// src/routes/[author_slug]/[slug]/+page.server.ts
import { fetchUserBySlug } from '$lib/api/user';
import { fetchCollectionByAuthorAndSlug, fetchCollectionById } from '$lib/api/collections';
import { faL } from '@fortawesome/free-solid-svg-icons';

export const load = async ({ params }) => {
    const { author_slug, slug } = params;
    const author = await fetchUserBySlug(author_slug);
    if (!author) return { status: 404 };

    console.log('Author:', author);

    // Fetch collection thumbnail from DB or API
    const collectionId = await fetchCollectionByAuthorAndSlug(author.public_id, slug, { includeThumbnail: true });
    const collection = await fetchCollectionById(collectionId);

    console.log('Collection:', collection);

    return {
        author: author.username,
        category: collection?.category,
        thumbnail: collection?.thumbnail_url || null,
        collectionId: collection?.id,
    };
};
