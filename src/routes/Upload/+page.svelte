<script>
	import { onMount } from 'svelte';
	import { user } from '$stores/user';
	import Collections from '$lib/Collections.svelte';
	import FileUpload from '$lib/Upload/FileUpload.svelte';
	import AudioUploader from '$lib/Upload/AudioUploader.svelte';
	import ImageSuggestions from '$lib/ImageSuggestions.svelte';
	import CollectionItem from '$lib/Upload/CollectionItem.svelte';
	import { fetchUserCollections } from '$lib/api/collections';
	import {
		uploadThumbnail,
		uploadQuestion,
		uploadAudio,
		uploadData,
		removeItem
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

	function setCollection(collectionId) {
		const selectedCollection = collections.find((c) => c.id === collectionId);
		console.log('Selected collection:', selectedCollection);
		collection = selectedCollection || '';
		item.category = collection?.category || '';
		isPublic = !collection?.private || false;
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
</script>

<svelte:head>
	<title>Manage Collections</title>
</svelte:head>

<div class="container form padding uploader">
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
				<button class="btn btn-primary" on:click={createCollection}>Create</button>
			</div>
		{:else}
			<div class="collection card mb-4 p-3">
				<!-- <button class="btn btn-secondary save mb-3" on:click={save}>Save Changes</button> -->
				<div class="collection-info row g-3 align-items-center">
					<div
						class="thumbnail-uploader col-auto d-flex flex-column align-items-center justify-content-center"
						style="width: 180px; height: 180px;"
					>
						<FileUpload
							on:uploadImage={(event) => {
								console.log('Thumbnail upload event:', event.detail);
								uploadThumbnail(event.detail, collection.category);
							}}
						/>
					</div>
					<div class="col">
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
							/>
							<span>{isPublic ? 'Public' : 'Private'}</span>
							<span class="small-text">({collection.items.length} questions)</span>
						</form>
					</div>
				</div>
			</div>
		{/if}
		{#if collection}
			<div class="list uploads py-2">
				<h4>Questions</h4>
				<ul class="items-list list-group mb-4">
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
									}
								}}
								on:saveEdit={(e) => {
									console.log('Save edit event:', e.detail);
									saveEdit(e.detail);
								}}
								on:reorderItem={(e) => ReOrder(e.detail.prevIndex, e.detail.newIndex)}
								{isReordering}
							/>
						{/each}
					{/key}
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
							class="col-auto"
							style="width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;"
						>
							<FileUpload on:uploadImage={(event) => (item.file = event.detail)} />
						</div>
						<div class="col">
							{#if item.file}
								<img
									class="preview img-thumbnail mb-2"
									src={item.file}
									alt="Preview"
									style="display: block; max-width: 100px;"
								/>
							{/if}
							<input
								id="answer"
								type="text"
								class="form-control mb-2"
								bind:value={item.answer}
								placeholder="Enter an answer"
							/>
							<ImageSuggestions
								bind:category={collection}
								on:addImage={async (e) => {
									item.file = e.detail;
									uploadData();
									item.file = null;
									item.answer = '';
								}}
								bind:searchTerm={item.answer}
							/>
							<button
								type="button"
								class="btn btn-success mt-2"
								on:click={() => uploadData(undefined, false)}>Add item</button
							>
						</div>
					</form>
				{:else if questionType === 'Audio'}
					<AudioUploader
						on:addSong={(e) => {
							console.log('AudioUploader addSong event:', e);
							uploadAudio(e.detail.title, e.detail.id);
						}}
					/>
				{:else if questionType === 'Question'}
					<h2>Question</h2>
					<form class="form row g-2 align-items-center">
						<div class="col">
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

			{#if errorMessage}
				<p class="alert alert-danger mt-2">{errorMessage}</p>
			{/if}
			{#if successMessage}
				<p class="alert alert-success mt-2">{successMessage}</p>
			{/if}

			<div class="button-group mt-3 d-flex gap-2">
				{#if collection.items.length > 1}
					{#if !isReordering}
						<button class="btn btn-outline-secondary" on:click={() => (isReordering = true)}
							>Reorder</button
						>
					{:else}
						<button class="btn btn-outline-secondary" on:click={reorderItems}>Done</button>
					{/if}
				{/if}
				<button class="btn btn-danger" on:click={confirmDelete}>Delete Collection</button>
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
