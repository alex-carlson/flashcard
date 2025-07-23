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
		reorderItems,
		shuffleItems
	} from '$lib/Upload/uploader';
	import { apiFetch } from '$lib/api/fetchdata';
	import { addToast } from '../../stores/toast';
	let collection = null;
	let questionType = 'Image';
	let isPublic = false;
	let editableItemId = null;
	let isReordering = false;
	let collections = [];
	let showImageSuggestions = false;

	let item = {};
	let tempCategory = '';
	let tempDescription = '';
	let tempTags = '';
	let answerInput; // Reference to the answer input field
	let questionInput; // Reference to the question input field
	let thumbnailUploader; // Reference to the thumbnail FileUpload component
	let itemUploader; // Reference to the item FileUpload component
	let suggestedTags = [];

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
			private: !isPublic || collection.private,
			tags: tempTags || '',
			category: tempCategory || collection.category || '',
			description: tempDescription || collection.description || ''
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

	async function fetchRecommendedTags(query) {
		try {
			// turn query into a comma separated list
			query = query
				.split(' ')
				.map((word) => word.trim())
				.filter(Boolean)
				.join(',');
			console.log('Fetching recommended tags for query:', query);
			const response = await apiFetch('/collections/tags/recommended?' + query, 'GET');
			if (response && Array.isArray(response.tags)) {
				return response.tags;
			}
			return [];
		} catch (error) {
			console.error('Error fetching recommended tags:', error);
			return [];
		}
	}

	$: if (tempCategory || tempDescription) {
		const query = [tempCategory, tempDescription].filter(Boolean).join(' ');
		if (query.length > 3) {
			fetchRecommendedTags(query).then((tags) => {
				suggestedTags = tags;
			});
		} else {
			suggestedTags = [];
		}
	}
</script>

<svelte:head>
	<title>Manage Collections</title>
</svelte:head>

