<script>
	export let imageUrl = '';
	export let tempSize = ''; // e.g. "200px" or "100%"

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
	let imgElement;
	let useVideoFallback = false;
	let fallbackUrl = '';
	let placeholderUrl = '';
	let videoLoadTimeout;
	let isMobile = false;

	// Detect mobile device
	function detectMobile() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
			 window.innerWidth <= 768 || 
			 'ontouchstart' in window;
	}

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
		console.error(
			'Video failed to load, falling back to GIF:',
			`${imageUrl.replace('.gif', '.mp4')}`
		);
		// Clear any existing timeout
		if (videoLoadTimeout) {
			clearTimeout(videoLoadTimeout);
		}
		// Video failed to load, fallback directly to original GIF
		useVideoFallback = true;
		fallbackUrl = imageUrl; // Use original GIF without optimization
	}

	function handleVideoLoadStart() {
		// Short timeout for fast fallback on failed videos
		videoLoadTimeout = setTimeout(() => {
			console.warn('Video load timeout (2s), falling back to GIF');
			handleVideoError();
		}, 2000); // 2 second timeout for fast loading
	}

	function handleSourceError(event) {
		console.error('Source failed to load (likely 404):', event.target.src);
		handleVideoError();
	}

	// Simplified mobile fallback
	function handleMobileGifError() {
		console.error('Mobile GIF failed to load, trying optimized version');
		// Try the original URL without optimizations
		if (fallbackUrl !== imageUrl) {
			fallbackUrl = imageUrl;
		}
	}

	function handleVideoLoad() {
		// Clear timeout on successful load
		if (videoLoadTimeout) {
			clearTimeout(videoLoadTimeout);
		}
		handleLoad();
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

	// Create low-res placeholder URL
	function createPlaceholderUrl(url) {
		if (!url) return '';
		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}quality=20&format=auto&width=20&fit=cover`;
	}

	// Reactively update finalUrl when imageUrl changes
	$: {
		isMobile = detectMobile();
		
		if (imageUrl) {
			finalUrl = addImageOptimizations(imageUrl);
			placeholderUrl = createPlaceholderUrl(imageUrl);
			// Reset video fallback state when imageUrl changes
			useVideoFallback = false;
			fallbackUrl = '';
			// Clear any existing timeout
			if (videoLoadTimeout) {
				clearTimeout(videoLoadTimeout);
			}
			
			// On mobile, skip video entirely for GIFs to avoid compatibility issues
			if (isMobile && imageUrl.endsWith('.gif')) {
				useVideoFallback = true;
				fallbackUrl = imageUrl; // Use original GIF directly
			}
			
			// Check if image is already in cache
			loaded = checkIfImageLoaded(finalUrl);
		} else {
			finalUrl = '';
			placeholderUrl = '';
			loaded = false;
			useVideoFallback = false;
			fallbackUrl = '';
			if (videoLoadTimeout) {
				clearTimeout(videoLoadTimeout);
			}
		}
	}
</script>

<div class="lazy-load" style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ''}>
	{#if !loaded && placeholderUrl}
		<!-- Blurred low-res placeholder -->
		<img src={placeholderUrl} alt="Loading..." class="placeholder-blur" decoding="async" />
	{/if}

	{#if finalUrl}
		{#if imageUrl.endsWith('.gif') && !useVideoFallback}
			<video
				autoplay
				loop
				muted
				playsinline
				preload="none"
				class:loaded
				on:loadeddata={handleVideoLoad}
				on:loadstart={handleVideoLoadStart}
				on:error={handleVideoError}
				on:canplay={handleVideoLoad}
				on:emptied={handleVideoError}
			>
				<!-- Source with its own error handler for 404s -->
				<source
					src={`${imageUrl.replace('.gif', '.mp4')}`}
					type="video/mp4"
					on:error={handleSourceError}
				/>
			</video>
		{:else if useVideoFallback && fallbackUrl}
			<!-- Show original GIF when video fails OR on mobile -->
			<img
				bind:this={imgElement}
				src={fallbackUrl}
				alt="Image"
				loading={isMobile ? 'eager' : 'lazy'}
				decoding="async"
				class:loaded
				on:load={handleLoad}
				on:error={handleMobileGifError}
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

	/* Blurred low-res placeholder */
	.placeholder-blur {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(8px);
		transform: scale(1.05);
		z-index: 1;
		opacity: 0.8;
	}
</style>
