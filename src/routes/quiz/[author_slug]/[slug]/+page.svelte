<script>
	import FlashCards from '$lib/FlashCards.svelte';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { fetchCollectionByAuthorAndSlug } from '$lib/api/collections';

	let author_id = null;
	let category = null;
	let collectionId = null;
	let loading = true;
	const unsubscribe = page.subscribe(($page) => {
		author_id = $page.params.author_id;
		category = $page.params.slug;
		collectionId = $page.state?.collectionId || null;

		// If we have collectionId from state, we can stop loading
		if (collectionId) {
			loading = false;
		}
	});

	onMount(async () => {
		// If we don't have collectionId, fetch collection by author and slug
		if (!collectionId && author_id && category) {
			try {
				collectionId = await fetchCollectionByAuthorAndSlug(author_id, category);
				console.log('Fetched collectionId:', collectionId);
			} catch (error) {
				console.error('Error fetching collection by author/slug:', error);
			} finally {
				loading = false;
			}
		} else if (collectionId) {
			loading = false;
		}
	});

	onDestroy(unsubscribe);
</script>

<div>
	{#if loading}
		<p>Loading...</p>
	{:else if collectionId}
		<FlashCards {collectionId} />
	{:else}
		<p>Collection not found</p>
	{/if}
</div>
