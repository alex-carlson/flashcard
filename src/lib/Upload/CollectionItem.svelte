<script>
	import { createEventDispatcher } from 'svelte';
	import Cropper from './Cropper.svelte';
	import Drawing from './Drawing.svelte';
	import AnswerInput from '../components/AnswerInput.svelte';
	import { Fa } from 'svelte-fa';
	import {
		faPenToSquare,
		faTrashCan,
		faFloppyDisk,
		faBan,
		faChevronUp,
		faChevronDown,
		faPlus
	} from '@fortawesome/free-solid-svg-icons';
	import { uploadData, saveEdit } from './uploader.js';
	import { addToast } from '../../stores/toast.js';
	import { user } from '../../stores/user.js';
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
	async function saveEditHandler() {
		try {
			// Prepare the edit data in the format expected by the server
			// Only include fields that have values to avoid sending undefined/null
			const editData = {
				id: item.id,
				category: collection?.category || item.category,
				collection: collection?.category || item.category,
				author_id: $user.public_id,
				isUpdate: true
			};

			// Only add fields that have values
			if (item.question !== undefined && item.question !== null) {
				editData.question = item.question;
			}
			if (item.answer !== undefined && item.answer !== null) {
				editData.answer = item.answer;
			}
			if (item.answers !== undefined && item.answers !== null) {
				editData.answers = item.answers;
			}
			if (item.supplemental !== undefined && item.supplemental !== null) {
				editData.supplemental = item.supplemental;
			}
			if (item.extra !== undefined && item.extra !== null) {
				editData.extra = item.extra;
			}
			if (item.image !== undefined && item.image !== null) {
				editData.image = item.image;
			}
			if (item.audio !== undefined && item.audio !== null) {
				editData.audio = item.audio;
			}
			if (item.thumbnail !== undefined && item.thumbnail !== null) {
				editData.thumbnail = item.thumbnail;
			}
			if (item.title !== undefined && item.title !== null) {
				editData.title = item.title;
			}

			console.log('Saving edit with data:', editData);

			// Use the saveEdit function from uploader.js
			const result = await saveEdit(editData);

			console.log('Save edit result structure:', result);

			if (result) {
				// Handle different possible response structures
				const updatedItem = result.updatedItem || result.item || result;

				if (updatedItem && updatedItem.id) {
					// Use the server's returned updated item as the source of truth
					Object.assign(item, updatedItem);
					dispatch('saveEdit', updatedItem);
				}

				// Always clear editableItemId on successful save
				editableItemId = null;
			}
		} catch (error) {
			console.error('Error saving edit:', error);
			addToast({
				type: 'error',
				message: 'Failed to save changes. Please try again.'
			});
		}
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
				category: collection?.category || item.category,
				// Send the existing item ID for server validation
				existingItemId: item.id,
				// Flag this as an update operation
				isUpdate: true
			};

			console.log('Temporary item for upload with existing ID validation:', tempItem);

			// Upload the new image with existing item ID for validation
			const result = await uploadData(tempItem, item.id, false); // false indicates this is an update

			if (result && result.length > 0) {
				// Use the server's returned updated item as the source of truth
				const updatedItem = result[0].items.find((i) => i.id === item.id);
				if (updatedItem) {
					// Update all item properties with the server's data
					Object.assign(item, updatedItem);

					addToast({
						type: 'success',
						message: 'Image updated successfully!'
					});

					// Dispatch the complete updated item
					dispatch('updateItem', updatedItem);
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

		//get extension from type
		const fileExtension = croppedFile.type.split('/')[1] || 'png';

		await uploadChangedImage(croppedFile, 'cropped-image.' + fileExtension);
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
			<textarea bind:value={item.supplemental} placeholder="Supplemental Question Text"></textarea>
			<AnswerInput {item} idPrefix="edit-{item.id}" label="Answer:" />
			<input id="editedExtra" type="text" bind:value={item.extra} placeholder="Enter extra info" />
			<div class="vertical">
				<button class="success" on:click={saveEditHandler}><Fa icon={faFloppyDisk} /></button>
				<button class="danger" on:click={(editableItemId = null)}><Fa icon={faBan} /></button>
			</div>
		</div>
	{:else}
		<div class="vertical">
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
			<span>{@html (item.supplemental || '').replace(/\n/g, '<br>')}</span>
		</div>
		<div class="answer-field vertical">
			{#if item.answers && item.answers.length > 0}
				{#if item.isMultipleChoice}
					<div class="answer-display">
						<small class="text-muted">Multiple Choice:</small>
						{#each item.answers as answer, index}
							<span class="answer-option" class:correct={item.correctAnswerIndex === index}>
								{index + 1}. {answer}
								{#if item.correctAnswerIndex === index}✓{/if}
							</span>
						{/each}
					</div>
				{:else}
					<div class="answer-display">
						<small class="text-muted"
							>Multi-Answer (Required: {item.numRequired || item.answers.length}):</small
						>
						{#each item.answers as answer, index}
							<span class="answer-option">{index + 1}. {answer}</span>
						{/each}
					</div>
				{/if}
			{:else}
				<span>{item.answer}</span>
			{/if}
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

<style>
	.answer-display {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.answer-option {
		padding: 0.25rem 0.5rem;
		background: #f8f9fa;
		border-radius: 0.25rem;
		font-size: 0.9rem;
	}
	.answer-option.correct {
		background: #d4edda;
		color: #155724;
		font-weight: 600;
	}
</style>
