<script>
	import { user } from '$stores/user';
	import Collections from '$lib/Collections.svelte';
	import FileUpload from '$lib/Upload/FileUpload.svelte';
	import AudioUploader from '$lib/Upload/AudioUploader.svelte';
	import ImageSuggestions from '$lib/ImageSuggestions.svelte';
	import CollectionItem from '$lib/Upload/CollectionItem.svelte';
	import { fetchUserCollections, fetchCollectionById } from '$lib/api/collections';
	import {
		uploadThumbnail,
		uploadQuestion,
		uploadAudio,
		uploadData,
		removeItem,
		createCollection,
		confirmDelete,
		saveEdit,
		reorderItems
	} from '$lib/Upload/uploader';
	import { apiFetch } from '$lib/api/fetchdata';
	import { addToast } from '../../stores/toast';
	import Cropper from '$lib/Upload/Cropper.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import { Fa } from 'svelte-fa';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import QuestionTypeForm from '$lib/components/QuestionTypeForm.svelte';
	let collection = null;
	let questionType = 'Image';
	let isPublic = false;
	let editableItemId = null;
	let isReordering = false;
	let collections = [];
	let showImageSuggestions = false;
	let showCropper = false;
	let item = {};
	let tempCategory = '';
	let tempDescription = '';
	let tempTags = '';
	let isShuffle = false;
	let answerInput; // Reference to the answer input field
	let questionInput; // Reference to the question input field
	let thumbnailUploader; // Reference to the thumbnail FileUpload component
	let itemUploader; // Reference to the item FileUpload component
	let suggestedTags = [];

	let tagDebounceTimeout;

	let imageSuggestionFileType = 'any';

	$: if ($user?.public_id) {
		console.log('User public_id:', $user.public_id);
		loadCollections();
	}

	async function loadCollections() {
		try {
			const result = await fetchUserCollections($user.public_id);
			collections = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
		} catch (error) {
			console.error('Error fetching user collections:', error);
			addToast({
				type: 'error',
				message: 'Failed to load collections. Please try again later.'
			});
		}
	}

	function focusAnswerInput() {
		if (answerInput) {
			answerInput.focus();
			answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function focusQuestionInput() {
		if (questionInput) {
			questionInput.focus();
			questionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
	async function setCollection(collectionId) {
		try {
			const newCollection = await fetchCollectionById(collectionId, true);

			if (newCollection) {
				// Set the collection with all its data
				collection = newCollection;

				// Set form values
				item.category = collection.category || '';
				tempCategory = collection.category || '';
				tempDescription = collection.description || '';
				tempTags = Array.isArray(collection.tags)
					? collection.tags.join(', ')
					: typeof collection.tags === 'string'
						? collection.tags.includes('[')
							? JSON.parse(collection.tags).join(', ')
							: collection.tags
						: '';
				isPublic = !collection.private || false;
				isShuffle = collection.shuffle || false;

				// Initialize items array if it doesn't exist
				if (!collection.items) {
					collection.items = [];
				}

				// Set items length
				collection.itemsLength = collection.items ? collection.items.length : 0;

				console.log('Collection set with', collection.itemsLength, 'items');
			} else {
				console.error('No collection data received');
				addToast({
					type: 'error',
					message: 'Failed to load collection data. Please try again.'
				});
			}
		} catch (error) {
			console.error('Error fetching collection:', error);
			addToast({
				type: 'error',
				message: 'Failed to load collection. Please try again.'
			});
		}
	}

	function handleCollectionDeleted(newCollection) {
		collection = null;
		addToast({
			type: 'success',
			message: 'Collection deleted successfully!'
		});
	}

	function toggleCropper() {
		showCropper = !showCropper;
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

	async function setVisible(event) {
		const data = {
			category: collection.category,
			author_public_id: $user.public_id,
			visible: event.target.checked
		};

		console.log('Setting visibility:', data);

		try {
			await apiFetch('/collections/setVisible', 'POST', data);
		} catch (error) {
			console.error('Error setting visibility:', error);
			addToast({
				type: 'error',
				message: 'Failed to update visibility. Please try again.'
			});
		}
	}

	async function updateCollection() {
		const data = {
			private: !isPublic, // isPublic is true for public, so private is the inverse
			tags: tempTags || '',
			category: tempCategory || collection.category || '',
			description: tempDescription || collection.description || '',
			shuffle: isShuffle
		};

		try {
			const result = await apiFetch(`/collections/update/${collection.id}`, 'POST', data, false);
			if (result) {
				addToast({
					type: 'success',
					message: 'Collection updated successfully!'
				});
				loadCollections();
			}
		} catch (error) {
			console.error('Error updating collection:', error);
			addToast({
				type: 'error',
				message: 'Failed to update collection. Please try again.'
			});
		}
	}

	async function fetchRecommendedTags(data) {
		try {
			const response = await apiFetch('/collections/tags/recommended', 'POST', { query: data });
			if (response && Array.isArray(response)) {
				// Map to just tag strings if response is array of objects
				return response.map((t) => (typeof t === 'string' ? t : t.tag));
			}
			return [];
		} catch (error) {
			console.error('Error fetching recommended tags:', error);
			return [];
		}
	}

	async function onCropped(event) {
		console.log('Cropped event received:', event);
		const croppedFile = event.detail;

		//get extension from type
		const fileExtension = croppedFile.type.split('/')[1] || 'png';

		await uploadChangedImage(croppedFile, 'cropped-image.' + fileExtension);
		showCropper = false;
	}

	$: if (tempCategory || tempDescription) {
		const query = [tempCategory, tempDescription].filter(Boolean).join(' ');
		if (query.length > 3) {
			clearTimeout(tagDebounceTimeout);
			tagDebounceTimeout = setTimeout(() => {
				fetchRecommendedTags(query).then((tags) => {
					// Convert all tags to lowercase
					tags = tags.map((t) => t.toLowerCase());
					// Get current tags as lowercase array
					const currentTags = tempTags
						.split(',')
						.map((t) => t.trim().toLowerCase())
						.filter(Boolean);
					// Filter out tags already present
					suggestedTags = tags.filter((t) => !currentTags.includes(t));
				});
			}, 400); // 400ms debounce
		} else {
			clearTimeout(tagDebounceTimeout);
			suggestedTags = [];
		}
	}
</script>

<svelte:head>
	<title>Manage Collections</title>
</svelte:head>

<div class="form white uploader pb-3 col-12 col-md-10 col-lg-8 mx-auto">
	{#if !user}
		<p><a href="/login">Log in</a> to manage your collections.</p>
	{:else}
		<div class="select-quiz mt-4 p-2">
			<h2>Select a Quiz</h2>
			<Collections
				{collections}
				condensed
				grid
				list
				limit={-1}
				onSelectCollection={(e) => {
					setCollection(e.id);
				}}
			/>
		</div>
		{#if collection === null}
			<div class="create mt-4 p-2">
				<h2>Create a new Quiz</h2>
				<input
					type="text"
					class="form-control mb-4"
					bind:value={tempCategory}
					placeholder="Category Name"
				/>
				<button
					class="btn btn-primary"
					on:click={async () => {
						const result = await createCollection(tempCategory);
						if (result && result.length > 0) {
							await loadCollections();
							// Find the new collection by id and set it
							const newCol = result[0];
							collection = collections.find((c) => c.id === newCol.id) || newCol;
							setCollection(newCol.id);
						}
					}}
				>
					Create
				</button>
			</div>
		{:else}
			<div class="collection card mb-4 p-2">
				<div class="collection-info row g-3 align-items-center">
					<div
						class="thumbnail_container d-flex flex-row align-items-center justify-content-center gap-3"
						style="min-height: 180px; width: 100%; flex-wrap: wrap;"
					>
						{#if collection.thumbnail_url}
							<div class="preview">
								<img
									src={collection.thumbnail_url}
									alt="Collection Thumbnail"
									class="img-fluid"
									style="width: 100%; max-width: 180px; max-height: 180px; object-fit: contain; flex: 1 1 120px; min-width: 80px;"
								/>
								<!-- add button to toggle cropper -->
								<button class="btn btn-secondary" on:click={() => toggleCropper(collection.id)}>
									Edit Thumbnail
								</button>
								{#if showCropper}
									<Cropper
										src={collection.thumbnail_url}
										on:cropped={onCropped}
										on:cancel={toggleCropper}
									/>
								{/if}
							</div>
						{/if}
						<div
							class="thumbnail-uploader d-flex flex-column align-items-center justify-content-center"
						>
							<FileUpload
								bind:this={thumbnailUploader}
								on:uploadImage={async (event) => {
									console.log('Thumbnail upload event:', event.detail);
									try {
										const result = await uploadThumbnail(event.detail, collection.category);
										if (result) {
											console.log('Thumbnail upload successful:', result);
											// Clear the image after successful upload
											if (thumbnailUploader && typeof thumbnailUploader.clearImage === 'function') {
												thumbnailUploader.clearImage();
											}
										}
									} catch (error) {
										console.error('Error uploading thumbnail:', error);
										addToast({
											type: 'error',
											message: 'Failed to upload thumbnail. Please try again.'
										});
									}
								}}
							/>
						</div>
					</div>
					<div class="col-12 col-md">
						<input
							type="text"
							class="form-control mb-2"
							bind:value={tempCategory}
							placeholder={collection.category}
						/>
						<textarea
							class="form-control mb-2"
							bind:value={tempDescription}
							placeholder="Category Description (Optional)"
						></textarea>
						<input
							type="text"
							class="form-control mb-2"
							placeholder="Add tags (comma-separated)"
							bind:value={tempTags}
						/>
						{#if suggestedTags.length > 0}
							<div class="suggested-tags mb-2">
								<span class="me-2 text-muted">Suggestions:</span>
								{#each suggestedTags as tag}
									<button
										type="button"
										class="btn btn-sm btn-outline-secondary me-1 mb-1"
										on:click={() => {
											const tagsArr = tempTags
												.split(',')
												.map((t) => t.trim())
												.filter(Boolean);
											if (!tagsArr.includes(tag)) {
												tempTags = tagsArr.concat(tag).join(', ');
											}
										}}
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}
						<form
							class="privacy-form form-check form-switch d-flex align-items-center gap-3 mb-2"
							on:submit|preventDefault
						>
							<label for="privacy-toggle" class="form-label me-5 mb-0">Privacy</label>
							<input
								id="privacy-toggle"
								type="checkbox"
								class="form-check-input"
								bind:checked={isPublic}
								aria-label="Privacy"
							/> <span>{isPublic ? 'Public' : 'Private'}</span>
							<span class="small-text">({collection.itemsLength} questions)</span>
						</form>
						<form class="shuffle-form form-check form-switch d-flex align-items-center gap-3 mb-2">
							<label for="shuffle-toggle" class="form-label me-5 mb-0">Shuffle Questions</label>
							<input
								id="shuffle-toggle"
								type="checkbox"
								class="form-check-input"
								bind:checked={isShuffle}
								aria-label="Shuffle Questions"
							/> <span>{isShuffle ? 'Shuffle for each play' : "Don't shuffle"}</span>
						</form>
						<button type="button" class="btn btn-primary mt-2" on:click={updateCollection}>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		{/if}
		{#if collection}
			<div class="uploads py-2">
				<h4>Questions</h4>
				<ul class="items-list list-group mb-4">
					{#if collection.items && collection.items.length > 0}
						{#each collection.items as item, index (item.id)}
							<CollectionItem
								{item}
								{index}
								{collection}
								bind:editableItemId
								on:removeItem={async () => {
									const updatedItems = await removeItem(item.id, collection.category);
									if (updatedItems) {
										console.log('updatedItems:', updatedItems);
										collection.items = updatedItems.items;
										collection.itemsLength = updatedItems.items.length;
									}
								}}
								on:saveEdit={async (e) => {
									console.log('Save edit event:', e.detail);
									const d = {
										collection: collection.category,
										author_id: $user.public_id,
										...e.detail
									};
									console.log('Data to save:', d);
									const result = await saveEdit(d);
									if (result) {
										collections = result;
									}
								}}
								on:updateItem={(e) => {
									const itemIndex = collection.items.findIndex((i) => i.id === e.detail.id);
									if (itemIndex !== -1) {
										const updatedItem = {
											...collection.items[itemIndex],
											...e.detail
										};

										// If the image was updated, append a cache-busting param
										if (updatedItem.image) {
											const timestamp = Date.now();
											const url = new URL(updatedItem.image, window.location.origin);
											url.searchParams.set('v', timestamp);
											updatedItem.image = url.toString();
										}

										collection.items[itemIndex] = updatedItem;
										collection.items = [...collection.items]; // Trigger reactivity
									}
								}}
								on:reorderItem={async (e) => {
									const result = await reorderItems(
										e.detail.prevIndex,
										e.detail.newIndex,
										collection
									);
									if (result) {
										console.log('Reordered items:', result);
										collection.items = result[0].items;
										collection.itemsLength = result[0].items.length;
									}
								}}
								{isReordering}
							/>
						{/each}
					{:else}
						<li class="list-group-item text-muted">No questions yet. Add some below!</li>
					{/if}
				</ul>
			</div>

			<div class="uploader card mb-4">
				<h4 class="mb-3">Add New Question</h4>
				<QuestionTypeForm
					bind:item
					{collection}
					{questionType}
					on:itemAdded={(e) => {
						console.log('Item added event received:', e.detail);
						// Update the collection with new items
						collection.items = e.detail.items;
						collection.itemsLength = e.detail.itemsLength;
						// Trigger reactivity by reassigning the collection
						collection = { ...collection };
					}}
				/>
			</div>
			<div class="button-group mt-3 d-flex gap-2 p-2">
				{#if collection.itemsLength && collection.itemsLength > 1}
					{#if !isReordering}
						<button class="btn btn-outline-secondary" on:click={() => (isReordering = true)}
							>Reorder</button
						>
					{:else}
						<button class="btn btn-outline-secondary" on:click={() => (isReordering = false)}
							>Done</button
						>
					{/if}
					<button
						class="btn btn-outline-secondary"
						on:click={() => {
							try {
								const blob = new Blob([JSON.stringify(collection)], { type: 'application/json' });
								const url = URL.createObjectURL(blob);
								const a = document.createElement('a');
								a.href = url;
								a.download = `${collection.category}.json`;
								document.body.appendChild(a);
								a.click();
								document.body.removeChild(a);
								URL.revokeObjectURL(url);
							} catch (error) {
								console.error('Error downloading collection:', error);
								addToast({
									type: 'error',
									message: 'Failed to download collection. Please try again.'
								});
							}
						}}
					>
						Download JSON
					</button>
				{/if}
				<button
					class="btn btn-danger"
					on:click={() => confirmDelete(collection.id, handleCollectionDeleted)}
					>Delete Collection</button
				>
			</div>
		{/if}
	{/if}
	<div class="container" style="display: none;">
		<form action="" on:submit|preventDefault>
			<input type="file" name="file" id="file" />
			<input type="text" name="answer" id="answer" />
			<button type="submit">Upload</button>
		</form>
	</div>
</div>
