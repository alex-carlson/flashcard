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
			fullQuery += ' transparent isolated no background';
		}

		let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(fullQuery)}&searchType=image&key=${API_KEY}&cx=${CX}&start=${currentStartIndex}`;

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

		dispatch('addImage', url);
		searchOverride = null;
	}

	// Auto-validate a single image
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

	// Batch validate all suggestions
	async function validateAllSuggestions() {
		for (let i = 0; i < suggestions.length; i++) {
			if (!suggestions[i].validation && !suggestions[i].validating) {
				suggestions[i].validating = true;
				suggestions = [...suggestions];

				const validation = await comprehensiveValidation(suggestions[i].url);
				suggestions[i].validation = validation;
				suggestions[i].validating = false;
				suggestions = [...suggestions];

				// Small delay to avoid overwhelming the server
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
	}

	// Handle infinite scroll
	function handleScroll(e) {
		const { scrollTop, scrollHeight, clientHeight } = e.target;
		const scrollThreshold = 100; // Load more when 100px from bottom
		const currentTime = Date.now();
		const timeoutDuration = 10000; // 10 seconds in milliseconds

		if (
			scrollHeight - scrollTop - clientHeight < scrollThreshold &&
			hasMoreResults &&
			!isLoading &&
			suggestions.length > 0 &&
			currentTime - lastLoadTime >= timeoutDuration
		) {
			lastLoadTime = currentTime;
			fetchSuggestions(true); // append = true
		}
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
				<option value="image">Any</option>
				<option value="png">PNG</option>
				<option value="jpg">JPG</option>
				<option value="gif">GIF</option>
			</select>
		</div>
		<button
			class="search-btn"
			on:click|preventDefault={fetchSuggestions}
			disabled={!effectiveSearchTerm || effectiveSearchTerm.length <= 3}
		>
			Show Results
		</button>
		{#if suggestions.length > 0}
			<h6 class="mt-2">Showing results for {effectiveSearchTerm}</h6>
		{/if}
	</div>
	<div class="scroll-wrapper" on:scroll={handleScroll}>
		<div class="suggestion">
			{#each suggestions as suggestion, originalIndex}
				{#if !suggestion.validation?.warning}
					<div
						class="suggestion-item"
						class:warning={suggestion.validation && suggestion.validation.warning}
					>
						<div
							class="image-container"
							class:invalid={suggestion.validation && !suggestion.validation.valid}
						>
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
							{#if suggestion.validation}
								<div class="validation-overlay">
									{#if suggestion.validation.valid}
										<span class="validation-icon valid">✓</span>
										{#if suggestion.validation.size}
											<span class="image-info">{suggestion.validation.size}</span>
										{/if}
									{:else}
										<span class="validation-icon invalid">✗</span>
										<span class="error-info">{suggestion.validation.error}</span>
									{/if}
								</div>
							{:else if suggestion.validating}
								<div class="validation-overlay">
									<span class="validation-icon validating">⟳</span>
								</div>
							{/if}
						</div>
						<p class="suggestion-title">{suggestion.title}</p>
						{#if suggestion.validation && !suggestion.validation.valid}
							<p class="error-message">{suggestion.validation.message}</p>
						{/if}
						{#if suggestion.validation && suggestion.validation.warning}
							<p class="warning-message">{suggestion.validation.warningMessage}</p>
						{/if}
						<div class="button-group">
							<button
								on:click={() => handleAddImage(suggestion.url, originalIndex)}
								disabled={suggestion.validating ||
									(suggestion.validation && !suggestion.validation.valid)}
								class:warning={suggestion.validation && suggestion.validation.warning}
							>
								{#if suggestion.validating}
									Validating...
								{:else if suggestion.validation && !suggestion.validation.valid}
									Cannot Add
								{:else if suggestion.validation && suggestion.validation.warning}
									Add (Risky)
								{:else}
									Add
								{/if}
							</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		{#if isLoading}
			<div class="loading-indicator">
				<div class="loading-spinner"></div>
				<p>Loading more images...</p>
			</div>
		{/if}
		{#if suggestions.length > 0 && !hasMoreResults}
			<div class="end-message">
				<p>No more results available (showing {suggestions.length} images)</p>
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

	.search-btn,
	.validate-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.validate-btn {
		background: #28a745;
	}

	.search-btn:disabled,
	.validate-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.scroll-wrapper {
		max-height: 75vh;
		overflow-y: auto;
		overflow-x: hidden;
		width: 100%;
	}

	.suggestion {
		display: grid;
		grid-template-columns: 1fr; /* 1x1 on mobile */
		gap: 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	/* 4x4 grid on desktop/tablet */
	@media (min-width: 768px) {
		.suggestion {
			grid-template-columns: repeat(4, 1fr);
		}
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
	}

	.suggestion-item.invalid {
		border-color: #dc3545;
		background-color: #f8f9fa;
	}

	.suggestion-item.warning {
		border-color: #ffc107;
		background-color: #fff3cd;
	}

	.image-container {
		position: relative;
		margin-bottom: 0.5rem;
	}

	.suggestion-item img {
		width: 100%;
		max-height: 400px;
		object-fit: cover;
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

	.validation-icon.invalid {
		color: #dc3545;
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

	.image-info,
	.error-info {
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

	.error-message {
		color: #dc3545;
		font-size: 12px;
		margin: 0.25rem 0;
		font-style: italic;
	}

	.warning-message {
		color: #856404;
		font-size: 12px;
		margin: 0.25rem 0;
		font-style: italic;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
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

	.button-group button:first-child.warning {
		background: #ffc107;
		color: #212529;
	}

	.button-group button:first-child:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.validate-single {
		background: #17a2b8;
		color: white;
	}

	.validate-single:hover {
		background: #138496;
	}

	.image-container.invalid {
		opacity: 0.5;
		transition: opacity 0.3s ease;
	}

	.image-container.invalid img {
		filter: grayscale(50%);
	}

	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		gap: 1rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
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
