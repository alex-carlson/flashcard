<script>
	export let imageUrl = '';
	export let tempSize = ''; // e.g. "200px" or "100%"

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
	let imgElement;
	let useVideoFallback = false;
	let fallbackUrl = '';

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		console.error('Error loading image');
		addToast({
			type: 'error',
			message: 'Failed to load image. Please try again later.'
		});
	}

	function handleVideoError() {
		if (!useVideoFallback) {
			// First fallback: try WebP
			useVideoFallback = true;
			fallbackUrl = addImageOptimizations(imageUrl.replace('.gif', '.webp'));
		} else if (fallbackUrl.includes('.webp')) {
			// Second fallback: try original GIF
			fallbackUrl = addImageOptimizations(imageUrl);
		} else {
			// Final fallback failed
			handleError();
		}
	}

	// Check if image is already loaded in cache
	function checkIfImageLoaded(url) {
		if (!url) return false;

		const img = new Image();
		img.src = url;

		// If image is complete and has dimensions, it's already loaded
		if (img.complete && img.naturalWidth > 0) {
			return true;
		}
		return false;
	}

	// Add image optimization parameters to URL
	function addImageOptimizations(url) {
		if (!url) return url;

		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}quality=75&format=auto&width=800&fit=cover`;
	}

	// Reactively update finalUrl when imageUrl changes
	$: if (imageUrl) {
		finalUrl = addImageOptimizations(imageUrl);
		// Reset video fallback state when imageUrl changes
		useVideoFallback = false;
		fallbackUrl = '';
		// Check if image is already in cache
		loaded = checkIfImageLoaded(finalUrl);
	} else {
		finalUrl = '';
		loaded = false;
		useVideoFallback = false;
		fallbackUrl = '';
	}
</script>

<div class="lazy-load" style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ''}>
	{#if !loaded}
		<!-- Shimmer placeholder -->
		<div class="shimmer"></div>
	{/if}

	{#if finalUrl}
		{#if imageUrl.endsWith('.gif') && !useVideoFallback}
			<video
				autoplay
				loop
				muted
				playsinline
				class:loaded
				on:loadeddata={handleLoad}
				on:error={handleVideoError}
			>
				<source src={`${imageUrl.replace('.gif', '.mp4')}`} type="video/mp4" />
				<source src={`${imageUrl.replace('.gif', '.webp')}`} type="image/webp" />
				<img src={finalUrl} />
			</video>
		{:else if useVideoFallback && fallbackUrl}
			<img
				bind:this={imgElement}
				src={fallbackUrl}
				alt="Placeholder"
				loading="lazy"
				class:loaded
				on:load={handleLoad}
				on:error={handleVideoError}
			/>
		{:else}
			<img
				bind:this={imgElement}
				src={finalUrl}
				alt="Placeholder"
				loading="lazy"
				class:loaded
				on:load={handleLoad}
				on:error={handleError}
			/>
		{/if}
	{/if}
</div>

<style>
	.lazy-load {
		overflow: hidden;
		position: relative;
		display: inline-block;
		width: var(--temp-size, auto);
		height: var(--temp-size, auto);
	}

	.lazy-load img {
		display: block;
		transition: opacity 0.3s ease-in-out;
		opacity: 0;
		object-fit: cover;
		position: relative;
		z-index: 2;
	}

	.lazy-load img.loaded {
		opacity: 1;
	}

	/* Shimmer placeholder */
	.shimmer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
		background-size: 200% 100%;
		animation: shimmer 1.2s infinite;
		z-index: 1;
		border-radius: 2px;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
