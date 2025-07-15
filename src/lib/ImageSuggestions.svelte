<script>
	import { createEventDispatcher } from 'svelte';
	import { addToast } from '../stores/toast';
	const dispatch = createEventDispatcher();
	const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
	const CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
	export let category = '';
	export let searchTerm = '';

	let query = '';
	let fileType = 'any'; // Default to any file type
	export let suggestions = [];

	// Update query when category or searchTerm changes
	$: query = [category, searchTerm].filter(Boolean).join(' ');

	// Log when category or searchTerm changes
	$: console.log('Category:', category, 'SearchTerm:', searchTerm);

	// on searchTerm change, fetch suggestions
	$: if (query.length > category.length + 3) {
		fetchSuggestions();
	}

	// if fileType changed, fetch suggestions
	$: if (fileType && query.length > category.length + 3) {
		fetchSuggestions();
	}

	export async function fetchSuggestions() {
		// if filetype is png, add transparent, no background, isolated, etc. to the query
		const pngQuery = 'transparent isolated no background';
		let fullQuery = query;
		if (fileType === 'png') {
			fullQuery += ' transparent isolated no background';
		}

		let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery + ' filetype:' + fileType)}&searchType=image&key=${API_KEY}&cx=${CX}`;
		// Add file type filter if not 'any'
		if (fileType !== 'any') {
			url += `&fileType=${fileType}`;
		}

		try {
			const res = await fetch(url);
			const data = await res.json();

			if (data.items) {
				suggestions = data.items
					.filter((item) => item.link && item.link.endsWith(`.${fileType}`)) // Filter by file type
					.slice(0, 10)
					.map((item) => ({
						title: item.title,
						thumbnail: item.link || item.image.thumbnailLink,
						url: item.link
					}));
				// imageSuggestions.set(suggestions); // Remove or comment if not defined
			} else {
				suggestions = [];
			}
		} catch (e) {
			console.error('Image search failed:', e);
			addToast({
				type: 'error',
				message: 'Failed to fetch image suggestions. Please try again later.'
			});
		}
	}
	function handleAddImage(url) {
		dispatch('addImage', url);
	}

	function handleFileTypeChange() {
		if (query.length > category.length + 3) {
			fetchSuggestions();
		}
	}
</script>

<div class="suggestions">
	{#if query.length > category.length + 3}
		<div class="search-controls">
			<h6>Search results for: {query}</h6>
			<div class="file-type-selector">
				<label for="fileType">File Type:</label>
				<select id="fileType" bind:value={fileType} on:change={handleFileTypeChange}>
					<option value="any">Any</option>
					<option value="png">PNG</option>
					<option value="jpg">JPG</option>
					<option value="gif">GIF</option>
				</select>
			</div>
		</div>
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
