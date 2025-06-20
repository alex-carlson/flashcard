<script>
	import { onMount } from 'svelte';
	import LazyLoadImage from './LazyLoadImage.svelte';
	import { getImageUrl } from './supabaseClient';
	import { fetchLatestCollections } from './collections';

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
		const collections = await fetchLatestCollections();

		// For each collection, attempt to fetch a valid image URL
		const resolved = await Promise.all(
			collections.map(async (collection) => {
				const path = `${collection.author}/${collection.category}/thumbnail.jpg`;
				const imageUrl = await getImageUrl(path);
				return {
					...collection,
					imageUrl: imageUrl || collection.items[0]?.image || null
				};
			})
		);

		collectionsWithImage = resolved;
		loading = false;
	}

	onMount(loadCollections);
</script>

<div class="list">
	{#if loading}
		<!-- Placeholder UI: show shimmer boxes or skeletons -->
		<ul>
			{#each Array(5) as _, i}
				<li class="placeholder" key={i}>
					<div class="image-placeholder shimmer" style="width:100px; height:100px;"></div>
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
				<li>
					<a href="/quiz/{collection.author_id}/{collection.slug}">
						{#if collection.items.length > 0}
							<LazyLoadImage
								imageUrl={collection.imageUrl || collection.items[0].image}
								tempSize="100px"
							/>
						{/if}

						<div class="vertical fill align-left">
							<span>
								{collection.category} [{collection.items.length}]
							</span>
							<span class="sm">
								{collection.author} - {formatDate(collection.created_at)}
							</span>
						</div>
					</a>
				</li>
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
