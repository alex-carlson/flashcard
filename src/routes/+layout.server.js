// src/routes/+layout.server.js
export const ssr = true;

export async function load({ data }) {
    return {
        // Defaults (used if page doesn't override)
        meta: {
            title: data?.meta.title ?? 'Quizzems - Bar Trivia with Attitude',
            description: data?.meta.description ?? 'Make your brain bigger and smarter, fight your friends! Waste an afternoon.',
            image: data?.meta.image ?? '/ogimage.jpg',
            url: data?.meta.url ?? 'https://quizzems.com',
            siteName: data?.meta.siteName ?? 'Quizzems',
            themeColor: data?.meta.themeColor ?? '#6F1D1B'
        }
    };
}
