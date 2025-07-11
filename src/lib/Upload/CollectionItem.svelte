<script>
	import { createEventDispatcher } from 'svelte';
	import { Fa } from 'svelte-fa';
	import Cropper from './Cropper.svelte';
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
	async function onCropped(event) {
		console.log('Cropped event received:', event);
		const croppedFile = event.detail;

		try {
			// Set the originalname property on the cropped file
			if (croppedFile && typeof croppedFile === 'object') {
				const fileName = croppedFile.name || 'cropped-image.jpg';
				(croppedFile as any).originalname = fileName;
			}

			// Create a temporary item object with the new cropped image
			const tempItem = {
				...item,
				file: croppedFile,
				// Keep the existing answer
				answer: item.answer,
				// Add category from collection
				category: collection?.category || item.category
			};

			console.log('Temporary item for upload:', tempItem);

			// Upload the new cropped image
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
			console.error('Error updating cropped image:', error);
			addToast({
				type: 'error',
				message: 'Failed to update image. Please try again.'
			});
		}
	}
</script>

<li class={isReordering ? 'item reorder' : 'item'} draggable={isReordering}>
	{#if editableItemId === item.id}
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
				<Cropper src={item.image} on:cropped={onCropped} />
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
				{#await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${item.audio}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`)
					.then((res) => res.json())
					.then((data) => data.items[0]?.snippet) then snippet}
					{#if snippet}
						<img src={snippet.thumbnails?.medium?.url} alt={snippet.title} />
						<p>{snippet.title}</p>
					{:else}
						<p>{item.audio}</p>
					{/if}
				{:catch}
					<p>{item.audio}</p>
				{/await}
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
