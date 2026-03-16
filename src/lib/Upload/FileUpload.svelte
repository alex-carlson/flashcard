<script>
	import { createEventDispatcher } from 'svelte';
	export let placeholderImage = ''; // Placeholder image input prop
	export let clearAfterUpload = false; // Whether to clear the image after upload

	const dispatch = createEventDispatcher();
	let fileInput;
	let myImg = null;
	let isDragOver = false;
	let imageAddedByUrl = false;

	// Helper function to validate image URLs
	const isValidImageUrl = (url) => {
		if (!url || typeof url !== 'string') return false;
		try {
			new URL(url); // Basic URL validation
			return (
				/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(url) ||
				/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(url)
			);
		} catch {
			return false;
		}
	};

	// Helper function to handle image URLs (from drag or paste)
	const handleImageFromUrl = (url) => {
		if (!isValidImageUrl(url)) {
			alert('Please provide a valid image URL (jpg, png, gif, svg, webp)');
			return;
		}
		myImg = url;
		imageAddedByUrl = true;
		dispatch('uploadImage', url);
	};

	// Reset badge if user uploads a file or clears image
	function clearImageUrlBadge() {
		imageAddedByUrl = false;
	}

	// Reset the image when placeholderImage changes (e.g., when switching collections)
	$: if (placeholderImage && !myImg) {
		myImg = placeholderImage;
	}

	// Clear image when requested by parent
	export function clearImage() {
		myImg = null;
		if (fileInput) {
			fileInput.value = '';
		}
		clearImageUrlBadge();
	}

	const convertFileToImage = (file) => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];

		if (!file || !allowedTypes.includes(file.type)) {
			alert('Only images are allowed (jpeg, png, gif, svg, webp)');
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (e) => {
			myImg = e.target.result;
			clearImageUrlBadge();
			dispatch('uploadImage', file); // Dispatch the upload event
		};
	};

	const handleFileInput = (e) => {
		const file = e.target.files[0];
		if (file) {
			convertFileToImage(file);
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		isDragOver = true;
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		isDragOver = false;
	};

	const handleDrop = (e) => {
		e.preventDefault();
		isDragOver = false;

		const files = e.dataTransfer.files;
		const text = e.dataTransfer.getData('text/plain');
		const html = e.dataTransfer.getData('text/html');

		// First check if files were dropped (from file system)
		if (files.length > 0) {
			convertFileToImage(files[0]);
			return;
		}

		// Check for image URL from browser drag (when dragging from another tab/website)
		let imageUrl = null;

		// Try to extract URL from text data
		if (text && isValidImageUrl(text.trim())) {
			imageUrl = text.trim();
		}
		// If no URL in text, try to extract from HTML data (common when dragging images)
		else if (html) {
			const urlMatch = html.match(/src=["']([^"']+)["']/);
			if (urlMatch && isValidImageUrl(urlMatch[1])) {
				imageUrl = urlMatch[1];
			}
		}

		if (imageUrl) {
			handleImageFromUrl(imageUrl);
		} else {
			alert('Please drop an image file or drag an image from a browser tab');
		}
	};

	// Handle clipboard paste events
	const handleClipboardPaste = async (e) => {
		const clipboardItems = e.clipboardData?.items;
		if (!clipboardItems) return;

		// Look for image files in clipboard
		for (let item of clipboardItems) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
					convertFileToImage(file);
					return;
				}
			}
		}

		// Look for text/URLs in clipboard
		for (let item of clipboardItems) {
			if (item.type === 'text/plain') {
				const text = await new Promise((resolve) => {
					item.getAsString(resolve);
				});
				if (text && isValidImageUrl(text.trim())) {
					handleImageFromUrl(text.trim());
					return;
				}
			}
		}
	};

	// Handle keyboard shortcuts
	const handleKeydown = (e) => {
		// Handle Ctrl+V for paste
		if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
			e.preventDefault();
			// Trigger paste event manually since we prevented default
			navigator.clipboard
				.read()
				.then(async (clipboardItems) => {
					// Look for image files first
					for (let clipboardItem of clipboardItems) {
						for (let type of clipboardItem.types) {
							if (type.startsWith('image/')) {
								const blob = await clipboardItem.getType(type);
								const file = new File([blob], 'pasted-image.' + type.split('/')[1], { type });
								convertFileToImage(file);
								return;
							}
						}
					}

					// Look for text/URLs
					for (let clipboardItem of clipboardItems) {
						if (clipboardItem.types.includes('text/plain')) {
							const blob = await clipboardItem.getType('text/plain');
							const text = await blob.text();
							if (text && isValidImageUrl(text.trim())) {
								handleImageFromUrl(text.trim());
								return;
							}
						}
					}
				})
				.catch(() => {
					// Fallback: try to read text from clipboard
					navigator.clipboard
						.readText()
						.then((text) => {
							if (text && isValidImageUrl(text.trim())) {
								handleImageFromUrl(text.trim());
							}
						})
						.catch(() => {
							// Silent fail if clipboard access is denied
						});
				});
		}
		// Handle Enter key
		else if (e.key === 'Enter') {
			fileInput?.click();
		}
	};
</script>

<div
	class="drop-zone {isDragOver ? 'drag-over' : ''}"
	role="button"
	tabindex="0"
	on:click={() => fileInput?.click()}
	on:keydown={handleKeydown}
	on:paste={handleClipboardPaste}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
>
	<div class="drop-zone__prompt">
		<p class="text">
			{#if isDragOver}
				Drop image here
			{:else}
				{myImg ? 'Change image' : 'Drop image, drag from browser, paste (Ctrl+V), or click here'}
			{/if}
		</p>
		<img class="preview" src={myImg || placeholderImage} alt="" />
		{#if imageAddedByUrl}
			<span class="badge bg-info text-dark mt-2">Added by URL</span>
		{/if}
	</div>
</div>

<input
	style="display: none"
	type="file"
	accept="image/*"
	bind:this={fileInput}
	on:change={handleFileInput}
/>

<style>
	input[type='text'],
	button,
	.form-control {
		width: 100%;
		box-sizing: border-box;
	}
	.drop-zone {
		min-height: 180px;
		width: 100%;
		border: 2px dashed #ccc;
		border-radius: 8px;
		background: #fafafa;
		cursor: pointer;
		transition: border-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
	}
	.drop-zone.drag-over {
		border-color: #007bff;
		background: #e6f7ff;
	}
	.drop-zone__prompt {
		width: 100%;
		text-align: center;
	}
	.preview {
		max-width: 100%;
		max-height: 120px;
		margin: 0.5rem auto;
		display: block;
	}
</style>
