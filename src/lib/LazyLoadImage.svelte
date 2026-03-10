<script>
	export let imageUrl = '';

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
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

	// Add image optimization parameters to URL
	function addImageOptimizations(url) {
		if (!url) return url;

		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}quality=75&format=auto&width=800&fit=cover`;
	}

	// Reactively update finalUrl when imageUrl changes
	$: if (imageUrl) {
		finalUrl = addImageOptimizations(imageUrl);

		// Check if it's a GIF and if MP4 version exists
		if (imageUrl.endsWith('.gif')) {
			mp4Url = imageUrl.replace('.gif', '.mp4');
		} else {
			mp4Url = '';
		}
	} else {
		finalUrl = '';
		loaded = false;
		mp4Url = '';
	}
</script>

<div>
	{#if finalUrl}
		{#if imageUrl.endsWith('.gif')}
			<!-- Show MP4 video with GIF fallback -->
			<video
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
				<img src={finalUrl} alt="gif" />
			</video>
		{:else}
			<!-- Show image -->
			<img
				bind:this={imgElement}
				src={finalUrl}
				alt="Still"
				loading="lazy"
				class:loaded
				on:load={handleLoad}
				on:error={handleError}
			/>
		{/if}
	{/if}
</div>
