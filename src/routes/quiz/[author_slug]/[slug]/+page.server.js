// src/routes/[author_slug]/[slug]/+page.server.ts
export const prerender = false;
import { fetchUserBySlug } from '$lib/api/user';
import { fetchCollectionByAuthorAndSlug, fetchCollectionById } from '$lib/api/collections';

export const load = async ({ params, url }) => {
    const { author_slug, slug } = params;
    console.log('Server: Loading quiz page with params:', { author_slug, slug });
    console.log('Server: Full URL:', url.href);
    console.log('Server: Params object:', params);

    // Validate that we actually have the required params
    if (!author_slug || !slug) {
        console.error('Server: Missing required params', { author_slug, slug });
        return {
            status: 400,
            author: 'Unknown',
            category: 'Unknown',
            thumbnail: null,
            collectionId: null,
            timesPlayed: 0,
            quizScore: null,
            meta: {
                title: "Invalid URL | Quizzems",
                description: "Invalid quiz URL parameters.",
                image: "/ogimage.jpg",
                url: url.href,
            }
        };
    }

    try {
        console.log('Server: Environment check:', {
            VITE_API_URL: import.meta.env.VITE_API_URL,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL
        });

        console.log('Server: Fetching user with slug:', author_slug);
        
        // Add temporary API URL debugging right here
        console.log('Server: VITE_API_URL check:', import.meta.env.VITE_API_URL);
        const testUrl = `${import.meta.env.VITE_API_URL}/users/username/${author_slug}`;
        console.log('Server: Constructed URL:', testUrl);
        
        const author = await fetchUserBySlug(author_slug);
        console.log('Server: Author fetch result:', author ? { username: author.username, public_id: author.public_id } : 'NOT FOUND');
        if (!author) {
            console.log('Server: Author not found for slug:', author_slug);
            const errorResponse = {
                status: 404,
                author: 'Unknown',
                category: 'Unknown', 
                thumbnail: null,
                collectionId: null,
                timesPlayed: 0,
                quizScore: null,
                meta: {
                    title: "Quiz Not Found | Quizzems",
                    description: "Author not found.",
                    image: "/ogimage.jpg",
                    url: url.href,
                }
            };
            console.log('Server: Returning error response:', errorResponse);
            return errorResponse;
        }
            return {
                status: 404,
                author: 'Unknown',
                category: 'Unknown',
                thumbnail: null,
                collectionId: null,
                timesPlayed: 0,
                quizScore: null,
                meta: {
                    title: "Quiz Not Found | Quizzems",
                    description: "Author not found.",
                    image: "/ogimage.jpg",
                    url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
                }
            };
        }

        // Fetch collection thumbnail from DB or API
        console.log('Server: Fetching collection with author public_id:', author.public_id, 'and slug:', slug);
        const collectionId = await fetchCollectionByAuthorAndSlug(author.public_id, slug);
        console.log('Server: Collection ID fetch result:', collectionId);
        if (!collectionId) {
            console.log('Server: Collection not found for author:', author.username, 'slug:', slug);
            return {
                status: 404,
                author: author.username,
                category: 'Unknown',
                thumbnail: null,
                collectionId: null,
                timesPlayed: 0,
                quizScore: null,
                meta: {
                    title: `Quiz Not Found by ${author.username} | Quizzems`,
                    description: "Collection not found.",
                    image: "/ogimage.jpg",
                    url: `https://quizzems.com/quiz/${author_slug}/${slug}`,
                }
            };
        }

        const collection = await fetchCollectionById(collectionId);
        console.log('Server: Collection fetch result:', collection ? 'found' : 'not found');
        console.log('Server: Collection data keys:', collection ? Object.keys(collection) : 'null');

        const score = getScoreByQuizId(author?.quizzes_completed ?? [], collectionId);

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

