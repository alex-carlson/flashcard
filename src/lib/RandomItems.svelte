<script>
	import LazyLoadImage from './LazyLoadImage.svelte';
	import { fetchRandomCollections } from './collections';
	import Fa from 'svelte-fa';
	import { faRefresh } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	export let onCollectionClick;

	let randomItems = [];
	onMount(() => {
		// Fetch initial random collections when component mounts
		randomItems = fetchRandomCollections(3);
	});

	function refresh() {
		randomItems = fetchRandomCollections(3);
	}

	// convert timestamptz to mm/dd/yyyy format
	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}
</script>

<div class="list">
	<button class="refresh" on:click={refresh}>
		<Fa icon={faRefresh} />
		<span>Refresh</span>
	</button>
	{#await randomItems then data}
		{#if data.length > 0}
			<ul>
				{#each data as collection}
					<li>
						<a
							href="/{collection.author_id}/{collection.category}"
							on:click|preventDefault={() => onCollectionClick(collection)}
						>
							{#if collection.items.length > 0}
								<LazyLoadImage imageUrl={collection.items[0].image} />
							{/if}
							<div class="vertical fill align-left">
								<span>{collection.category} [{collection.items.length}]</span>
								<span class="sm">{collection.author} - {formatDate(collection.created_at)}</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">No latest collections available.</p>
		{/if}
	{:catch error}
		<p class="error">Error loading latest collections: {error.message}</p>
	{/await}
</div>
