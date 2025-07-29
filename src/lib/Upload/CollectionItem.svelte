<script>
	import { createEventDispatcher } from 'svelte';
	import { Fa } from 'svelte-fa';
	import Cropper from './Cropper.svelte';
	import Drawing from './Drawing.svelte';
	import {
		faPenToSquare,
		faTrashCan,
		faFloppyDisk,
		faBan,
		faChevronUp,
		faChevronDown
	} from '@fortawesome/free-solid-svg-icons';
	import { SaveImageEdit, uploadData } from './uploader.js';
	import { getCurrentUser } from '../api/supabaseClient';
	import { addToast } from '../../stores/toast.js';
	import { apiFetch } from '../api/fetchdata';
	export let itemId;
	export let index;
	export let editableItemId;
	export let isReordering;
	export let collection; // Add collection prop to get category
	let item;
	let isCropping = false; // Track if cropping is active
	let isDrawing = false; // Track if drawing is active
	let lastFetchedId = null;
	const dispatch = createEventDispatcher();

	$: if (collection && itemId != null && itemId !== lastFetchedId) {
		lastFetchedId = itemId;
		(async () => {
			item = await apiFetch(`/items/${itemId}`);
			console.log('Fetched item:', item);
		})();
	}

	function removeItemHandler() {
		console.log('Removing item with ID:', itemId);
		dispatch('removeItem', itemId);
	}

	function reorderItemHandler(prevIndex, newIndex) {
		dispatch('reorderItem', { prevIndex, newIndex });
	}
	function saveEditHandler() {
		editableItemId = null;
		dispatch('saveEdit', item);
	}

	async function addItemMetaData(videoId) {
		try {
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
			);
			const data = await response.json();
			if (data.items && data.items.length > 0) {
				const snippet = data.items[0].snippet;
				const updatedItem = {
					...item,
					thumbnail: snippet.thumbnails?.medium?.url || '',
					title: snippet.title || ''
				};
				console.log('Updated item with metadata:', updatedItem);
				dispatch('saveEdit', updatedItem);
			} else {
				console.warn('No video data found for ID:', videoId);
			}
		} catch (err) {
			console.error('Error fetching video data:', err);
		}
	}

	async function uploadChangedImage(file) {
		try {
			console.log('Uploading file:', file, 'size:', file.size, 'type:', file.type);
			const formData = new FormData();
			formData.append('uuid', itemId);
			formData.append('file', file); // This must be the cropped file
			formData.append('folder', '/');
			formData.append('forceJpeg', false);
			formData.append('author_id', collection.author_uuid);

			for (const [key, value] of formData.entries()) {
				console.log(`formData[${key}] =`, value);
			}

			// Upload the new image
			const result = await SaveImageEdit(formData); // false indicates this is an update

			console.log('Image upload result:', result);

			if (result) {
				item.thumbnail = result.url;
				item.prompt = result.url; // Update the prompt with the new image URL
				item.image = result.url; // Update the image field

				addToast({
					type: 'success',
					message: 'Image updated successfully!'
				});

				dispatch('updateItem', item);
			}
		} catch (error) {
			console.error('Error updating image:', error);
			addToast({
				type: 'error',
				message: 'Failed to update image. Please try again.'
			});
		}
	}

	async function onCropped(event) {
		console.log('Cropped event received:', event);
		const croppedFile = event.detail;
		console.log('Cropped file:', croppedFile, 'size:', croppedFile.size, 'type:', croppedFile.type);
		await uploadChangedImage(croppedFile);
		isCropping = false;
	}

	async function onSave(event) {
		console.log('Drawing saved:', event);
		const { dataURL } = event.detail;

		// Convert dataURL to File object
		const response = await fetch(dataURL);
		const blob = await response.blob();
		const file = new File([blob], 'drawing.png', { type: 'image/png' });

		await uploadChangedImage(file, 'drawing.png');
		isDrawing = false; // Reset drawing state
	}

	function onCancel() {
		console.log('Drawing cancelled');
		isCropping = false; // Reset cropping state
		isDrawing = false; // Reset drawing state
	}

	function isEditable(image) {
		if (!image || typeof image !== 'string') return false;

		// Still raster image extensions (case insensitive)
		// Exclude known animated formats like gif
		const stillRasterExtensions = /\.(bmp|png|jpe?g|webp|latest)$/i;
		const animatedExtensions = /\.(gif|apng|svg)$/i; // svg is vector, usually not editable as raster

		try {
			const url = new URL(image);
			const segments = url.pathname.split('/').reverse();

			for (const segment of segments) {
				// If it matches an animated extension, return false immediately
				if (animatedExtensions.test(segment)) return false;

				if (stillRasterExtensions.test(segment)) return true;
			}
		} catch {
			// Fallback for non-URL strings
			const segments = image.split('?')[0].split('#')[0].split('/').reverse();

			for (const segment of segments) {
				if (animatedExtensions.test(segment)) return false;

				if (stillRasterExtensions.test(segment)) return true;
			}
		}

		return false;
	}
