<script>
	export let imageUrl = '';

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
	let videoElement;
	let imgElement;

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		console.error('Error loading media');
		addToast({
			type: 'error',
			message: 'Failed to load media. Please try again later.'
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
		// Convert GIF URLs to MP4 URLs and always use MP4
		if (imageUrl.endsWith('.gif')) {
			finalUrl = imageUrl.replace('.gif', '.mp4');
		} else {
			finalUrl = addImageOptimizations(imageUrl);
		}
		loaded = false;
	} else {
		finalUrl = '';
		loaded = false;
	}
</script>

<div>
	{#if finalUrl}
		{#if finalUrl.endsWith('.mp4')}
			<video
				bind:this={videoElement}
				loop
				muted
				autoplay
				playsinline
				preload="metadata"
				class:loaded
				on:loadeddata={handleLoad}
				on:error={handleError}
			>
				<source src={finalUrl} type="video/mp4" />
			</video>
		{:else}
			<img
				bind:this={imgElement}
				src={finalUrl}
				alt="image"
				loading="lazy"
				class:loaded
				on:load={handleLoad}
				on:error={handleError}
			/>
		{/if}
	{/if}
</div>
