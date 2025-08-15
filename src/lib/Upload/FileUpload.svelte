<script>
	import { createEventDispatcher } from 'svelte';
	export let placeholderImage = ''; // Placeholder image input prop
	export let clearAfterUpload = false; // Whether to clear the image after upload

	const dispatch = createEventDispatcher();
	let fileInput;
	let myImg = null;
	let isDragOver = false;
	let imageUrl = '';
	let imageAddedByUrl = false;

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
			dispatch('uploadImage', file);

			// Only clear if explicitly requested
			if (clearAfterUpload) {
				setTimeout(() => {
					myImg = null;
					if (fileInput) {
						fileInput.value = '';
					}
				}, 100);
			}
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
		if (files.length > 0) {
			convertFileToImage(files[0]);
		}
	};

	function handleImageUrlPaste() {
		const url = imageUrl.trim();
		if (!url) return;
		// Basic validation for image URL
		if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(url)) {
			alert('Please enter a valid image URL (jpg, png, gif, svg, webp)');
			return;
		}
		myImg = url;
		imageAddedByUrl = true;
		dispatch('uploadImage', url);
	}

	// Reset badge if user uploads a file or clears image
	function clearImageUrlBadge() {
		imageAddedByUrl = false;
	}
</script>

<div
	class="drop-zone {isDragOver ? 'drag-over' : ''}"
	role="button"
	tabindex="0"
	on:click={() => fileInput?.click()}
	on:keydown={(e) => {
		if (e.key === 'Enter') {
			fileInput?.click();
		}
	}}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
>
	<div class="drop-zone__prompt">
		<p class="text">
			{#if isDragOver}
				Drop image here
			{:else}
				{myImg ? 'Change image' : 'Drop your image or click here'}
			{/if}
		</p>
		<img class="preview" src={myImg || placeholderImage} alt="" />
		{#if imageAddedByUrl}
			<span class="badge bg-info text-dark mt-2">Added by URL</span>
		{/if}
	</div>
</div>

<!-- Image URL input below drop zone -->
<div class="mt-2 d-flex flex-column gap-2">
	<input
		type="text"
		class="form-control"
		placeholder="Paste image URL"
		bind:value={imageUrl}
		on:keydown={(e) => {
			if (e.key === 'Enter') handleImageUrlPaste();
		}}
	/>
	<button class="btn btn-sm btn-primary" on:click={handleImageUrlPaste}>Add by URL</button>
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
