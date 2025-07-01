<script>
	import { onMount } from 'svelte';
	import { getImageUrl } from './api/supabaseClient';
	import { fetchLatestCollections } from './api/collections';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	export let count = 12;

	let collections = [];
	let loading = true;

	// Helper: prepare collection for UI
	function prepareCollection(collection) {
		const path = `${collection.author}/${collection.category}/thumbnail.jpg`;
		return {
			...collection,
			imageUrl: null,
			imagePath: path,
			fallbackImage: collection.items[0]?.image || null
		};
	}

	async function loadCollections() {
		try {
			console.log('Latest: Starting to fetch collections...');
			const raw = await fetchLatestCollections(12);
			console.log('Latest: Collections fetched:', raw?.length || 0);

			if (!raw || raw.length === 0) {
				console.warn('Latest: No collections returned');
				collections = [];
				loading = false;
				return;
			}

			// Render immediately with fallback images
			collections = raw.map(prepareCollection);
			loading = false;
			console.log('Latest: UI rendered, loading images in background...');

			// Defer image loading in background
			Promise.all(
				collections.map(async (collection, i) => {
					try {
						const url = await getImageUrl(collection.imagePath);
						if (url) collections[i].imageUrl = url;
					} catch (error) {
						console.warn('Latest: Failed to load image for:', collection.category, error);
					}
				})
			).then(() => {
				collections = [...collections];
				console.log('Latest: Background image loading complete');
			});
		} catch (error) {
			console.error('Latest: Error loading collections:', error);
			collections = [];
			loading = false;
		}
	}
	onMount(() => {
		// Use immediate execution instead of requestIdleCallback for faster loading
		loadCollections();
	});
</script>

<div class="list grid">
	{#if collections.length > 0}
		<ul>
			{#each collections as collection}
				<CollectionCard {collection} />
			{/each}
		</ul>
	{:else}
		<p class="empty">No collections found.</p>
	{/if}
</div>

<style>
	.placeholder {
		display: flex;
		align-items: center;
		margin-bottom: 1em;
		gap: 1em;
	}

	.image-placeholder {
		border-radius: 4px;
		background: #eee;
		flex-shrink: 0;
	}

	.text-placeholder {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.line {
		border-radius: 4px;
		background: #eee;
		margin-bottom: 0.4em;
	}

	.shimmer {
		background: linear-gradient(45deg, #e0e0e0 0%, #cccccc 20%, #e0e0e0 40%, #e0e0e0 100%);
		background-size: 200% 100%;
		animation: shimmer 2.4s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
