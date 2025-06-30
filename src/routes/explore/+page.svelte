<script>
	import SortAndFilter from '$lib/SortAndFilter.svelte';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { fetchCollections } from '$lib/api/collections';
	import { onMount } from 'svelte';
	import { formatTimestamp } from '$lib/api/utils.js';
	import CollectionCard from '$lib/components/CollectionCard.svelte';

	let collections = [];
	let filteredCollections = [];
	let page = 0;
	let sortOption = 'date';
	let itemsPerPage = 20;
	let loading = true;

	function nextPage() {
		if ((page + 1) * itemsPerPage < filteredCollections.length) {
			page++;
		}
	}

	function prevPage() {
		if (page > 0) {
			page--;
		}
	}

	// Reactive statement for paginated collections
	$: paginatedCollections = filteredCollections.slice(
		page * itemsPerPage,
		(page + 1) * itemsPerPage
	);

	// Reset page to 0 when itemsPerPage changes
	$: {
		page = 0;
	}
	onMount(async () => {
		document.title = 'Explore';
		console.log('Starting to fetch collections...');
		try {
			collections = await fetchCollections();
			console.log('Collections fetched:', collections?.length || 0);
			if (collections) {
				filteredCollections = collections;
			} else {
				console.warn('No collections returned');
				collections = [];
				filteredCollections = [];
			}
		} catch (error) {
			console.error('Error fetching collections:', error);
			collections = [];
			filteredCollections = [];
		} finally {
			loading = false;
			console.log('Loading complete');
		}
	});
</script>

<div class="container mt-3">
	<h1>Explore</h1>
	<p>Discover a new quiz, practice up!</p>
</div>
{#if loading}
	<p>Loading collections...</p>
{:else}
	<SortAndFilter
		collection={collections}
		bind:sortOption
		bind:itemsPerPage
		on:sortAndFilterChange={(event) => {
			filteredCollections = event.detail;
			page = 0;
		}}
	/>
	<div class="container">
		<div class="list">
			<ul>
				{#each paginatedCollections as collection}
					<CollectionCard {collection} />
				{/each}
			</ul>
		</div>
	</div>

	<!-- Pagination controls -->
	<div class="paginationControls container margin-auto">
		<button on:click={prevPage} disabled={page === 0}>Previous</button>
		<span>
			Page {page + 1} of {Math.ceil(filteredCollections.length / itemsPerPage)}
		</span>
		<button on:click={nextPage} disabled={(page + 1) * itemsPerPage >= filteredCollections.length}>
			Next
		</button>
	</div>
{/if}
