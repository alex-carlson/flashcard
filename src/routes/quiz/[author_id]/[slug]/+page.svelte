<script>
	import FlashCards from '$lib/FlashCards.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';

	let author_id = null;
	let category = null;
	let mounted = false;

	// Initialize params from current page state
	$: if ($page?.params) {
		author_id = $page.params.author_id || null;
		category = $page.params.slug || null;

		// Only set title if we have valid params and are mounted
		if (mounted && category) {
			document.title = `${category}`;
		}
	}

	onMount(() => {
		mounted = true;
		// Set title on mount if category is available
		if (category) {
			document.title = `${category}`;
		}
	});
</script>

<div>
	<!-- Wait for both params to be available and component to be mounted -->
	{#if !mounted || !author_id || !category}
		<p>Loading...</p>
	{:else}
		<FlashCards {author_id} collection={category} />
	{/if}
</div>
