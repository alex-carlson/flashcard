<script>
	import { createEventDispatcher } from 'svelte';
	import FileUpload from '$lib/Upload/FileUpload.svelte';
	import Cropper from '$lib/Upload/Cropper.svelte';
	import { uploadThumbnail } from '$lib/Upload/uploader';
	import { addToast } from '../../stores/toast';
	import { apiFetch } from '$lib/api/fetchdata';

	export let collection;
	export let tempCategory = '';
	export let tempDescription = '';
	export let tempTags = '';
	export let suggestedTags = [];
	export let isPublic = false;
	export let isShuffle = false;
	export let showCropper = false;

	const dispatch = createEventDispatcher();

	let thumbnailUploader;

	function toggleCropper() {
		showCropper = !showCropper;
		dispatch('toggleCropper');
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
				file: file,
				category: collection?.category
			};

			console.log('Temporary item for upload:', tempItem);

			// Upload the new image
			const result = await uploadThumbnail(file, collection.category);

			if (result) {
				addToast({
					type: 'success',
					message: 'Thumbnail updated successfully!'
				});
				dispatch('thumbnailUpdated', result);
			} else {
				console.warn('Upload result structure unexpected:', result);
				addToast({
					type: 'warning',
					message: 'Thumbnail uploaded but response format unexpected. Please refresh.'
				});
			}
		} catch (error) {
			console.error('Error updating thumbnail:', error);
			addToast({
				type: 'error',
				message: 'Failed to update thumbnail. Please try again.'
			});
		}
	}

	async function onCropped(event) {
		console.log('Cropped event received:', event);
		const croppedFile = event.detail;

		//get extension from type
		const fileExtension = croppedFile.type.split('/')[1] || 'png';

		await uploadChangedImage(croppedFile, 'cropped-image.' + fileExtension);
		showCropper = false;
		dispatch('cropperToggled', false);
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
				dispatch('collectionUpdated', result);
			}
		} catch (error) {
			console.error('Error updating collection:', error);
			addToast({
				type: 'error',
				message: 'Failed to update collection. Please try again.'
			});
		}
	}

	function addSuggestedTag(tag) {
		const tagsArr = tempTags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		if (!tagsArr.includes(tag)) {
			tempTags = tagsArr.concat(tag).join(', ');
			dispatch('tagsChanged', tempTags);
		}
	}

	// Dispatch changes to parent
	$: dispatch('categoryChanged', tempCategory);
	$: dispatch('descriptionChanged', tempDescription);
	$: dispatch('tagsChanged', tempTags);
	$: dispatch('privacyChanged', isPublic);
	$: dispatch('shuffleChanged', isShuffle);
</script>

