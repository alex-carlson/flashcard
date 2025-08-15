<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();
	export let src;
	export let isThumbnail = false;
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
			viewMode: 1,
			autoCropArea: 1,
			dragMode: 'crop',
			zoomable: false,
			scalable: false,
			toggleDragModeOnDblclick: false,
			background: false,
			movable: false,
			cropBoxMovable: true,
			cropBoxResizable: true,
			ready() {
				// Fill both width and height of the cropper container
				const containerData = cropper.getContainerData();
				const imageData = cropper.getImageData();

				// Calculate scale to fill both width and height
				const scaleW = containerData.width / imageData.naturalWidth;
				const scaleH = containerData.height / imageData.naturalHeight;
				const scale = Math.max(scaleW, scaleH); // Use the larger scale to fill

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
						console.log('Cropped image:', file);
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
		// Remove query string if present
		return extension?.split('?')[0] || 'jpg';
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
	<div class="cropper">
		<div class="cropper-image-wrapper">
			<img
				bind:this={image}
				{src}
				crossorigin="anonymous"
				alt="To crop"
				style="max-width: 100%; display: block;"
			/>
		</div>
		<div class="cropper-actions">
			<button class="btn btn-primary" on:click={getCroppedImage}>Crop & Save</button>
			<button class="btn btn-secondary" on:click={() => dispatch('cancel')}>Cancel</button>
		</div>
	</div>
</div>

<style>
	.cropper-container {
		width: 100vw;
		max-width: 100vw;
		height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
		overflow: hidden;
	}

	.cropper {
		position: relative;
		width: 90vw;
		max-width: 900px;
		height: 70vh;
		background: #fff;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		overflow: hidden;
	}

	.cropper-image-wrapper {
		flex: 1 1 auto;
		width: 100%;
		max-height: 55vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: auto;
	}

	.cropper-actions {
		margin-top: 10px;
		text-align: center;
		width: 100%;
		position: relative;
		z-index: 2;
		background: #fff;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
		padding-bottom: 1rem;
	}
</style>