</script>

<li class={isReordering ? 'item reorder' : 'item'} draggable={isReordering}>
	{#if itemId == null}
		<div class="loading">Loading...</div>
	{:else if item == null}
		<div class="error">Item not found</div>
		<!-- add remove button -->
		<div class="vertical">
			<button class="remove danger" on:click={() => removeItemHandler(itemId)}>
				<Fa icon={faTrashCan} />
			</button>
		</div>
	{:else if editableItemId === item.id && item.id != null}
		<div class="editing">
			{#if item.question != null}
				<input
					id="editedQuestion"
					type="text"
					bind:value={item.question}
					placeholder="Enter a question"
				/>
			{:else if item.audio != null}
				<input
					id="editedAudio"
					type="text"
					bind:value={item.audio}
					placeholder="Enter an audio URL"
				/>
			{:else if isEditable(item.prompt)}
				<img src={item.prompt} alt="To crop" class="border" />
				{#if !isCropping && !isDrawing}
					<div class="actions my-3">
						<button class="btn btn-secondary" on:click={() => (isCropping = true)}>Crop</button>
						<button class="btn btn-secondary" on:click={() => (isDrawing = true)}>Edit</button>
					</div>
				{:else if isCropping}
					<Cropper src={item.prompt} on:cropped={onCropped} on:cancel={onCancel} />
				{:else if isDrawing}
					<Drawing src={item.prompt} on:save={onSave} on:cancel={onCancel} />
				{/if}
			{/if}
			<input id="editedAnswer" type="text" bind:value={item.answer} placeholder="Enter an answer" />
			<input id="editedExtra" type="text" bind:value={item.extra} placeholder="Enter extra info" />
			<div class="vertical">
				<button class="success" on:click={saveEditHandler}><Fa icon={faFloppyDisk} /></button>
				<button class="danger" on:click={(editableItemId = null)}><Fa icon={faBan} /></button>
			</div>
		</div>
	{:else}
		{#if item.type == 'text'}
			<span class="question">{item.prompt}</span>
		{:else if item.type == 'audio'}
			<div class="audio">
				{#if item.thumbnail}
					<img src={item.thumbnail} alt={item.answer} />
					<p>{item.title || item.answer}</p>
				{:else}
					<button on:click={() => addItemMetaData(item.audio)}>
						<Fa icon={faPenToSquare} />Update Data</button
					>
				{/if}
			</div>
		{:else}
			<img class="preview" src={`${item.prompt}`} alt="Preview" />
		{/if}
		<div class="answer-field vertical">
			<span>{item.answer}</span>
			<span>{item.extra}</span>
		</div>
		{#if isReordering}
			<div class="reorder">
				<button on:click={() => reorderItemHandler(index, index - 1)}>
					<Fa icon={faChevronUp} />
				</button>
				<button on:click={() => reorderItemHandler(index, index + 1)}>
					<Fa icon={faChevronDown} />
				</button>
			</div>
		{:else}
			<div class="vertical">
				<button class="edit secondary" on:click={() => (editableItemId = item.id)}>
					<Fa icon={faPenToSquare} />
				</button>
				<button class="remove danger" on:click={() => removeItemHandler(item.id)}>
					<Fa icon={faTrashCan} />
				</button>
			</div>
		{/if}
	{/if}
</li>
