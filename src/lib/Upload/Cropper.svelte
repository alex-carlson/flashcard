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

		// Load CSS dynamically
		if (!document.querySelector('link[href*="cropper.min.css"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css';
			document.head.appendChild(link);
		}

		if (!image.complete) {
			await new Promise((resolve, reject) => {
				image.onload = resolve;
				image.onerror = reject;
			});
		}

		cropper = new Cropper(image, {
			viewMode: 1, // Respect the aspect ratio of the container
			autoCropArea: 1, // Fill the whole image
			dragMode: 'crop', // Allow dragging crop box
			zoomable: false, // Disable zooming
			scalable: false, // Disable scaling
			toggleDragModeOnDblclick: false,
			background: false,
			movable: false,
			cropBoxMovable: true, // Allow moving crop box
			cropBoxResizable: true, // Allow resizing crop box (drag anchor points)
			ready() {
				// Force it to zoom to fill the container width
				const containerData = cropper.getContainerData();
				const imageData = cropper.getImageData();
				const scale = containerData.width / imageData.naturalWidth;
				cropper.zoomTo(scale);
			}
		});
	});

	onDestroy(() => {
		if (cropper) {
			cropper.destroy();
			cropper = null;
		}
	});

	function getCroppedImage() {
		if (!cropper) return null;

		const originalFormat = getImageFormat(src);
		const mimeType = getMimeType(originalFormat);
		const fileExtension = originalFormat.toLowerCase();

		const imageData = cropper.getImageData();
		const canvasWidth = Math.round(imageData.naturalWidth);
		const canvasHeight = Math.round(imageData.naturalHeight);

		const canvas = cropper.getCroppedCanvas({
			width: canvasWidth,
			height: canvasHeight,
			imageSmoothingEnabled: true,
			imageSmoothingQuality: 'high'
		});

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
		if (imageSrc.startsWith('data:')) {
			const match = imageSrc.match(/^data:image\/([^;]+)/);
			return match ? match[1] : 'jpg';
		}
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

<div class="cropper">
	<img bind:this={image} {src} alt="To crop" style="max-width: 100%; display: block;" />

	<div class="cropper-actions">
		<button class="btn btn-primary" on:click={getCroppedImage}>Crop & Save</button>
		<button class="btn btn-secondary" on:click={() => dispatch('cancel')}>Cancel</button>
	</div>
</div>

<style>
	.cropper {
		position: relative;
		width: 100%;
		max-width: 100%;
		height: auto;
	}

	.cropper-actions {
		margin-top: 10px;
		text-align: center;
	}
	.cropper-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