<div class="collection-section mb-5">
	<div class="collection card p-4">
		<div class="collection-info">
			<div class="row g-4 align-items-start mb-4">
				<div class="col-12 col-lg-4">
					<div class="thumbnail-section">
						<h5 class="mb-3">Collection Thumbnail</h5>
						{#if collection.thumbnail_url}
							<div class="preview mb-3">
								<div class="thumbnail-preview mb-3">
									<img
										src={collection.thumbnail_url}
										alt="Collection Thumbnail"
										class="img-fluid rounded"
										style="width: 100%; max-width: 200px; height: 150px; object-fit: cover;"
									/>
								</div>
								<button class="btn btn-outline-secondary btn-sm" on:click={toggleCropper}>
									Edit Thumbnail
								</button>
								{#if showCropper}
									<div class="mt-3">
										<Cropper
											src={collection.thumbnail_url}
											on:cropped={onCropped}
											on:cancel={toggleCropper}
										/>
									</div>
								{/if}
							</div>
						{:else}
							<div class="upload-prompt text-center p-4 border rounded bg-light mb-3">
								<p class="text-muted mb-2">No thumbnail uploaded</p>
							</div>
						{/if}
						<div class="thumbnail-uploader">
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
											dispatch('thumbnailUpdated', result);
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
				</div>
				<div class="col-12 col-lg-8">
					<div class="collection-details">
						<h5 class="mb-3">Collection Details</h5>
						<div class="mb-3">
							<label class="form-label" for="category">Category Name</label>
							<input
								id="category"
								type="text"
								class="form-control"
								bind:value={tempCategory}
								placeholder={collection.category}
							/>
						</div>
						<div class="mb-3">
							<label class="form-label" for="description">Description</label>
							<textarea
								id="description"
								class="form-control"
								rows="3"
								bind:value={tempDescription}
								placeholder="Category Description (Optional)"
							></textarea>
						</div>
						<div class="mb-3">
							<label class="form-label" for="tags">Tags</label>
							<input
								id="tags"
								type="text"
								class="form-control"
								placeholder="Add tags (comma-separated)"
								bind:value={tempTags}
							/>
						</div>
						{#if suggestedTags.length > 0}
							<div class="suggested-tags mt-2 p-3 bg-light rounded">
								<div class="small text-muted mb-2">Suggestions:</div>
								<div class="d-flex flex-wrap gap-1">
									{#each suggestedTags as tag}
										<button
											type="button"
											class="btn btn-sm btn-outline-secondary"
											on:click={() => addSuggestedTag(tag)}
										>
											{tag}
										</button>
									{/each}
								</div>
							</div>
						{/if}
						<div class="settings-section mt-4">
							<h6 class="mb-3">Settings</h6>
							<div class="settings-grid">
								<div class="setting-item">
									<div class="form-check form-switch">
										<input
											id="privacy-toggle"
											type="checkbox"
											class="form-check-input"
											bind:checked={isPublic}
											aria-label="Privacy"
										/>
										<label for="privacy-toggle" class="form-check-label">
											{isPublic ? 'Public' : 'Private'}
										</label>
									</div>
								</div>
								<div class="setting-item">
									<div class="form-check form-switch">
										<input
											id="shuffle-toggle"
											type="checkbox"
											class="form-check-input"
											bind:checked={isShuffle}
											aria-label="Shuffle Questions"
										/>
										<label for="shuffle-toggle" class="form-check-label"> Shuffle Questions </label>
									</div>
								</div>
							</div>
							<div class="mt-4">
								<button type="button" class="btn btn-primary" on:click={updateCollection}>
									Save Changes
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.thumbnail-section {
		background: #f8f9fa;
		border-radius: 0.5rem;
		padding: 1.5rem;
		border: 2px dashed #dee2e6;
		transition: all 0.3s ease;
	}

	.thumbnail-section:hover {
		border-color: #007bff;
		background: #f0f8ff;
	}

	.thumbnail-preview {
		background: white;
		border-radius: 0.375rem;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.upload-prompt {
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.collection-details {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.settings-section {
		border-top: 1px solid #dee2e6;
		padding-top: 1.5rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.setting-item {
		display: flex;
		align-items: center;
		min-height: 2.5rem;
	}

	.form-check.form-switch {
		display: flex;
		align-items: center;
		min-height: 1.5rem;
		padding-left: 0;
		margin-bottom: 0;
		position: relative;
		width: 100%;
	}

	.form-check.form-switch .form-check-input {
		position: relative;
		margin-left: 0;
		margin-right: 0.5rem;
		flex-shrink: 0;
		width: 2rem;
		height: 1rem;
		border-radius: 0.5rem;
		transition:
			background-color 0.15s ease-in-out,
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
	}

	.form-check.form-switch .form-check-input:checked {
		border-color: #0d6efd;
		background-color: #0d6efd;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e");
	}

	.form-check.form-switch .form-check-input:focus {
		border-color: #86b7fe;
		box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
	}

	.form-check.form-switch .form-check-label {
		margin-left: 0;
		font-weight: 500;
		color: #495057;
		cursor: pointer;
		flex-grow: 1;
	}

	.suggested-tags {
		border: 1px solid #e9ecef;
	}

	.form-label {
		font-weight: 600;
		color: #495057;
		margin-bottom: 0.5rem;
	}

	.card {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		border: 1px solid #e9ecef;
	}

	.btn {
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.collection-details,
		.thumbnail-section {
			padding: 1rem;
		}
	}
</style>
