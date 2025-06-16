<script>
	export const prerender = true;

	import { onMount } from 'svelte';
	console.log('404 page');
	onMount(() => {
		// Any additional setup can go here
		document.title = '404 Page Not Found';
	});
</script>

<h1>404 Page Not Found</h1>
