<script>
	import { onMount } from 'svelte';
	import { fetchLatestCollections } from './api/collections';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import { addToast } from '../stores/toast';

	export let count = 12;

	let collections = [];
	let loading = true;

	async function loadCollections() {
		try {
			collections = await fetchLatestCollections(count);
		} catch (error) {
			console.error('Latest: Error loading collections:', error);
			addToast({
				type: 'error',
				message: 'Failed to load collections. Please try again later.'
			});
			collections = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCollections();
	});
</script>

<div class="list grid condensed">
	{#if loading}
		<p>Loading collections...</p>
	{:else if collections.length > 0}
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
