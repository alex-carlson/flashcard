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
		if (!cropper) return;

		const canvas = cropper.getCroppedCanvas({
			imageSmoothingEnabled: true,
			imageSmoothingQuality: 'high'
		});

		canvas.toBlob(
			(blob) => {
				if (blob) {
					const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
					dispatch('cropped', { file, blob, canvas });
				}
			},
			'image/jpeg',
			0.9
		);
	}
</script>

<div class="cropper-container">
	<img bind:this={image} {src} alt="To crop" style="max-width: 100%;" />

	<div class="cropper-actions">
		<button class="btn btn-primary" on:click={getCroppedImage}> Crop & Save </button>
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
