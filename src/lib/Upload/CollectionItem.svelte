<script>
	import { createEventDispatcher } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import Cropper from './Cropper.svelte';
	import Drawing from './Drawing.svelte';
	import AnswerInput from '../components/AnswerInput.svelte';
	import { QuestionType, AnswerType, isValidAnswerType } from '$lib/types/enums';
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
			const editData = {
				id: item.id,
				collection: collection?.category || item.category,
				author_id: $user.public_id,
				isUpdate: true // Required by server to use addItemToCollectionHelper path
			};

			// Only add fields that have values and are not undefined/null/empty
			if (item.question !== undefined && item.question !== null && item.question !== '') {
				editData.question = item.question;
			}
			if (item.answer !== undefined && item.answer !== null && item.answer !== '') {
				editData.answer = item.answer;
			}
			if (
				item.answers !== undefined &&
				item.answers !== null &&
				item.answerType !== AnswerType.SINGLE
			) {
				editData.answers = item.answers;
			}
			if (
				item.supplemental !== undefined &&
				item.supplemental !== null &&
				item.supplemental !== ''
			) {
				editData.supplemental = item.supplemental;
			}
			if (item.extra !== undefined && item.extra !== null && item.extra !== '') {
				editData.extra = item.extra;
			}
			if (item.image !== undefined && item.image !== null && item.image !== '') {
				editData.image = item.image;
			}
			if (item.audio !== undefined && item.audio !== null && item.audio !== '') {
				editData.audio = item.audio;
			}
			if (item.thumbnail !== undefined && item.thumbnail !== null && item.thumbnail !== '') {
				editData.thumbnail = item.thumbnail;
			}
			if (item.title !== undefined && item.title !== null && item.title !== '') {
				editData.title = item.title;
			}
			if (
				item.questionType !== undefined &&
				item.questionType !== null &&
				item.questionType !== ''
			) {
				editData.questionType = item.questionType;
			} else {
				if (item.image) {
					editData.questionType = QuestionType.IMAGE;
				} else if (item.audio) {
					editData.questionType = QuestionType.AUDIO;
				} else {
					editData.questionType = QuestionType.TEXT;
				}
			}

			if (item.answerType !== undefined && item.answerType !== null && item.answerType !== '') {
				editData.answerType = item.answerType;
			} else {
				if (item.answers) {
					if (item.correctAnswerIndex !== undefined && item.correctAnswerIndex !== null) {
						editData.answerType = AnswerType.MULTIPLE_CHOICE;
					} else {
						editData.answerType = AnswerType.MULTI_ANSWER;
					}
				} else {
					editData.answerType = AnswerType.SINGLE;
				}
			}

			if (item.numRequired !== undefined && item.numRequired !== null && item.numRequired !== '') {
				editData.numRequired = item.numRequired;
			}
			if (item.correctAnswerIndex !== undefined && item.correctAnswerIndex !== null) {
				editData.correctAnswerIndex = item.correctAnswerIndex;
			}

			if (editData && editData.id) {
				// Use the server's returned updated item as the source of truth
				dispatch('saveEdit', editData);
			}
			editableItemId = null;
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
				isUpdate: true,
				// Include type information
				questionType: item.questionType || QuestionType.IMAGE,
				answerType: item.answerType || AnswerType.SINGLE
			};

			console.log('Temporary item for upload with existing ID validation:', tempItem);

			// Upload the new image with existing item ID for validation - use a new UUID but include update flags
			const result = await uploadData(tempItem, item.id, false);

			if (result && Array.isArray(result) && result.length > 0 && result[0]?.items) {
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
			} else {
				console.warn('Upload result structure unexpected:', result);
				addToast({
					type: 'warning',
					message: 'Image uploaded but response format unexpected. Please refresh.'
				});
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

<li class="d-flex {isReordering ? 'item reorder' : 'item'}" draggable={isReordering}>
	{#if editableItemId === item.id && item.id != null}
		<div class="editing">
			{#if item.image != null}
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
			{#if item.questionType == QuestionType.TEXT}
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
		<div class="vertical flex-half d-flex flex-column h-100">
			{#if item.file || item.image || item.questionType == QuestionType.IMAGE}
				<img class="preview" src={item.file || item.image} alt="Preview" />
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
				<span class="question">{item.question}</span>
			{/if}
			<span>{@html (item.supplemental || '').replace(/\n/g, '<br>')}</span>
		</div>
		<div class="answer-field vertical flex-half d-flex flex-column">
			<div class="answer-display">
				{#if item.answerType === AnswerType.SINGLE || !isValidAnswerType(item.answerType)}
					<span>{item.answer}</span>
				{:else if item.answerType === AnswerType.MULTIPLE_CHOICE}
					<small class="text-muted">Multiple Choice:</small>
					{#each item.answers || [] as answer, index}
						<span class="answer-option" class:correct={item.correctAnswerIndex === index}>
							{index + 1}. {answer}
							{#if item.correctAnswerIndex === index}✓{/if}
						</span>
					{/each}
				{:else}
					<div class="answer-display">
						<small class="text-muted"
							>Multi-Answer (Required: {item.numRequired ||
								(item.answers && item.answers.length) ||
								0}):</small
						>
						{#each item.answers || [] as answer, index}
							<span class="answer-option">{index + 1}. {answer}</span>
						{/each}
					</div>
				{/if}
			</div>
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
