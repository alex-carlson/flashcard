// src/routes/+layout.server.js
export const ssr = true;

export async function load({ data }) {
    return {
        // Defaults (used if page doesn't override)
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
