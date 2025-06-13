import vercel from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
const config = {
	preprocess: preprocess({
		scss: {},
		postcss: true
	}),
	kit: {
		adapter: vercel()
	}
};

export default config;
