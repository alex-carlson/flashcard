import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			// $lib is built-in, no need to alias unless you want to override
			'$stores': path.resolve('./src/stores'),
			// avoid aliasing $routes because it conflicts with SvelteKit's routing
		}
	}
});
