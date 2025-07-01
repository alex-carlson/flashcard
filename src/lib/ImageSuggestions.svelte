<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
	const CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
	export let category = '';
	export let searchTerm = '';

	let query = '';
	export let suggestions = [];

	// Update query when category or searchTerm changes
	$: query = [category, searchTerm].filter(Boolean).join(' ');

	// Log when category or searchTerm changes
	$: console.log('Category:', category, 'SearchTerm:', searchTerm);

	// Reactively fetch suggestions when query length is greater than category.length + 3
	$: if (query.length > category.length + 3) {
		console.log('Fetching suggestions for:', query);
		fetchSuggestions();
	}

	async function fetchSuggestions() {
		const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&key=${API_KEY}&cx=${CX}`;

		try {
			const res = await fetch(url);
			const data = await res.json();

			if (data.items) {
				suggestions = data.items.slice(0, 10).map((item) => ({
					title: item.title,
					thumbnail: item.image.thumbnailLink,
					url: item.link
				}));
				// imageSuggestions.set(suggestions); // Remove or comment if not defined
			} else {
				suggestions = [];
			}
		} catch (e) {
			console.error('Image search failed:', e);
		}
	}

	function handleAddImage(url) {
		dispatch('addImage', url);
	}
</script>

<div class="suggestions">
	{#if query.length > category.length + 3}
		<h6>Search results for: {query}</h6>
		<div class="scroll-wrapper">
			<div class="suggestion">
				{#each suggestions as suggestion}
					<div class="suggestion-item">
						<img src={suggestion.thumbnail} alt={suggestion.title} />
						<p>{suggestion.title}</p>
						<button on:click={() => handleAddImage(suggestion.url)}>Add</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
