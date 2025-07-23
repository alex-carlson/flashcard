<script>
	import { onMount } from 'svelte';
	import Collections from '$lib/Collections.svelte';
	import { apiFetch } from '$lib/api/fetchdata';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	let collections = [];
	let tag = '';
	let isLoading = true;
	let error = null;

	onMount(async () => {
		tag = get(page).params.tag;
		await fetchCollectionsByTag();
	});

	async function fetchCollectionsByTag() {
		isLoading = true;
		error = null;
		try {
			const result = await apiFetch(`/collections/byTag/${encodeURIComponent(tag)}`);
			if (Array.isArray(result)) {
				collections = result;
			} else {
				collections = [];
			}
			console.log('Fetched collections:', collections);
		} catch (e) {
			error = 'Failed to load collections for this tag.';
			collections = [];
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Collections tagged "{tag}"</title>
</svelte:head>

<div class="container white pt-4">
	<h2>Collections tagged <span class="badge bg-primary">{tag}</span></h2>
	{#if isLoading}
		<p>Loading collections...</p>
	{:else if error}
		<p class="text-danger">{error}</p>
	{:else if collections.length === 0}
		<p>No collections found for this tag.</p>
	{:else}
		<Collections {collections} grid list limit={-1} />
	{/if}
</div>
