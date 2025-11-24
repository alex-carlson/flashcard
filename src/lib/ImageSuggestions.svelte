<script>
	import { createEventDispatcher } from 'svelte';
	import { addToast } from '../stores/toast';
	const dispatch = createEventDispatcher();
	const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
	const CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
	export let searchTerm = '';
	let searchOverride = '';

	export let fileType = 'any';
	export let suggestions = [];

	// Pagination tracking
	let currentStartIndex = 1;
	let isLoading = false;
	let hasMoreResults = true;
	let totalResults = 0;
	let lastLoadTime = 0; // Track when last load occurred for 10s timeout

	// Use searchOverride if it exists, otherwise use searchTerm
	$: effectiveSearchTerm = searchOverride || searchTerm;

	// Clear suggestions when fileType changes
	let previousFileType = fileType;
	$: if (fileType !== previousFileType && suggestions.length > 0) {
		suggestions = [];
		currentStartIndex = 1;
		hasMoreResults = true;
		lastLoadTime = 0;
		previousFileType = fileType;
	}

	// Image validation function
	async function validateImageAccess(url, timeout = 5000) {
		return new Promise((resolve) => {
			const img = new Image();
			const timeoutId = setTimeout(() => {
				resolve({
					valid: false,
					error: 'timeout',
					message: 'Image load timed out'
				});
			}, timeout);

			img.onload = () => {
				clearTimeout(timeoutId);
				resolve({
					valid: true,
					width: img.naturalWidth,
					height: img.naturalHeight,
					size: `${img.naturalWidth}x${img.naturalHeight}`
				});
			};

			img.onerror = () => {
				clearTimeout(timeoutId);
				// Try to determine the type of error
				fetch(url, { method: 'HEAD', mode: 'no-cors' })
					.then(() => {
						resolve({
							valid: false,
							error: 'cors',
							message: 'Image blocked by CORS policy'
						});
					})
					.catch(() => {
						resolve({
							valid: false,
							error: 'access',
							message: 'Image access forbidden or not found'
						});
					});
			};

			img.src = url;
		});
	}

	// Enhanced validation with HEAD request
	async function validateImageWithFetch(url) {
		try {
			const response = await fetch(url, {
				method: 'HEAD',
				mode: 'cors' // This will fail with CORS issues
			});

			if (!response.ok) {
				return {
					valid: false,
					error: `http_${response.status}`,
					message: `HTTP ${response.status}: ${response.statusText}`
				};
			}

			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.startsWith('image/')) {
				return {
					valid: false,
					error: 'not_image',
					message: 'URL does not point to an image'
				};
			}

			return { valid: true, contentType };
		} catch (error) {
			// CORS or network error
			return {
				valid: false,
				error: 'network',
				message: error.message.includes('CORS') ? 'CORS policy blocks access' : 'Network error'
			};
		}
	}

	// Comprehensive validation combining both methods
	async function comprehensiveValidation(url) {
		const [fetchResult, imageResult] = await Promise.all([
			validateImageWithFetch(url).catch(() => ({ valid: false, error: 'fetch_failed' })),
			validateImageAccess(url)
		]);

		// If fetch validation passes, use it
		if (fetchResult.valid) {
			return { ...fetchResult, ...imageResult };
		}

		// If image validation passes but fetch failed, it might be a CORS issue
		if (imageResult.valid && !fetchResult.valid) {
			return {
				...imageResult,
				warning: 'CORS_WARNING',
				warningMessage:
					'Image loads in browser but may fail server-side upload due to CORS restrictions'
			};
		}

		// Both failed
		return fetchResult.error === 'network' ? fetchResult : imageResult;
	}

	export async function fetchSuggestions(append = false) {
		if (isLoading) return;
		isLoading = true;

		// Reset pagination for new searches
		if (!append) {
			currentStartIndex = 1;
			hasMoreResults = true;
			suggestions = [];
			lastLoadTime = 0; // Reset timeout for new searches
		}

		// if filetype is png, add transparent, no background, isolated, etc. to the query
		let fullQuery = effectiveSearchTerm;
		if (fileType === 'png') {
			// fullQuery += ' transparent isolated no background';
		}

		let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery)}&searchType=image&key=${API_KEY}&cx=${CX}&start=${currentStartIndex}`;

		// Add file type filter
		if (fileType === 'any') {
			// For 'any', we'll exclude vector formats by adding negative terms to the query
			fullQuery += ' -svg -eps -pdf -ai';
			url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery)}&searchType=image&key=${API_KEY}&cx=${CX}&start=${currentStartIndex}`;
		} else {
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
				if (!append) suggestions = [];
				isLoading = false;
				return;
			}

			if (data.items) {
				const newItems = data.items
					.filter((item) => item.link && item.image && item.image.thumbnailLink)
					.map((item) => ({
						title: item.title,
						thumbnail: item.image.thumbnailLink,
						url: item.link,
						loaded: false, // Track if full image is loaded
						validating: false, // Track validation state
						validation: null // Store validation result
					}));

				if (append) {
					suggestions = [...suggestions, ...newItems];
				} else {
					suggestions = newItems;
				}

				// Update pagination
				currentStartIndex += 10;
				totalResults = parseInt(data.searchInformation?.totalResults || '0');
				hasMoreResults = currentStartIndex <= Math.min(totalResults, 100); // Google limits to 100 results
			} else {
				if (!append) suggestions = [];
				hasMoreResults = false;
			}
		} catch (e) {
			console.error('Image search failed:', e);
			addToast({
				type: 'error',
				message: 'Failed to fetch image suggestions. Please try again later.'
			});
			hasMoreResults = false;
		}

		isLoading = false;
	}
	async function handleAddImage(url, index) {
		// Since we auto-validate and filter out warning images,
		// we can directly dispatch for valid images
		const suggestion = suggestions[index];

		// Check if suggestion exists
		if (!suggestion) {
			addToast({
				type: 'error',
				message: 'Invalid image selection. Please try again.'
			});
			return;
		}

		// If no validation yet, validate now
		if (!suggestion.validation && !suggestion.validating) {
			suggestion.validating = true;
			suggestions = [...suggestions];

			const validation = await comprehensiveValidation(url);
			suggestion.validation = validation;
			suggestion.validating = false;
			suggestions = [...suggestions];
		}

		// Double-check validation state
		if (suggestion.validation && !suggestion.validation.valid) {
			addToast({
				type: 'error',
				message: `Cannot add image: ${suggestion.validation.message}`
			});
			return;
		}

		if (suggestion.validation && suggestion.validation.warning) {
			addToast({
				type: 'warning',
				message: suggestion.validation.warningMessage,
				duration: 8000
			});
		}

		// Create proper data structure with src and answers
		const imageData = {
			file: url, // Pass URL string directly for URL-based uploads
			src: url, // Set src to the image URL
			type: 'image', // Specify the type
			question: effectiveSearchTerm || '', // Add question field
			url: url // Ensure url field is present for URL uploads
		};

		// Set answers based on searchTerm - this should contain the answer(s)
		if (effectiveSearchTerm && effectiveSearchTerm.trim()) {
			// Check if it looks like multiple answers (contains commas, semicolons, or "and")
			const answerText = effectiveSearchTerm.trim();
			if (answerText.includes(',') || answerText.includes(';') || answerText.includes(' and ')) {
				// Split into array of answers
				const answers = answerText
					.split(/[,;]|and/)
					.map((a) => a.trim())
					.filter((a) => a);
				imageData.answers = answers;
				imageData.answer = answers[0]; // Set primary answer to first one
			} else {
				// Single answer - only set answer, not answers
				imageData.answer = answerText;
				// Don't set imageData.answers for single answers
			}
		}

		dispatch('addImage', imageData);
	} // Auto-validate a single image
	async function autoValidateImage(index) {
		if (suggestions[index].validation || suggestions[index].validating) {
			return; // Already validated or validating
		}

		suggestions[index].validating = true;
		suggestions = [...suggestions];

		const validation = await comprehensiveValidation(suggestions[index].url);
		suggestions[index].validation = validation;
		suggestions[index].validating = false;
		suggestions = [...suggestions];
	}

	// Handle load more button click
	function loadMoreImages() {
		fetchSuggestions(true); // append = true
	}
