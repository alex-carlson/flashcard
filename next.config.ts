const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export', // Required for GitHub Pages
  basePath: isProd ? '/flashcard' : '', // Replace with your repo name
  assetPrefix: isProd ? '/flashcard/' : '',
  images: {
    unoptimized: true, // Fixes images issue on GitHub Pages
  },
};
