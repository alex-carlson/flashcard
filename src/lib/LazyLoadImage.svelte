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
			const response = await fetch(mp4Path, {
				method: 'HEAD',
				timeout: 5000
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
			<!-- Show MP4 video with GIF fallback -->
			<video
				bind:this={imgElement}
				autoplay
				loop
				muted
				playsinline
				preload="auto"
				class:loaded
				on:loadeddata={handleLoad}
				on:canplaythrough={handleLoad}
			>
				<source src={mp4Url} type="video/mp4" />
				<!-- Fallback to GIF if video fails -->
				<img src={finalUrl} alt="Image" />
			</video>
		{:else}
			<!-- Show image -->
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
