<script>
	import SortAndFilter from '$lib/SortAndFilter.svelte';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { fetchCollections } from '$lib/api/collections';
	import { getImageUrl } from '$lib/api/supabaseClient';
	import { onMount } from 'svelte';

	let collections = [];
	let filteredCollections = [];
	let page = 0;
	let sortOption = 'name';
	let itemsPerPage = 10;
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

	function formatTimestamp(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
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

<div class="container white">
	<h1>Explore</h1>
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

		<div class="list">
			<ul>
				{#each paginatedCollections as collection}
					<li>
						<a href="/quiz/{collection.author_id}/{collection.slug}">
							{#if collection.items.length > 0}
								<LazyLoadImage
									imagePath={`${collection.author}/${collection.category}/thumbnail.jpg`}
									imageUrl={collection.items[0].image}
									tempSize="100px"
								/>
							{/if}
							<p>
								{collection.category}
								{#if sortOption === 'date'}
									{formatTimestamp(collection.created_at)}
								{:else if sortOption === 'size'}
									[{collection.items.length}]
								{/if}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Pagination controls -->
		<div class="paginationControls">
			<button on:click={prevPage} disabled={page === 0}>Previous</button>
			<span>
				Page {page + 1} of {Math.ceil(filteredCollections.length / itemsPerPage)}
			</span>
			<button
				on:click={nextPage}
				disabled={(page + 1) * itemsPerPage >= filteredCollections.length}
			>
				Next
			</button>
		</div>
	{/if}
</div>
