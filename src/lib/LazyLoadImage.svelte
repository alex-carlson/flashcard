<script>
	export let imageUrl = '';
	export let tempSize = ''; // e.g. "200px" or "100%"

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
	let imgElement;
	let placeholderUrl = '';
	let hasMP4 = false;
	let mp4Url = '';
	let videoFailed = false;
	let useVideo = false;

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
		console.warn('Video failed to load, falling back to GIF');
		videoFailed = true;
		useVideo = false;
		// Reset loaded state to allow image fallback
		loaded = false;
	}

	function handleVideoLoad() {
		loaded = true;
	}

	// Check if device likely supports autoplay (desktop vs mobile heuristic)
	function deviceSupportsAutoplay() {
		// Simple heuristic: check if it's likely a mobile device
		const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		return !isMobile;
	}

	// Handle video play promise rejection (common on mobile)
	function handleVideoPlayback(videoElement) {
		if (!videoElement) return;

		const playPromise = videoElement.play();
		if (playPromise !== undefined) {
			playPromise.catch((error) => {
				console.warn('Video autoplay failed, falling back to GIF:', error);
				videoFailed = true;
				useVideo = false;
				loaded = false;
			});
		}
	}

	// Check if MP4 version exists for GIF files
	async function checkMP4Exists(gifUrl) {
		const mp4Path = gifUrl.replace('.gif', '.mp4');
		try {
			const response = await fetch(mp4Path, {
				method: 'HEAD',
				timeout: 5000 // 5 second timeout
			});
			return response.ok && response.status === 200;
		} catch (error) {
			console.warn('MP4 check failed:', error);
			return false;
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

	// Create low-res placeholder URL
	function createPlaceholderUrl(url) {
		if (!url) return '';
		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}quality=20&format=auto&width=20&fit=cover`;
	}

	// Reactively update finalUrl when imageUrl changes
	$: if (imageUrl) {
		finalUrl = addImageOptimizations(imageUrl);
		placeholderUrl = createPlaceholderUrl(imageUrl);
		videoFailed = false; // Reset video failure state

		// Check if it's a GIF and if MP4 version exists
		if (imageUrl.endsWith('.gif')) {
			mp4Url = imageUrl.replace('.gif', '.mp4');
			checkMP4Exists(imageUrl).then((exists) => {
				hasMP4 = exists;
				useVideo = exists && !videoFailed;
			});
		} else {
			hasMP4 = false;
			mp4Url = '';
			useVideo = false;
		}

		// Check if image is already in cache
		loaded = checkIfImageLoaded(finalUrl);
	} else {
		finalUrl = '';
		placeholderUrl = '';
		loaded = false;
		hasMP4 = false;
		mp4Url = '';
		videoFailed = false;
		useVideo = false;
	}

	// Reactive statement to handle video failure fallback
	$: if (videoFailed && imageUrl.endsWith('.gif')) {
		useVideo = false;
		// Don't reset loaded to false - let the image show immediately if it's already loaded
		// Check if fallback image is already cached and loaded
		setTimeout(() => {
			if (finalUrl && checkIfImageLoaded(finalUrl)) {
				loaded = true;
			}
		}, 10);
		// Immediately hide any video elements
		if (imgElement && imgElement.tagName === 'VIDEO') {
			imgElement.style.display = 'none';
		}
	}
</script>

<div class="lazy-load" style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ''}>
	{#if !loaded && placeholderUrl}
		<!-- Blurred low-res placeholder -->
		<img src={placeholderUrl} alt="Loading..." class="placeholder-blur" decoding="async" />
	{/if}

	{#if finalUrl}
		{#if imageUrl.endsWith('.gif') && hasMP4 && useVideo && !videoFailed}
			<!-- Show MP4 video for GIFs that have MP4 versions -->
			<video
				bind:this={imgElement}
				autoplay={deviceSupportsAutoplay()}
				loop
				muted
				playsinline
				preload="auto"
				class:loaded
				class:video-failed={videoFailed}
				on:loadeddata={handleVideoLoad}
				on:error={handleVideoError}
				on:canplaythrough={handleVideoLoad}
				on:loadstart={() => {
					// Try to play the video, handle mobile autoplay restrictions
					setTimeout(() => handleVideoPlayback(imgElement), 100);
				}}
			>
				<source src={mp4Url} type="video/mp4" />
				<!-- Fallback message for browsers that don't support video -->
				Your browser does not support the video tag.
			</video>
		{:else}
			<!-- Show image (either non-GIF, GIF without MP4, or video fallback) -->
			<img
				bind:this={imgElement}
				src={finalUrl}
				alt="Image"
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

	.lazy-load img,
	.lazy-load video {
		display: block;
		transition: opacity 0.3s ease-in-out;
		opacity: 0;
		object-fit: cover;
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
	}

	.lazy-load img.loaded,
	.lazy-load video.loaded {
		opacity: 1;
	}

	/* Hide failed video elements completely */
	.lazy-load video.video-failed {
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
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
