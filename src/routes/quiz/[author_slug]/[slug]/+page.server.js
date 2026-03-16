// src/routes/[author_slug]/[slug]/+page.server.ts
export const prerender = false;
import { fetchUserBySlug } from '$lib/api/user';
import { fetchCollectionByAuthorAndSlug, fetchCollectionById } from '$lib/api/collections';

export const load = async ({ params }) => {
    const { author_slug, slug } = params;
    console.log('Server: Loading quiz page with params:', { author_slug, slug });

    try {
        const author = await fetchUserBySlug(author_slug);
        console.log('Server: Author fetch result:', author);
        if (!author) {
            console.log('Server: Author not found, returning error data');
            return {
                status: 404,
                error: 'Author not found',
                author: 'Unknown',
                category: 'Unknown',
                thumbnail: null,
                collectionId: null,
                timesPlayed: 0,
                quizScore: null,
                meta: {
                    title: "Quizzems - Bar Trivia with Attitude",
                    description: "Make your brain bigger and smarter, fight your friends! Waste an afternoon.",
                    image: "/ogimage.jpg",
                    url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
                }
            };
        }

        // Fetch collection thumbnail from DB or API
        const collectionId = await fetchCollectionByAuthorAndSlug(author.public_id, slug);
        console.log('Server: Collection ID fetch result:', collectionId);
        if (!collectionId) {
            console.log('Server: Collection not found, returning error data');
            return {
                status: 404,
                error: 'Collection not found',
                author: author.username,
                category: 'Unknown',
                thumbnail: null,
                collectionId: null,
                timesPlayed: 0,
                quizScore: null,
                meta: {
                    title: `Quiz not found by ${author.username} | Quizzems`,
                    description: "This quiz could not be found.",
                    image: "/ogimage.jpg",
                    url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
                }
            };
        }

        const collection = await fetchCollectionById(collectionId);
        console.log('Server: Collection fetch result:', collection ? 'found' : 'not found');
        console.log('Server: Collection data keys:', collection ? Object.keys(collection) : 'null');

        const score = getScoreByQuizId(author?.quizzes_completed, collectionId);

        const result = {
            author: author.username,
            category: collection?.category,
            thumbnail: collection?.thumbnail_url || null,
            collectionId: collection?.id || collectionId, // Fallback to the ID we fetched
            timesPlayed: collection?.times_played || 0,
            quizScore: score,
            meta: {
                title: `${collection?.category} by ${author.username} | Quizzems`,
                description: collection?.description || 'Take this quiz and test your knowledge!',
                image: collection?.thumbnail_url || '/ogimage.jpg',
                url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
            }
        };

        console.log('Server: Final result data:', {
            collectionId: result.collectionId,
            category: result.category,
            author: result.author,
            thumbnail: result.thumbnail
        });

        return result;
    } catch (error) {
        console.error('Error loading quiz page:', error);
        return {
            status: 500,
            error: 'Failed to load quiz data',
            author: 'Unknown',
            category: 'Unknown',
            thumbnail: null,
            collectionId: null,
            timesPlayed: 0,
            quizScore: null,
            meta: {
                title: "Error | Quizzems",
                description: "An error occurred loading this quiz.",
                image: "/ogimage.jpg",
                url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
            }
        };
    }
};

function getScoreByQuizId(data, quizId) {
    const entry = data.find(item => item.quiz_id === quizId);
    return entry ? entry.percentage : null; // or any fallback value
}

