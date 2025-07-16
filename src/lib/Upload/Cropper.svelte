<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();
	export let src;
	let image;
	let cropper;

	onMount(async () => {
		if (!browser) return;

		const { default: Cropper } = await import('cropperjs');

		// Load CSS dynamically (or import it in app.css)
		if (!document.querySelector('link[href*="cropper.min.css"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css';
			document.head.appendChild(link);
		}

		// Wait for image to be fully loaded
		if (!image.complete) {
			await new Promise((resolve, reject) => {
				image.onload = resolve;
				image.onerror = reject;
			});
		}

		cropper = new Cropper(image, {
			viewMode: 2,
			autoCropArea: 1,
			dragMode: 'move',
			toggleDragModeOnDblclick: false
		});
	});

	onDestroy(() => {
		if (cropper) {
			cropper = null;
		}
	});
	function getCroppedImage() {
		if (!cropper) return null;

		// Detect the original image format
		const originalFormat = getImageFormat(src);
		const mimeType = getMimeType(originalFormat);
		const fileExtension = originalFormat.toLowerCase();

		// Get the original image dimensions
		const imageData = cropper.getImageData();
		const canvasWidth = Math.round(imageData.naturalWidth);
		const canvasHeight = Math.round(imageData.naturalHeight);

		const canvas = cropper.getCroppedCanvas({
			width: canvasWidth,
			height: canvasHeight,
			imageSmoothingEnabled: true,
			imageSmoothingQuality: 'high'
		});

		// Use appropriate quality based on format
		const quality = mimeType === 'image/jpeg' ? 0.9 : undefined;

		return new Promise((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						const file = new File([blob], `cropped.${fileExtension}`, { type: mimeType });
						dispatch('cropped', file);
						resolve(file);
					} else {
						resolve(null);
					}
				},
				mimeType,
				quality
			);
		});
	}

	function getImageFormat(imageSrc) {
		// Extract format from URL or data URI
		if (imageSrc.startsWith('data:')) {
			const match = imageSrc.match(/^data:image\/([^;]+)/);
			return match ? match[1] : 'jpg';
		}

		// Extract from file extension
		const extension = imageSrc.split('.').pop()?.toLowerCase();
		return extension || 'jpg';
	}

	function getMimeType(format) {
		const mimeTypes = {
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			png: 'image/png',
			webp: 'image/webp',
			gif: 'image/gif',
			bmp: 'image/bmp'
		};
		return mimeTypes[format] || 'image/jpeg';
	}
</script>

<div class="cropper-container">
	<img bind:this={image} {src} alt="To crop" style="max-width: 100%;" />

	<div class="cropper-actions">
		<button class="btn btn-primary" on:click={getCroppedImage}> Crop & Save </button>
		<button class="btn btn-secondary" on:click={() => dispatch('cancel')}> Cancel </button>
	</div>
</div>

<style>
	.cropper-container {
		position: relative;
	}

	.cropper-actions {
		margin-top: 10px;
		text-align: center;
	}
</style>
