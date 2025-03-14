/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",  // Enables static export for GitHub Pages
  images: {
    unoptimized: true,  // Disables image optimization for static export
  },
  basePath: "/flashcard", // Use your repo name if applicable
  assetPrefix: "/flashcard/", // Ensures assets are loaded correctly
};

module.exports = nextConfig;
