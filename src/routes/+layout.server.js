// src/routes/+layout.server.js
export const ssr = true;

export async function load({ data }) {
    // If the page provides its own meta, use it directly
    if (data?.meta) {
        return { meta: data.meta };
    }
    // Otherwise, use defaults
    return {
        meta: {
            title: 'Quizzems - Bar Trivia with Attitude',
            description: 'Make your brain bigger and smarter, fight your friends! Waste an afternoon.',
            image: '/ogimage.jpg',
            url: 'https://quizzems.com',
            siteName: 'Quizzems',
            themeColor: '#6F1D1B'
        }
    };
}
