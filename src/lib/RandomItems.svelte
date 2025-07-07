<script>
	import { fetchRandomCollections } from './api/collections';
	import Fa from 'svelte-fa';
	import { faRefresh } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	export let onCollectionClick;

	let randomItemsPromise;

	onMount(() => {
		refresh();
	});

	function refresh() {
		randomItemsPromise = fetchRandomCollections(3);
		console.log('Random items promise initialized');
		console.log(randomItemsPromise);
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

<div class="randomCollections">
	{#await randomItemsPromise then data}
		<div class="grid condensed card-grid">
			{#each data as collection}
				<div class="card" on:click={() => onCollectionClick(collection)}>
					<img class="card-thumbnail" src={collection.thumbnail} alt={collection.category} />
					<div class="card-content">
						<span class="card-title">{collection.category} [{collection.itemsLength}]</span>
						<span class="card-meta sm"
							>{collection.author} - {formatDate(collection.created_at)}</span
						>
					</div>
				</div>
			{/each}
		</div>
		<button class="refresh mt-3" on:click={refresh}>
			<span>
				<Fa icon={faRefresh} />
				Refresh
			</span>
		</button>
	{:catch error}
		<p class="error">Error loading latest collections: {error.message}</p>
	{/await}
</div>

<style>
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}
</style>
