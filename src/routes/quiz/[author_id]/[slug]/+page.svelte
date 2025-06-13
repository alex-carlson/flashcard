<script>
	import FlashCards from '$lib/FlashCards.svelte';
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';

	let author_id = null;
	let category = null;

	const unsubscribe = page.subscribe(($page) => {
		author_id = $page.params.author_id;
		category = $page.params.slug;

		// set page title to <category> by <author_id>
		document.title = `${category}`;
	});

	onDestroy(unsubscribe);
</script>

<div>
	<!-- if collectionId is null, show loading instead -->
	{#if author_id == null || category == null}
		<p>Loading...</p>
	{:else}
		<FlashCards {author_id} collection={category} />
	{/if}
</div>
