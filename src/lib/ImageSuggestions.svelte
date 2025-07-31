<script>
	import { createEventDispatcher } from 'svelte';
	import { addToast } from '../stores/toast';
	const dispatch = createEventDispatcher();
	const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
	const CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
	export let category = '';
	export let searchTerm = '';
	let query = searchTerm || '';

	export let fileType = 'any';
	export let suggestions = [];

	export async function fetchSuggestions() {
		// if filetype is png, add transparent, no background, isolated, etc. to the query
		let fullQuery = query;
		if (fileType === 'png') {
			fullQuery += ' transparent isolated no background';
		}

		let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery)}&searchType=image&key=${API_KEY}&cx=${CX}`;

		// Add file type filter only if not 'any'
		if (fileType !== 'any') {
			url += `&fileType=${fileType}`;
		}

		try {
			const res = await fetch(url);
			const data = await res.json();

			if (data.error && data.error.errors && data.error.errors[0].reason === 'dailyLimitExceeded') {
				addToast({
					type: 'error',
					message:
						'Google Search API quota limit reached. Please try again tomorrow or use another upload method.'
				});
				suggestions = [];
				return;
			}

			if (data.items) {
				suggestions = data.items
					.filter((item) => item.link && item.image && item.image.thumbnailLink)
					.map((item) => ({
						title: item.title,
						thumbnail: item.image.thumbnailLink,
						url: item.link,
						loaded: false // Track if full image is loaded
					}));
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
</script>

<div class="suggestions">
	<div class="search-controls">
		<label for="searchOverride">Search Override:</label>
		<input
			name="searchOverride"
			type="text"
			bind:value={query}
			placeholder="Search for images..."
			class="search-input"
		/>
		<div class="file-type-selector">
			<label for="fileType">File Type:</label>
			<select id="fileType" bind:value={fileType}>
				<option value="any">Any</option>
				<option value="png">PNG</option>
				<option value="jpg">JPG</option>
				<option value="gif">GIF</option>
			</select>
		</div>
		<button class="search-btn" on:click={fetchSuggestions} disabled={!query || query.length <= 3}>
			Show Results
		</button>
		<h6 class="mt-2">Showing results for {query}</h6>
	</div>
	<div class="scroll-wrapper">
		<div class="suggestion">
			{#each suggestions as suggestion, i}
				<div class="suggestion-item">
					<img
						src={suggestion.loaded ? suggestion.url : suggestion.thumbnail}
						alt={suggestion.title}
						loading="lazy"
						on:load={() => {
							if (!suggestion.loaded && !suggestion.url.includes('nocookie')) {
								const img = new window.Image();
								img.src = suggestion.url;
								img.onload = () => {
									suggestions[i].loaded = true;
									suggestions = [...suggestions];
								};
							}
						}}
						on:error={(e) => {
							// fallback to thumbnail if main image fails
							suggestions[i].loaded = false;
							suggestions = [...suggestions];
							e.target.src = suggestion.thumbnail;
						}}
					/>
					<p>{suggestion.title}</p>
					<button on:click={() => handleAddImage(suggestion.url)}>Add</button>
				</div>
			{/each}
		</div>
	</div>
</div>
