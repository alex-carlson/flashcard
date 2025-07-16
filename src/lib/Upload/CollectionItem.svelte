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
	import { uploadData } from './uploader.js';
	import { addToast } from '../../stores/toast.js';
	export let item;
	export let index;
	export let editableItemId;
	export let isReordering;
	export let collection; // Add collection prop to get category
	let isCropping = false; // Track if cropping is active
	let isDrawing = false; // Track if drawing is active
	const dispatch = createEventDispatcher();

	function removeItemHandler() {
		dispatch('removeItem', item.id);
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

	async function uploadChangedImage(file, fileName = null) {
		try {
			// Set the originalname property on the file
			if (file && typeof file === 'object') {
				const defaultFileName = fileName || file.name || 'modified-image.jpg';
				file.originalname = defaultFileName;
			}

			// Create a temporary item object with the new file
			const tempItem = {
				...item,
				file: file,
				// Keep the existing answer
				answer: item.answer,
				// Add category from collection
				category: collection?.category || item.category
			};

			console.log('Temporary item for upload:', tempItem);

			// Upload the new image
			const result = await uploadData(tempItem, item.id, false); // false indicates this is an update

			if (result && result.length > 0) {
				// Update the item with the new image URL
				const updatedItem = result[0].items.find((i) => i.id === item.id);
				if (updatedItem) {
					item.image = updatedItem.image;

					addToast({
						type: 'success',
						message: 'Image updated successfully!'
					});

					// Dispatch event to parent to update the collection
					dispatch('updateItem', { id: item.id, image: item.image });
				}
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

		await uploadChangedImage(croppedFile, 'cropped-image.jpg');
		isCropping = false; // Reset cropping state
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

		try {
			const url = new URL(image);
			const segments = url.pathname.split('/').reverse();

			for (const segment of segments) {
				const match = segment.match(/\.(png|jpe?g)$/i);
				if (match) return true;
			}
		} catch {
			// Fallback for non-URL strings
			const segments = image.split('?')[0].split('#')[0].split('/').reverse();

			for (const segment of segments) {
				const match = segment.match(/\.(png|jpe?g)$/i);
				if (match) return true;
			}
		}

		return false;
	}
</script>

<li class={isReordering ? 'item reorder' : 'item'} draggable={isReordering}>
	{#if editableItemId === item.id && item.id != null}
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
			{:else}
				<img src={item.image} alt="To crop" class="border" />
				{#if !isCropping && !isDrawing}
					<div class="actions my-3">
						{#if isEditable(item.image)}
							<button class="btn btn-secondary" on:click={() => (isCropping = true)}>Crop</button>
							<button class="btn btn-secondary" on:click={() => (isDrawing = true)}>Edit</button>
						{/if}
					</div>
				{:else if isCropping}
					<Cropper src={item.image} on:cropped={onCropped} on:cancel={onCancel} />
				{:else if isDrawing}
					<Drawing src={item.image} on:save={onSave} on:cancel={onCancel} />
				{/if}
			{/if}
			<input id="editedAnswer" type="text" bind:value={item.answer} placeholder="Enter an answer" />
			<div class="vertical">
				<button class="success" on:click={saveEditHandler}><Fa icon={faFloppyDisk} /></button>
				<button class="danger" on:click={(editableItemId = null)}><Fa icon={faBan} /></button>
			</div>
		</div>
	{:else}
		{#if item.question != null}
			<span class="question">{item.question}</span>
		{:else if item.audio != null}
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
			<img class="preview" src={item.file || item.image} alt="Preview" />
		{/if}
		<span>{item.answer}</span>
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
