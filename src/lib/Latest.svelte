<script>
	import { onMount } from 'svelte';
	import { getImageUrl } from './api/supabaseClient';
	import { fetchLatestCollections } from './api/collections';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	export let count = 12;

	let collectionsWithImage = [];
	let loading = true;

	// Convert timestamptz to mm/dd/yyyy format
	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}
	async function loadCollections() {
		try {
			console.log('Latest: Starting to fetch collections...');
			const collections = await fetchLatestCollections(12);
			console.log('Latest: Collections fetched:', collections?.length || 0);

			if (!collections || collections.length === 0) {
				console.warn('Latest: No collections returned');
				collectionsWithImage = [];
				loading = false;
				return;
			}

			collectionsWithImage = collections.map((collection) => {
				const path = `${collection.author}/${collection.category}/thumbnail.jpg`;
				return {
					...collection,
					imageUrl: null,
					imagePath: path,
					fallbackImage: collection.items[0]?.image || null
				};
			});
			loading = false; // Render list immediately
			console.log('Latest: UI rendered, loading images in background...');

			// Defer image loading in background
			Promise.all(
				collectionsWithImage.map(async (collection) => {
					try {
						const url = await getImageUrl(collection.imagePath);
						if (url) collection.imageUrl = url;
					} catch (error) {
						console.warn('Latest: Failed to load image for:', collection.category, error);
					}
				})
			).then(() => {
				// Force update after all images attempted
				collectionsWithImage = [...collectionsWithImage];
				console.log('Latest: Background image loading complete');
			});
		} catch (error) {
			console.error('Latest: Error loading collections:', error);
			collectionsWithImage = [];
			loading = false;
		}
	}
	onMount(() => {
		// Use immediate execution instead of requestIdleCallback for faster loading
		loadCollections();
	});
</script>

<div class="list">
	{#if loading}
		<ul>
			{#each Array(5) as _, i}
				<li class="placeholder" key={i}>
					<div class="image-placeholder shimmer" style="width:80px; height:80px;"></div>
					<div class="text-placeholder">
						<div class="line shimmer" style="width: 60%; height: 1em; margin-bottom: 0.3em;"></div>
						<div class="line shimmer" style="width: 40%; height: 0.8em;"></div>
					</div>
				</li>
			{/each}
		</ul>
	{:else if collectionsWithImage.length > 0}
		<ul>
			{#each collectionsWithImage as collection}
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
