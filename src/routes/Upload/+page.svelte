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

	let collection = null;
	let questionType = 'Image';
	let isPublic = false;
	let editableItemId = null;
	let isReordering = false;
	let collections = [];
	let errorMessage,
		successMessage = '';

	// things to move to uploader.ts
	let item = {};
	let tempCategory = '';
	let tempDescription = '';

	$: if ($user?.public_id) {
		loadCollections();
	}

	async function loadCollections() {
		try {
			const result = await fetchUserCollections($user.public_id);
			console.log('Fetched collections:', result);
			collections = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
		} catch (error) {
			console.error('Error fetching user collections:', error);
		}
	}

	function showSuccessMessage(message) {
		successMessage = message;
		setTimeout(() => {
			successMessage = ''; // Clear the success message after 10 seconds
		}, 10000);
	}

	function showErrorMessage(message) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = ''; // Clear the error message after 10 seconds
		}, 10000);
	}
	async function setCollection(collectionId) {
		try {
			const newCollection = await fetchCollectionById($user.public_id, collectionId);
			console.log('Fetched collection details:', newCollection);

			if (newCollection) {
				// Set the collection with all its data
				collection = newCollection;

				// Set form values
				item.category = collection.category || '';
				tempCategory = collection.category || '';
				tempDescription = collection.description || '';
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
				showErrorMessage('Failed to load collection data');
			}
		} catch (error) {
			console.error('Error fetching collection:', error);
			showErrorMessage('Failed to load collection. Please try again.');
		}
	}

	function handleCollectionDeleted(newCollection) {
		collection = null;
		showSuccessMessage('Collection deleted successfully!');
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
			errorMessage = 'Visibility change failed. Please try again.';
		}
	}

	async function updateCollection() {
		const data = {
			private: !isPublic || collection.private,
			tags: collection.tags || [],
			category: tempCategory || collection.category || '',
			description: tempDescription || collection.description || ''
		};

		try {
			const result = await apiFetch(`/collections/update/${collection.id}`, 'POST', data, false);
			if (result) {
				showSuccessMessage('Collection updated successfully!');
				loadCollections();
			}
		} catch (error) {
			console.error('Error updating collection:', error);
			showErrorMessage('Failed to update collection. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Manage Collections</title>
</svelte:head>

<div class="container form white padding uploader">
	{#if errorMessage}
		<p class="alert alert-danger mt-2">{errorMessage}</p>
	{/if}
	{#if successMessage}
		<p class="alert alert-success mt-2">{successMessage}</p>
	{/if}
	{#if !user}
		<p><a href="/login">Log in</a> to manage your collections.</p>
	{:else}
		<div class="select-quiz mt-4">
			<h2>Select a Quiz</h2>
			<Collections {collections} on:selectCollection={(e) => setCollection(e.detail)} />
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
							on:uploadImage={(event) => {
								console.log('Thumbnail upload event:', event.detail);
								uploadThumbnail(event.detail, collection.category);
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
						<!-- add tags field -->
						<input
							type="text"
							class="form-control mb-2"
							placeholder="Add tags (comma-separated)"
							on:change={(e) => {
								collection.tags = e.target.value.split(',').map((tag) => tag.trim());
							}}
						/>
						<form
							class="privacy-form form-check form-switch d-flex align-items-center gap-3 mb-2"
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
						{#key collection.items}
							{#each collection.items as item, index}
								<CollectionItem
									{item}
									{index}
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
											id: e.detail.id,
											answer: e.detail.answer,
											author_id: $user.public_id
										};
										const result = await saveEdit(d);
										if (result) {
											collections = result;
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
						{/key}
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
					<form class="form row g-2 align-items-center">
						<div
							class="col-12 col-md-auto"
							style="width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;"
						>
							<FileUpload on:uploadImage={(event) => (item.file = event.detail)} />
						</div>
						<div class="col-12 col-md">
							<input
								id="answer"
								type="text"
								class="form-control mb-2"
								bind:value={item.answer}
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
										showSuccessMessage('Item added successfully!');
										item.file = null;
										item.answer = '';
									}
								}}>Add item</button
							>
						</div>
						<ImageSuggestions
							bind:category={collection.category}
							bind:searchTerm={item.answer}
							on:addImage={async (e) => {
								item.file = e.detail;
								const newItem = await uploadData(item, undefined, false);
								if (newItem) {
									collection.items = newItem[0].items;
									collection.itemsLength = newItem[0].items.length;
									showSuccessMessage('Image added successfully!');
									item.file = null;
									item.answer = '';
								}
							}}
						/>
					</form>
				{:else if questionType === 'Audio'}
					<AudioUploader
						on:addSong={async (e) => {
							console.log('AudioUploader addSong event:', e);
							const audioData = {
								url: e.detail.id,
								category: collection.category,
								answer: e.detail.title
							};
							const newItems = await uploadAudio(audioData);
							if (newItems) {
								collection.items = newItems[0].items;
								collection.itemsLength = newItems[0].items.length;
								showSuccessMessage('Audio added successfully!');
							}
						}}
					/>
				{:else if questionType === 'Question'}
					<form class="form row g-2 align-items-center">
						<div class="col-12">
							<input
								type="text"
								class="form-control mb-2"
								bind:value={item.question}
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
										showErrorMessage('Please enter a question.');
										return;
									}
									const newItems = await uploadQuestion(item);
									if (newItems) {
										console.log('New item added:', newItems);
										collection.items = newItems[0].items;
										collection.itemsLength = newItems[0].items.length;
										showSuccessMessage('Question added successfully!');
									}
									item.question = '';
									item.answer = '';
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
		<form action="">
			<input type="file" name="file" id="file" />
			<input type="text" name="answer" id="answer" />
			<button type="submit">Upload</button>
		</form>
	</div>
</div>
