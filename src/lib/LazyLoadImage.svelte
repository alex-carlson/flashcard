<script>
	export let imageUrl = '';

	import { addToast } from '../stores/toast';

	let loaded = false;
	let finalUrl = '';
	let mp4Url = '';
	let videoError = null;
	let imgElement;
	let videoElement;
	let videoContainer;
	let isInView = false;

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

	// Detect mobile devices
	function isMobileDevice() {
		return (
			/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) ||
			window.innerWidth < 768
		);
	}

	// Play video safely with promise handling
	function playVideo() {
		if (!videoElement || videoError) return;

		const playPromise = videoElement.play();
		if (playPromise !== undefined) {
			playPromise.catch((error) => {
				console.warn('Video play failed:', error);
				// Don't set videoError here as this might just be autoplay restriction
			});
		}
	}

	// Setup intersection observer for video
	function setupVideoObserver(node) {
		if (!('IntersectionObserver' in window)) {
			// Fallback for older browsers - just play immediately
			setTimeout(playVideo, 100);
			return { destroy: () => {} };
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					isInView = entry.isIntersecting;
					if (entry.isIntersecting && videoElement) {
						playVideo();
					} else if (!entry.isIntersecting && videoElement) {
						videoElement.pause();
					}
				});
			},
			{
				threshold: 0.5, // Trigger when 50% visible
				rootMargin: '0px'
			}
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function handleVideoError(event) {
		console.error('Video error:', event);
		const video = event.target;
		const error = video.error;

		if (error) {
			switch (error.code) {
				case error.MEDIA_ERR_ABORTED:
					videoError = 'Video playback was aborted';
					break;
				case error.MEDIA_ERR_NETWORK:
					videoError = 'Network error occurred';
					break;
				case error.MEDIA_ERR_DECODE:
					videoError = 'Video decoding error';
					break;
				case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
					videoError = 'Video format not supported';
					break;
				default:
					videoError = 'Unknown video error';
					break;
			}
		} else {
			videoError = 'Video failed to load';
		}

		videoError += ` (UA: ${navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'})`;
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
		videoError = null; // Reset error on new image

		// Check if it's a GIF and if MP4 version exists
		if (imageUrl.endsWith('.gif')) {
			// mp4Url = imageUrl.replace('.gif', '.mp4');
		} else {
			mp4Url = '';
		}
	} else {
		finalUrl = '';
		loaded = false;
		mp4Url = '';
		videoError = null;
	}
</script>

<div bind:this={videoContainer}>
	{#if finalUrl}
		<img
			bind:this={imgElement}
			src={finalUrl}
			alt={imageUrl.endsWith('.gif') ? 'gif' : 'image'}
			loading="lazy"
			class:loaded
			on:load={handleLoad}
			on:error={handleError}
		/>
	{/if}
</div>
