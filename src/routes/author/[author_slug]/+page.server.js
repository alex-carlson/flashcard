export const load = async ({ params }) => {
    const { author_slug } = params;

    try {
        // Fetch user data from the API
        const userResponse = await fetch(`${process.env.VITE_API_URL}/users/slug/${author_slug}`);
        let userData = null;

        if (userResponse.ok) {
            userData = await userResponse.json();
        } else {
            // Fallback to username endpoint
            const usernameResponse = await fetch(`${process.env.VITE_API_URL}/users/username/${author_slug}`);
            if (usernameResponse.ok) {
                userData = await usernameResponse.json();
            }
        }

        if (userData) {
            // Fetch user's collections count
            const collectionsResponse = await fetch(`${process.env.VITE_API_URL}/collections/user/all/${userData.id}`);
            let collectionsCount = 0;

            if (collectionsResponse.ok) {
                const collections = await collectionsResponse.json();
                collectionsCount = collections?.length || 0;
            } const displayName = userData.username || author_slug;
            const bio = userData.bio || `View ${displayName}'s flash card collections and quizzes.`;
            const avatarUrl = userData.avatar || `/images/authors/${author_slug}.jpg`;
            const pageUrl = `/author/${author_slug}`;
            const siteName = 'Flash Cards';

            return {
                title: `${displayName} - Flash Card Collections`,
                description: `${displayName} has published ${collectionsCount} flash card collections. ${bio}`,
                image: avatarUrl,
                url: pageUrl,
                // Open Graph metadata
                og: {
                    title: `${displayName} - Flash Card Collections`,
                    description: `${displayName} has published ${collectionsCount} flash card collections. ${bio}`,
                    image: avatarUrl,
                    url: pageUrl,
                    type: 'profile',
                    siteName: siteName,
                    profile: {
                        firstName: displayName.split(' ')[0] || displayName,
                        lastName: displayName.split(' ').slice(1).join(' ') || '',
                        username: userData.username
                    }
                },
                // Twitter Card metadata
                twitter: {
                    card: 'summary_large_image',
                    title: `${displayName} - Flash Card Collections`,
                    description: `${displayName} has published ${collectionsCount} flash card collections. ${bio}`,
                    image: avatarUrl,
                    creator: `@${userData.username}`,
                    site: '@flashcards'
                },
                // Additional metadata
                meta: {
                    author: displayName,
                    keywords: `flash cards, ${displayName}, quizzes, learning, study, education`,
                    robots: 'index, follow',
                    canonical: pageUrl
                },
                userData: {
                    id: userData.id,
                    username: userData.username,
                    bio: userData.bio,
                    avatar: userData.avatar,
                    collectionsCount
                }
            };
        } else {
            // Fallback if user not found
            const fallbackUrl = `/author/${author_slug}`;
            const fallbackImage = `/images/authors/${author_slug}.jpg`;
            const fallbackDescription = `Author profile for ${author_slug}. Flash card collections and quizzes.`;

            return {
                title: `Author: ${author_slug}`,
                description: fallbackDescription,
                image: fallbackImage,
                url: fallbackUrl,
                // Open Graph metadata
                og: {
                    title: `Author: ${author_slug}`,
                    description: fallbackDescription,
                    image: fallbackImage,
                    url: fallbackUrl,
                    type: 'profile',
                    siteName: 'Flash Cards'
                },
                // Twitter Card metadata
                twitter: {
                    card: 'summary',
                    title: `Author: ${author_slug}`,
                    description: fallbackDescription,
                    image: fallbackImage,
                    site: '@flashcards'
                },
                // Additional metadata
                meta: {
                    author: author_slug,
                    keywords: `flash cards, ${author_slug}, quizzes, learning, study, education`,
                    robots: 'index, follow',
                    canonical: fallbackUrl
                },
                userData: null
            };
        }
    } catch (error) {
        console.error('Error loading author data:', error);

        // Fallback on error
        const errorUrl = `/author/${author_slug}`;
        const errorImage = `/images/authors/${author_slug}.jpg`;
        const errorDescription = `Author profile for ${author_slug}. Flash card collections and quizzes.`;

        return {
            title: `Author: ${author_slug}`,
            description: errorDescription,
            image: errorImage,
            url: errorUrl,
            // Open Graph metadata
            og: {
                title: `Author: ${author_slug}`,
                description: errorDescription,
                image: errorImage,
                url: errorUrl,
                type: 'profile',
                siteName: 'Flash Cards'
            },
            // Twitter Card metadata
            twitter: {
                card: 'summary',
                title: `Author: ${author_slug}`,
                description: errorDescription,
                image: errorImage,
                site: '@flashcards'
            },
            // Additional metadata
            meta: {
                author: author_slug,
                keywords: `flash cards, ${author_slug}, quizzes, learning, study, education`,
                robots: 'index, follow',
                canonical: errorUrl
            },
            userData: null
        };
    }
};
