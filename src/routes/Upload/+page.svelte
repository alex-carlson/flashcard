<script>
	export const prerender = true;

	import { user } from '$stores/user';
	import { getImageUrl, getSession } from '$lib/supabaseClient';
	import Collections from '$lib/Collections.svelte';
	import FileUpload from '$lib/Upload/FileUpload.svelte';
	import AudioUploader from '$lib/Upload/AudioUploader.svelte';
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import Fa from 'svelte-fa';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
	import ImageSuggestions from '$lib/ImageSuggestions.svelte';
	import CollectionItem from '$lib/Upload/CollectionItem.svelte';
	let category = '';
	let tempCategory = '';
	let collectionType = 'Image';
	let items = [];
	let errorMessage,
		successMessage = '';
	let isPublic = false;
	let collections = [];
	let editableItemId = null;
	let localItem = { id: 1, file: null, answer: '' };
	let isRenaming = false;
	let isReordering = false;

	onMount(async () => {
		const session = await getSession();
		if (!session) {
			console.log('No session, skipping fetch');
			return;
		}
		fetchCollections();
	});

	async function getAuthHeaders() {
		const session = await getSession();
		if (!session) {
			throw new Error('User session not found');
		}

		return {
			Authorization: `Bearer ${session.access_token}`
		};
	}

	async function apiFetch(endpoint, method = 'GET', body = null, isFormData = false) {
		const headers = await getAuthHeaders();
		if (!isFormData) headers['Content-Type'] = 'application/json';
		const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
			method,
			headers,
			body: isFormData ? body : body ? JSON.stringify(body) : null
		});

		if (!response.ok) {
			throw new Error(`${method} ${endpoint} failed: ${response.statusText}`);
		}

		return response.json();
	}

	// Fetch collections
	async function fetchCollections() {
		// Wait for $user to be available before fetching
		if (!$user || !$user.id) {
			// Retry after a short delay if user is not ready
			setTimeout(fetchCollections, 100);
			return;
		}
		try {
			const url = `/collections/user/${$user.uid}`;
			collections = await apiFetch(url);
			collections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
		} catch (error) {
			console.error('Error fetching collections:', error);
		}
	}

	// Fetch collection details
	async function fetchCollectionData(id) {
		try {
			const data = await apiFetch(`/collections/id/${id}`);
			category = data.category;
			items = Array.isArray(data.items) ? data.items : [];
			isPublic = !data.private;
			isRenaming = false;
		} catch (error) {
			console.error('Error fetching collection:', error);
		}
	}

	// Create new collection
	async function createCollection() {
		console.log($user);
		try {
			const username = $user.username;
			const data = {
				category: tempCategory,
				author_id: $user.uid,
				author_uuid: $user.id,
				author: username
			};
			console.log('Creating collection with data:', data);
			const created = await apiFetch('/collections/createCollection', 'POST', data);
			collections = [...collections, created];
			category = tempCategory;
		} catch (error) {
			console.error('Error creating collection:', error);
			errorMessage = 'Create failed. Please try again.';
		}
	}

	// Rename collection
	async function renameCollection() {
		isRenaming = false;
		try {
			await apiFetch('/collections/renameCollection', 'POST', {
				oldCategory: category,
				newCategory: tempCategory
			});
			category = tempCategory;
		} catch (error) {
			console.error('Error renaming collection:', error);
			errorMessage = 'Rename failed. Please try again.';
		}
	}

	// Remove item
	async function removeItem(itemId) {
		try {
			await apiFetch('/items/remove', 'POST', {
				category,
				itemId
			});
			items = items.filter((item) => item.id !== itemId);
		} catch (error) {
			console.error('Error removing item:', error);
			errorMessage = 'Remove failed. Please try again.';
		}
	}

	async function saveEdit(item) {
		console.log('Saving edit for item:', item);
		try {
			await apiFetch('/items/edit', 'POST', {
				collection: category,
				id: item.id,
				author_id: $user.uid,
				answer: item.answer
			});
			editableItemId = null;
		} catch (error) {
			console.error('Error editing item:', error);
			errorMessage = 'Edit failed. Please try again.';
			// clear error message after 10 seconds
			setTimeout(() => {
				errorMessage = ''; // Clear the error message after 10 seconds
			}, 10000);
		}
	}

	// Reorder items
	async function reorderItems() {
		try {
			const itemAnswers = items.map((item) => item.answer);
			await apiFetch('/items/reorder', 'POST', { category, itemAnswers });
			isReordering = false;
		} catch (error) {
			console.error('Error reordering items:', error);
			errorMessage = 'Reorder failed. Please try again.';
		}
	}

	// Delete collection
	async function deleteCollection() {
		try {
			const username = $user.username;
			const data = {
				collection: category,
				author_id: $user.id,
				username: username
			};
			console.log('Deleting collection:', data);
			await apiFetch(`/collections/${username}/${category}`, 'DELETE', data);
			collections = collections.filter((c) => c.category !== category);
			document.location.reload();
		} catch (error) {
			console.error('Error deleting collection:', error);
			errorMessage = 'Delete failed. Please try again.';
		}
	}

	// show confirm delete popup
	function confirmDelete() {
		if (confirm('Are you sure you want to delete this collection?')) {
			deleteCollection();
		}
	}

	// Upload data
	async function uploadData(uuid = uuidv4(), forceJpg = false) {
		// If file is a URL (string), call /upload-url
		if (typeof localItem.file === 'string') {
			console.log('Detected URL upload:', localItem.file);
			try {
				const data = {
					uuid,
					url: localItem.file,
					folder: `${$user.username}/${category}`,
					forceJpeg: forceJpg,
					author_uuid: $user.id,
					author_id: $user.uid,
					author: $user.username,
					category,
					answer: localItem.answer
				};
				console.log('Uploading URL data:', data);
				const result = await apiFetch('/items/upload-url', 'POST', data);
				showSuccessMessage('Upload successful!');
				const preview = document.querySelector('.preview');
				if (preview) preview.src = null;

				localItem.answer = '';
				document.getElementById('answer').value = '';
				items = result[0]?.items || [];
				localItem.file = null;
				if (preview) preview.scrollIntoView({ behavior: 'smooth' });
			} catch (error) {
				console.error('Error uploading URL data:', error);
				showErrorMessage('Upload failed. Please try again.');
			}
			return;
		}

		// Otherwise, upload as file
		const formData = new FormData();
		formData.append('uuid', uuid);
		formData.append('file', localItem.file);
		formData.append('folder', `${$user.username}/${category}`);
		formData.append('forceJpeg', forceJpg);
		formData.append('answer', localItem.answer);
		formData.append('category', category);
		formData.append('author', $user.username);
		formData.append('author_uuid', $user.id);
		formData.append('author_id', $user.uid);

		// Log all FormData entries
		for (let [key, value] of formData.entries()) {
			console.log(`formData[${key}] =`, value);
		}

		try {
			const result = await apiFetch('/items/upload', 'POST', formData, true);
			showSuccessMessage('Upload successful!');
			const preview = document.querySelector('.preview');
			if (preview) preview.src = null;

			localItem.answer = '';
			document.getElementById('answer').value = '';
			items = result[0]?.items || [];
			localItem.file = null;
			if (preview) preview.scrollIntoView({ behavior: 'smooth' });
		} catch (error) {
			console.error('Error uploading data:', error);
			showErrorMessage('Upload failed. Please try again.');
		}
	}

	async function uploadAudio(answer, url) {
		const username = $user.username;
		const author_id = $user.id;

		const formData = new FormData();
		formData.append('uuid', uuidv4());
		formData.append('url', url);
		formData.append('folder', `${username}/${category}`);
		formData.append('answer', answer);
		formData.append('category', category);
		formData.append('author', username);
		formData.append('author_id', author_id);
		formData.append('type', 'audio');
		console.log('Uploading audio data:', {
			uuid: formData.get('uuid'),
			url: formData.get('url'),
			folder: formData.get('folder'),
			answer: formData.get('answer'),
			category: formData.get('category')
		});

		try {
			const result = await apiFetch('/items/add-audio', 'POST', formData, true);
			showSuccessMessage('Audio upload successful!');
			items = result[0]?.items || [];
		} catch (error) {
			console.error('Error uploading audio data:', error);
			showErrorMessage('Audio upload failed. Please try again.');
		}
	}

	async function uploadQuestion() {
		const username = $user.username;
		const author_id = $user.id;

		const data = {
			uuid: uuidv4(),
			question: localItem.question,
			folder: `${username}/${category}`,
			answer: localItem.answer,
			category,
			author: username,
			author_id
		};
		console.log('Uploading question data:', data);

		try {
			const result = await apiFetch('/items/add-question', 'POST', data);
			showSuccessMessage('Question upload successful!');
			items = result[0]?.items || [];
			localItem.question = '';
			localItem.answer = '';
		} catch (error) {
			console.error('Error uploading question data:', error);
			showErrorMessage('Question upload failed. Please try again.');
		}
	}

	// Set visibility
	async function setVisible(event) {
		const data = {
			category,
			author: $user.username,
			author_id: $user.uid,
			visible: event.target.checked
		};

		try {
			await apiFetch('/collections/setVisible', 'POST', data);
		} catch (error) {
			console.error('Error setting visibility:', error);
			errorMessage = 'Visibility change failed. Please try again.';
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

	function ReOrder(prevIndex, newIndex) {
		console.log('Reordering items');
		const item = items[prevIndex];
		items.splice(prevIndex, 1);
		items.splice(newIndex, 0, item);
		// update items to rerender
		items = [...items];
	}

	function toggleRenaming() {
		isRenaming = !isRenaming;
		if (isRenaming) {
			tempCategory = category;
		}
	}
</script>

<svelte:head>
	<title>Manage Collections</title>
</svelte:head>

<div class="container form padding uploader">
	{#if !user}
		<p><a href="/login">Log in</a> to manager your collections.</p>
	{:else}
		{#if category === ''}
			{#if collections.length > 0}
				<Collections {collections} on:selectCollection={(e) => fetchCollectionData(e.detail)} />
			{/if}
			<input type="text" bind:value={tempCategory} placeholder="Category Name" />
			<button on:click={createCollection}>Create</button>
		{:else if isRenaming}
			<input
				type="text"
				id="categoryName"
				bind:value={tempCategory}
				placeholder="Enter a category"
			/>
			<button class="secondary" on:click={renameCollection}>Save</button>
			<button class="warning" on:click={toggleRenaming}>Cancel</button>
		{:else}
			<div class="collection-name">
				{#await getImageUrl(`${$user.username}/${category}/thumbnail.jpg`) then url}
					<img src={url} alt="Thumbnail" class="thumbnail" />
				{/await}
				<h2>{category}</h2>
				<button class="secondary" on:click={toggleRenaming}>
					<Fa icon={faPenToSquare} />
				</button>
			</div>
			<div class="row">
				<h2>{isPublic ? 'Public' : 'Private'}</h2>
				<label class="switch">
					<input type="checkbox" bind:checked={isPublic} on:change={setVisible} />
				</label>
			</div>
			<div class="padding">
				<h2>Thumbnail</h2>
				<FileUpload
					on:uploadImage={(event) => {
						console.log('Thumbnail upload event:', event.detail);
						localItem.file = event.detail;
						uploadData('thumbnail', true);
					}}
				/>
			</div>
		{/if}
		<div class="list uploads">
			<ul class="items-list">
				{#each items as item, index}
					<CollectionItem
						{item}
						{index}
						bind:editableItemId
						on:removeItem={removeItem(item.id)}
						on:saveEdit={(e) => {
							console.log('Save edit event:', e.detail);
							saveEdit(e.detail);
						}}
						on:reorderItem={(e) => ReOrder(e.detail.prevIndex, e.detail.newIndex)}
						{isReordering}
						{isRenaming}
					/>
				{/each}
			</ul>
		</div>

		{#if category}
			<h2>Add item</h2>

			<select bind:value={collectionType}>
				<option value="Image">Image</option>
				<option value="Audio">Audio</option>
				<option value="Question">Question</option>
			</select>
			{#if collectionType === 'Image'}
				<!-- on submit form, call UploadFile -->
				<form class="form">
					<FileUpload on:uploadImage={(event) => (localItem.file = event.detail)} />
					{#if localItem.file}
						<img class="preview" src={localItem.file} alt="Preview" style="display: block;" />
					{/if}
					<input
						id="answer"
						type="text"
						bind:value={localItem.answer}
						placeholder="Enter an answer"
						class="answer"
					/>
					<ImageSuggestions
						bind:category
						on:addImage={async (e) => {
							localItem.file = e.detail;
							uploadData();
							localItem.file = null;
							localItem.answer = '';
						}}
						bind:searchTerm={localItem.answer}
					/>
					<button type="button" on:click={() => uploadData(undefined, false)}>Add item</button>
				</form>
			{:else if collectionType === 'Audio'}
				<AudioUploader
					on:addSong={(e) => {
						console.log('AudioUploader addSong event:', e);
						uploadAudio(e.detail.title, e.detail.id);
					}}
				/>
			{:else if collectionType === 'Question'}
				<h2>Question</h2>
				<form class="form">
					<input type="text" bind:value={localItem.question} placeholder="Enter a question" />
					<input type="text" bind:value={localItem.answer} placeholder="Enter the answer" />
					<button
						type="button"
						class=""
						on:click={() => {
							if (localItem.answer.trim() === '') {
								showErrorMessage('Please enter a question.');
								return;
							}
							uploadQuestion();
							localItem.question = '';
							localItem.answer = '';
						}}
					>
						Add Question
					</button>
				</form>
			{/if}

			{#if errorMessage}
				<p style="color: red">{errorMessage}</p>
			{/if}
			{#if successMessage}
				<p style="color: green">{successMessage}</p>
			{/if}

			<div class="button-group">
				{#if items.length > 1}
					{#if !isReordering}
						<button class="secondary" on:click={() => (isReordering = true)}>Reorder</button>
					{:else}
						<button class="secondary" on:click={reorderItems}>Done</button>
					{/if}
				{/if}
				<button class="danger" on:click={confirmDelete}>Delete Collection</button>
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
