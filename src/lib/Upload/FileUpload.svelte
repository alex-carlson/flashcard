<script>
	import { createEventDispatcher } from 'svelte';
	export let placeholderImage = ''; // Placeholder image input prop
	export let clearAfterUpload = false; // Whether to clear the image after upload

	const dispatch = createEventDispatcher();
	let fileInput;
	let myImg = null;
	let isDragOver = false;

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
	</div>
</div>

<input
	style="display: none"
	type="file"
	accept="image/*"
	bind:this={fileInput}
	on:change={handleFileInput}
/>