<div class="container form white padding uploader">
	{#if !user}
		<p><a href="/login">Log in</a> to manage your collections.</p>
	{:else}
		<div class="select-quiz mt-4">
			<h2>Select a Quiz</h2>
			<Collections
				{collections}
				condensed
				grid
				list
				limit={-1}
				onSelectCollection={(e) => {
					console.log('Selected collection:', e);
					setCollection(e.id);
				}}
			/>
		</div>
		{#if collection === null}
			<div class="create mt-4">
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
							console.log('New collection created:', result);
							collection = result[0];
						}
					}}
				>
					Create
				</button>
			</div>
		{:else}
			<div class="collection card mb-4 p-3">
				<div class="collection-info row g-3 align-items-center">
					<div
						class="thumbnail-uploader col-12 col-md-auto d-flex flex-column align-items-center justify-content-center"
						style="width: 180px; height: 180px;"
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
							on:change={setVisible}
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

			<div class="uploader card p-3 mb-4">
				<h4 class="mb-3">Add New Question</h4>

				<ul class="nav nav-tabs mb-3">
					<li class="nav-item">
						<a
							class="nav-link {questionType === 'Image' ? 'active' : ''}"
							href="#"
							on:click|preventDefault={() => (questionType = 'Image')}>Image</a
						>
					</li>
					<li class="nav-item">
						<a
							class="nav-link {questionType === 'Audio' ? 'active' : ''}"
							href="#"
							on:click|preventDefault={() => (questionType = 'Audio')}>Audio</a
						>
					</li>
					<li class="nav-item">
						<a
							class="nav-link {questionType === 'Question' ? 'active' : ''}"
							href="#"
							on:click|preventDefault={() => (questionType = 'Question')}>Question</a
						>
					</li>
				</ul>
				{#if questionType === 'Image'}
					<form class="form row g-2 align-items-center container" on:submit|preventDefault>
						<div
							class="col-12 col-md-auto"
							style="width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;"
						>
							<FileUpload
								bind:this={itemUploader}
								on:uploadImage={(event) => (item.file = event.detail)}
							/>
						</div>
						<div class="col-12 col-md">
							<input
								id="answer"
								type="text"
								class="form-control mb-2"
								bind:value={item.answer}
								bind:this={answerInput}
								placeholder="Enter an answer"
							/>

							<button
								type="button"
								class="btn btn-success mt-2"
								on:click={async () => {
									const newItems = await uploadData(item, undefined, false);
									if (newItems) {
										console.log('New item added:', newItems);
										collection.items = newItems[0].items;
										collection.itemsLength = newItems[0].items.length;
										addToast({
											type: 'success',
											message: 'Item added successfully!'
										});
										item.file = null;
										item.answer = '';
										// Clear the FileUpload component
										if (itemUploader && typeof itemUploader.clearImage === 'function') {
											itemUploader.clearImage();
										}
										// Keep suggestions visible if they were already shown
										// Focus and scroll to answer input for next item
										setTimeout(focusAnswerInput, 100);
									}
								}}>Add item</button
							>

							<button
								type="button"
								class="btn btn-secondary mt-2"
								on:click={() => (showImageSuggestions = !showImageSuggestions)}
							>
								{showImageSuggestions ? 'Hide' : 'Show'} Suggestions
							</button>
						</div>
						{#if showImageSuggestions}
							<ImageSuggestions
								category={collection.category}
								searchTerm={item.answer}
								on:addImage={async (e) => {
									// Store current scroll position
									const currentScrollY = window.scrollY;

									item.file = e.detail;
									const newItem = await uploadData(item, undefined, false);
									if (newItem) {
										// Update collection data
										collection.items = newItem[0].items;
										collection.itemsLength = newItem[0].items.length;

										addToast({
											type: 'success',
											message: 'Image added successfully!'
										});

										// Clear form data
										item.file = null;
										item.answer = '';
									}
								}}
							/>
						{/if}
					</form>
				{:else if questionType === 'Audio'}
					<AudioUploader
						on:addSong={async (e) => {
							console.log('AudioUploader addSong event:', e);
							const audioData = {
								...e.detail,
								url: e.detail.videoId,
								audio: e.detail.videoId,
								category: collection.category,
								answer: e.detail.title
							};
							console.log('Audio data to upload:', audioData);
							const newItems = await uploadAudio(audioData);
							if (newItems) {
								collection.items = newItems[0].items;
								collection.itemsLength = newItems[0].items.length;
								addToast({
									type: 'success',
									message: 'Audio added successfully!'
								});
							}
						}}
					/>
				{:else if questionType === 'Question'}
					<form class="form row g-2 align-items-center" on:submit|preventDefault>
						<div class="col-12">
							<input
								type="text"
								class="form-control mb-2"
								bind:value={item.question}
								bind:this={questionInput}
								placeholder="Enter a question"
							/>
							<input
								type="text"
								class="form-control mb-2"
								bind:value={item.answer}
								placeholder="Enter the answer"
							/>
							<button
								type="button"
								class="btn btn-success mt-2"
								on:click={async () => {
									if ((item.question ?? '').trim() === '') {
										addToast({
											type: 'error',
											message: 'Please enter a question.'
										});
										return;
									}
									const newItems = await uploadQuestion(item);
									if (newItems) {
										collection.items = newItems[0].items;
										collection.itemsLength = newItems[0].items.length;
										addToast({
											type: 'success',
											message: 'Question added successfully!'
										});
										item.question = '';
										item.answer = '';
										// Focus and scroll to question input for next item
										setTimeout(focusQuestionInput, 100);
									}
								}}>Add Question</button
							>
						</div>
					</form>
				{/if}
			</div>
			<div class="button-group mt-3 d-flex gap-2">
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
						on:click={async () => {
							const shuffled = await shuffleItems({
								items: collection.items,
								category: collection.category
							});
							if (shuffled && shuffled.length > 0) {
								collection.items = shuffled[0].items;
								collection.itemsLength = shuffled[0].items.length;
							}
						}}>Shuffle</button
					>
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