</script>

<div class="suggestions">
	<div class="search-controls">
		<label for="searchOverride">Search Override:</label>
		<input
			name="searchOverride"
			type="text"
			bind:value={searchOverride}
			placeholder="Search for images..."
			class="search-input"
		/>
		<div class="file-type-selector">
			<label for="fileType">File Type:</label>
			<select id="fileType" bind:value={fileType}>
				<option value="any">Any (PNG, JPG, GIF, etc.)</option>
				<option value="png">PNG</option>
				<option value="jpg">JPG</option>
				<option value="gif">GIF</option>
			</select>
		</div>
		<button
			class="search-btn"
			on:click|preventDefault={() => fetchSuggestions(false)}
			disabled={!effectiveSearchTerm || effectiveSearchTerm.length <= 3}
		>
			Show Results
		</button>
		{#if suggestions.length > 0}
			<h6 class="mt-2">Showing results for {effectiveSearchTerm}</h6>
		{/if}
	</div>
	<div class="scroll-wrapper">
		<div class="suggestions-list">
			{#each suggestions as suggestion, originalIndex}
				{#if !suggestion.validation || (suggestion.validation.valid && !suggestion.validation.warning)}
					<div class="suggestion-item">
						<div class="image-container">
							<img
								src={suggestion.loaded ? suggestion.url : suggestion.thumbnail}
								alt={suggestion.title}
								loading="lazy"
								on:load={async () => {
									if (!suggestion.loaded && !suggestion.url.includes('nocookie')) {
										const img = new window.Image();
										img.src = suggestion.url;
										img.onload = () => {
											suggestions[originalIndex].loaded = true;
											suggestions = [...suggestions];
										};
									}
									// Auto-validate when image loads
									autoValidateImage(originalIndex);
								}}
								on:error={(e) => {
									// fallback to thumbnail if main image fails
									suggestions[originalIndex].loaded = false;
									suggestions = [...suggestions];
									e.target.src = suggestion.thumbnail;
									// Also auto-validate on error to mark as invalid
									autoValidateImage(originalIndex);
								}}
							/>
						</div>
						<p class="suggestion-title">{suggestion.title}</p>
						<div class="button-group">
							<button
								on:click={() => handleAddImage(suggestion.url, originalIndex)}
								disabled={suggestion.validating}
							>
								{#if suggestion.validating}
									Validating...
								{:else}
									Add
								{/if}
							</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		{#if suggestions.length > 0}
			<div class="load-more-section">
				{#if hasMoreResults}
					<button class="load-more-btn" on:click={loadMoreImages} disabled={isLoading}>
						{#if isLoading}
							<div class="loading-spinner-small"></div>
							Loading...
						{:else}
							More
						{/if}
					</button>
				{:else}
					<div class="end-message">
						<p>No more results available (showing {suggestions.length} images)</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.suggestions {
		margin-top: 1rem;
	}

	.search-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-input,
	.file-type-selector select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.scroll-wrapper {
		max-height: 75vh;
		overflow-y: auto;
		overflow-x: hidden;
		width: 100%;
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	.suggestion-item {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		background: white;
		transition: all 0.2s ease;
		width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Horizontal layout on desktop */
	@media (min-width: 768px) {
		.suggestion-item {
			flex-direction: row;
			align-items: flex-start;
		}
	}

	.image-container {
		position: relative;
		flex-shrink: 0;
		width: 100%;
		max-width: 400px;
		height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f8f9fa;
		border-radius: 4px;
		overflow: hidden;
	}

	/* Desktop: fixed width, mobile: constrained width */
	@media (min-width: 768px) {
		.image-container {
			width: 400px;
		}
	}

	.suggestion-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 120px;
	}

	.suggestion-item img {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 4px;
	}

	.validation-overlay {
		position: absolute;
		top: 5px;
		right: 5px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		background: rgba(0, 0, 0, 0.8);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
	}

	.validation-icon {
		font-weight: bold;
		font-size: 16px;
	}

	.validation-icon.valid {
		color: #28a745;
	}

	.validation-icon.validating {
		color: #ffc107;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.image-info {
		color: white;
		font-size: 10px;
	}

	.suggestion-title {
		font-size: 14px;
		margin: 0.5rem 0;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}

	.button-group button {
		flex: 1;
		padding: 0.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		transition: background-color 0.2s ease;
	}

	.button-group button:first-child {
		background: #007bff;
		color: white;
	}

	.button-group button:first-child:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.load-more-section {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.load-more-btn {
		padding: 1rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 500;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 200px;
		justify-content: center;
	}

	.load-more-btn:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
	}

	.load-more-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.loading-spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.end-message {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
		font-style: italic;
	}

	.end-message p {
		margin: 0;
	}
</style>
