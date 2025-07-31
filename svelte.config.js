import adapter from '@sveltejs/adapter-vercel';

const config = {
	kit: {
		adapter: adapter(),
		// prerender: {
		// 	entries: ['*']
		// }
	}
};

export default config;
