<script>
	import FlashCards from '$lib/FlashCards.svelte';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { fetchCollectionByAuthorAndSlug } from '$lib/api/collections';
	import { fetchUserBySlug } from '$lib/api/user';
	let author_slug = null;
	let author_id = null; // Keeping this for reference, but using author_slug in the page params
	let category = null;
	let collectionId = null;
	let loading = true;

	const unsubscribe = page.subscribe(($page) => {
		author_slug = $page.params.author_slug;
		category = $page.params.slug;
		collectionId = $page.state?.collectionId || null;

		if (collectionId) {
			loading = false;
		}
	});

	onMount(async () => {
		if (!collectionId && author_slug && category) {
			try {
				const authorData = await fetchUserBySlug(author_slug);
				author_id = authorData?.public_id;

				collectionId = await fetchCollectionByAuthorAndSlug(author_id, category);
			} catch (error) {
				console.error('Error fetching collection by author/slug:', error);
			} finally {
				loading = false;
			}
		} else if (collectionId) {
			loading = false;
		} else {
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
