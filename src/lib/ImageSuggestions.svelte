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
	let debounceTimer;
	let throttleTimer;
	let lastFetchTime = 0;
	// Increased debounce and throttle to reduce API calls
	const DEBOUNCE_DELAY = 1800; // 1.8 seconds after user stops typing
	const THROTTLE_DELAY = 10000; // 10 seconds minimum between calls for same query

	// Update query when category or searchTerm changes
	$: query = [category, searchTerm].filter(Boolean).join(' ');

	// Log when category or searchTerm changes
	$: console.log('Category:', category, 'SearchTerm:', searchTerm);

	// In-memory cache for query+fileType -> suggestions
	const suggestionCache = new Map();
	// Track in-flight fetches to avoid duplicate calls
	const inflightFetches = new Map();

	function debouncedFetch() {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (throttleTimer) clearTimeout(throttleTimer);

		const now = Date.now();
		const timeSinceLastFetch = now - lastFetchTime;

		// If it's been more than THROTTLE_DELAY since last fetch, fetch immediately
		if (timeSinceLastFetch >= THROTTLE_DELAY) {
			fetchSuggestions();
			lastFetchTime = now;
		} else {
			debounceTimer = setTimeout(() => {
				fetchSuggestions();
				lastFetchTime = Date.now();
			}, DEBOUNCE_DELAY);

			const remainingThrottleTime = THROTTLE_DELAY - timeSinceLastFetch;
			throttleTimer = setTimeout(() => {
				if (debounceTimer) clearTimeout(debounceTimer);
				fetchSuggestions();
				lastFetchTime = Date.now();
			}, remainingThrottleTime);
		}
	}

	// on searchTerm change, fetch suggestions with debouncing
	$: if (query.length > category.length + 3) {
		debouncedFetch();
	}

	// if fileType changed, fetch suggestions immediately
	$: if (fileType && query.length > category.length + 3) {
		fetchSuggestions();
		lastFetchTime = Date.now();
	}
	export async function fetchSuggestions() {
		// Use a cache key based on query and fileType
		let fullQuery = query;
		if (fileType === 'png') {
			fullQuery += ' transparent isolated no background';
		}
		const cacheKey = `${fullQuery}|${fileType}`;
		// Use cache if available
		if (suggestionCache.has(cacheKey)) {
			suggestions = suggestionCache.get(cacheKey);
			return;
		}
		// If a fetch for this key is in progress, don't start another
		if (inflightFetches.has(cacheKey)) {
			return;
		}
		inflightFetches.set(cacheKey, true);

		let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery)}&searchType=image&key=${API_KEY}&cx=${CX}`;
		if (fileType !== 'any') {
			url += `&fileType=${fileType}`;
		}

		try {
			const res = await fetch(url);
			const data = await res.json();

			if (data.items) {
				const result = data.items
					.filter((item) => item.link && item.image && item.image.thumbnailLink)
					.map((item) => ({
						title: item.title,
						thumbnail: item.image.thumbnailLink,
						url: item.link,
						loaded: false
					}));
				suggestions = result;
				suggestionCache.set(cacheKey, result);
			} else {
				suggestions = [];
				suggestionCache.set(cacheKey, []);
			}
		} catch (e) {
			console.error('Image search failed:', e);
			addToast({
				type: 'error',
				message: 'Failed to fetch image suggestions. Please try again later.'
			});
		} finally {
			inflightFetches.delete(cacheKey);
		}
	}
	function handleAddImage(url) {
		dispatch('addImage', url);
	}
	function handleFileTypeChange() {
		if (query.length > category.length + 3) {
			fetchSuggestions();
			lastFetchTime = Date.now();
		}
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
			on:input={debouncedFetch}
			class="search-input"
		/>
		<h6 class="mt-2">Showing results for {query}</h6>
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
