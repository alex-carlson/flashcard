import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export
  eslint: {
    ignoreDuringBuilds: true,  // Ignore ESLint during build (optional)
  },
  basePath: '/flashcard',  // Adjust for GitHub Pages
  assetPrefix: '/flashcard/',  // Adjust for GitHub Pages
};

export default nextConfig;
