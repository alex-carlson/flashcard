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

	// Check if MP4 version exists for GIF files
	async function checkMP4Exists(gifUrl) {
		const mp4Path = gifUrl.replace('.gif', '.mp4');
		try {
			const response = await fetch(mp4Path, { method: 'HEAD' });
			return response.ok;
		} catch {
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

		// Check if it's a GIF and if MP4 version exists
		if (imageUrl.endsWith('.gif')) {
			mp4Url = imageUrl.replace('.gif', '.mp4');
			checkMP4Exists(imageUrl).then((exists) => {
				hasMP4 = exists;
			});
		} else {
			hasMP4 = false;
			mp4Url = '';
		}

		// Check if image is already in cache
		loaded = checkIfImageLoaded(finalUrl);
	} else {
		finalUrl = '';
		placeholderUrl = '';
		loaded = false;
		hasMP4 = false;
		mp4Url = '';
	}
</script>

<div class="lazy-load" style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ''}>
	{#if !loaded && placeholderUrl}
		<!-- Blurred low-res placeholder -->
		<img src={placeholderUrl} alt="Loading..." class="placeholder-blur" decoding="async" />
	{/if}

	{#if finalUrl}
		{#if imageUrl.endsWith('.gif') && hasMP4}
			<!-- Show MP4 video for GIFs that have MP4 versions -->
			<video
				bind:this={imgElement}
				autoplay
				loop
				muted
				playsinline
				class:loaded
				on:loadeddata={handleLoad}
				on:error={handleError}
			>
				<source src={mp4Url} type="video/mp4" />
			</video>
		{:else}
			<!-- Show image (either non-GIF or GIF without MP4) -->
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
