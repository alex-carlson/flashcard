<script>
	import { createEventDispatcher } from 'svelte';
	import FileUpload from '../Upload/FileUpload.svelte';
	import AudioUploader from '../Upload/AudioUploader.svelte';
	import ImageSuggestions from '../ImageSuggestions.svelte';
	import AnswerInput from './AnswerInput.svelte';
	import { addToast } from '../../stores/toast';
	import { uploadData, uploadQuestion, uploadAudio } from '../Upload/uploader';

	const dispatch = createEventDispatcher();

	// collection is passed for reference only, component doesn't mutate it directly
	export const collection = {};
	export let item;
	export let questionType = 'Image';

	let imageSuggestions = [];
	let searchTerm = '';
	let showSuggestions = false;

	// Reactive statement to update searchTerm when answer input changes
	$: {
		if (questionType === 'Image') {
			const currentAnswer = Array.isArray(item.answers)
				? item.answers.join(' ').trim()
				: (item.answer || '').trim();
			if (currentAnswer !== searchTerm) {
				searchTerm = currentAnswer;
			}
		}
	}

	// Focus function for question input
	function focusQuestionInput() {
		const questionInput = document.getElementById('question-input-question');
		if (questionInput) {
			questionInput.focus();
			questionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// Shared upload success handler
	function handleUploadSuccess(items, type) {
		// Dispatch event to parent
		dispatch('itemAdded', {
			items: items[0].items,
			itemsLength: items[0].items.length,
			type
		});

		// Show success message
		addToast({
			type: 'success',
			message: `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`
		});

		// Clean up form
		cleanupForm();
	}

	// Shared form cleanup function
	function cleanupForm() {
		// Store current configuration to preserve after cleanup
		const currentConfig = {
			category: item.category, // Preserve category
			isMultipleChoice: item.isMultipleChoice,
			type: item.type,
			numRequired: item.numRequired
		};

		// Clear content but preserve structure
		item.question = '';
		item.answer = '';

		// Clean up blob URLs to prevent memory leaks
		if (item.src && item.src.startsWith('blob:')) {
			URL.revokeObjectURL(item.src);
		}
		item.src = '';
		item.file = null;
		item.videoId = '';
		item.title = '';
		item.thumbnail = '';
		item.supplemental_text = '';
		item.extra = '';
		imageSuggestions = [];
		searchTerm = '';

		// Reset answers array but preserve length for the mode
		if (item.answers && Array.isArray(item.answers)) {
			// Keep the same number of answer slots but clear content
			item.answers = item.answers.map(() => '');
		} else {
			item.answers = [];
		}

		// Restore configuration
		item.category = currentConfig.category; // Preserve category
		if (currentConfig.isMultipleChoice) {
			item.isMultipleChoice = currentConfig.isMultipleChoice;
			item.type = currentConfig.type;
			// Reset to first option as correct answer
			item.correctAnswerIndex = 0;
		} else if (currentConfig.type === 'multianswer') {
			item.type = currentConfig.type;
			item.numRequired = currentConfig.numRequired;
		}

		// Clear all inputs
		const inputs = document.querySelectorAll('input, textarea');
		inputs.forEach((input) => {
			input.value = '';
		});

		// Focus question input for next item
		setTimeout(focusQuestionInput, 100);
	}
	function validateAnswers() {
		if (item.isMultipleChoice) {
			// For multiple choice, ensure we have options and a correct answer is selected
			if (!item.answers || item.answers.length < 2) {
				addToast({
					type: 'error',
					message: 'Please add at least 2 options for multiple choice questions.'
				});
				return false;
			}
			if (item.answers.some((answer) => !answer.trim())) {
				addToast({
					type: 'error',
					message: 'Please fill in all answer options.'
				});
				return false;
			}
			if (item.correctAnswerIndex === undefined || item.correctAnswerIndex === null) {
				addToast({
					type: 'error',
					message: 'Please select which option is the correct answer.'
				});
				return false;
			}
		} else if (item.type === 'multianswer') {
			// For multi-answer, ensure we have answers and required count is valid
			if (!item.answers || item.answers.length < 1) {
				addToast({
					type: 'error',
					message: 'Please add at least 1 answer for multi-answer questions.'
				});
				return false;
			}
			if (item.answers.some((answer) => !answer.trim())) {
				addToast({
					type: 'error',
					message: 'Please fill in all answer options.'
				});
				return false;
			}
			if (!item.numRequired || item.numRequired < 1 || item.numRequired > item.answers.length) {
				addToast({
					type: 'error',
					message: 'Please set a valid number of required answers.'
				});
				return false;
			}
		} else if (
			(item.answer ?? '').trim() === '' &&
			(Array.isArray(item.answers) ? item.answers.join('').trim() : (item.answers ?? '').trim()) ===
				''
		) {
			addToast({
				type: 'error',
				message: 'Please enter an answer.'
			});
			return false;
		}
		return true;
	}

	// Upload handlers
	async function handleImageUpload() {
		console.log('handleImageUpload called');
		console.log('Current item before upload:', JSON.stringify(item, null, 2));

		// Validate answers
		if (!validateAnswers()) return;

		// Validate image
		if (!item.src && !item.file) {
			addToast({ type: 'error', message: 'Please add an image.' });
			return;
		}

		console.log('About to call uploadData with item:', item);
		// Upload and handle success
		const newItems = await uploadData(item, undefined, false);
		console.log('Upload result:', newItems);
		if (newItems) {
			handleUploadSuccess(newItems, 'image');
		}
	}

	async function handleAudioUpload() {
		// Validate answers
		if (!validateAnswers()) return;

		// Upload and handle success
		const newItems = await uploadAudio(item);
		if (newItems) {
			handleUploadSuccess(newItems, 'audio');
		}
	}

	async function handleQuestionUpload() {
		// Validate question
		if ((item.question ?? '').trim() === '') {
			addToast({ type: 'error', message: 'Please enter a question.' });
			return;
		}

		// Validate answers
		if (!validateAnswers()) return;

		console.log('Uploading question:', item);
		// Upload and handle success
		const newItems = await uploadQuestion(item);
		if (newItems) {
			handleUploadSuccess(newItems, 'question');
		}
	}
</script>

<div class="question-type-form w-100">
	<!-- Navigation Tabs -->
	<nav class="nav nav-tabs">
		<button
			class="nav-link {questionType === 'Image' ? 'active' : ''}"
			on:click={() => (questionType = 'Image')}
		>
			Image
		</button>
		<button
			class="nav-link {questionType === 'Audio' ? 'active' : ''}"
			on:click={() => (questionType = 'Audio')}
		>
			Audio
		</button>
		<button
			class="nav-link {questionType === 'Question' ? 'active' : ''}"
			on:click={() => (questionType = 'Question')}
		>
			Question
		</button>
	</nav>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if questionType === 'Image'}
			<form on:submit|preventDefault={handleImageUpload}>
				<div class="row">
					{#if item.src}
						<div class="image-preview">
							<img src={item.src} alt="Preview" class="img-fluid" />
						</div>
					{/if}
					<div class="mt-3">
						<FileUpload
							on:uploadImage={(event) => {
								const fileOrUrl = event.detail;
								item.file = fileOrUrl;

								// Set src for preview
								if (typeof fileOrUrl === 'string') {
									// URL upload
									item.src = fileOrUrl;
								} else if (fileOrUrl && fileOrUrl instanceof File) {
									// File upload - create object URL for preview
									if (item.src && item.src.startsWith('blob:')) {
										// Clean up previous blob URL to prevent memory leaks
										URL.revokeObjectURL(item.src);
									}
									item.src = URL.createObjectURL(fileOrUrl);
								}

								console.log('Image uploaded, file:', fileOrUrl, 'src:', item.src);
							}}
						/>
					</div>
					<div class="form-group mt-3">
						<AnswerInput bind:item idPrefix="answer-image" />
					</div>
					<div class="mt-3">
						<button
							type="button"
							class="btn btn-outline-secondary mb-2"
							on:click={() => {
								if (!showSuggestions) {
									// Set searchTerm to the current answer input value
									searchTerm = item.answer ?? '';
								}
								showSuggestions = !showSuggestions;
							}}
						>
							{showSuggestions ? 'Hide' : 'Show'} Image Suggestions
						</button>
						{#if showSuggestions}
							<ImageSuggestions
								bind:searchTerm
								bind:suggestions={imageSuggestions}
								on:addImage={(e) => {
									const fileOrUrl = e.detail;
									item.file = fileOrUrl;

									// Set src for preview
									if (typeof fileOrUrl === 'string') {
										// URL upload
										item.src = fileOrUrl;
									} else if (fileOrUrl && fileOrUrl instanceof File) {
										// File upload - create object URL for preview
										if (item.src && item.src.startsWith('blob:')) {
											// Clean up previous blob URL to prevent memory leaks
											URL.revokeObjectURL(item.src);
										}
										item.src = URL.createObjectURL(fileOrUrl);
									}

									console.log('Image from suggestions, file:', fileOrUrl, 'src:', item.src);
								}}
							/>
						{/if}
					</div>
				</div>
				<button type="submit" class="btn btn-success mt-2">Add Image</button>
			</form>
		{:else if questionType === 'Audio'}
			<form on:submit|preventDefault={handleAudioUpload}>
				<div class="row">
					<div class="mt-3">
						<AudioUploader
							on:addSong={(e) => {
								console.log(e);
								item.videoId = e.detail.videoId;
								item.title = e.detail.title;
								item.thumbnail = e.detail.thumbnail;
								handleAudioUpload();
							}}
						/>
					</div>
					<div class="form-group mt-3">
						<AnswerInput bind:item idPrefix="answer-audio" />
					</div>
				</div>
				<button type="submit" class="btn btn-success mt-2">Add Audio</button>
			</form>
		{:else if questionType === 'Question'}
			<form on:submit|preventDefault={handleQuestionUpload}>
				<div class="form-group">
					<label for="question-input-question">Question:</label>
					<input
						id="question-input-question"
						type="text"
						class="form-control"
						bind:value={item.question}
						placeholder="Enter the question"
					/>
				</div>
				<AnswerInput bind:item idPrefix="answer-question" />
				<button type="submit" class="btn btn-success mt-2">Add Question</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.question-type-form {
		background: white;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.nav-tabs {
		border-bottom: 1px solid #dee2e6;
		margin-bottom: 20px;
	}

	.nav-tabs .nav-link {
		background: none;
		border: none;
		padding: 12px 24px;
		color: #6c757d;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		color: #495057;
		border-bottom-color: #dee2e6;
	}

	.nav-tabs .nav-link.active {
		color: #007bff;
		border-bottom-color: #007bff;
		font-weight: 600;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		font-weight: 600;
		margin-bottom: 8px;
		display: block;
		color: #495057;
	}

	.image-preview {
		margin-top: 15px;
		text-align: center;
	}

	.image-preview img {
		max-height: 200px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.audio-preview {
		padding: 10px;
		background: #f8f9fa;
		border-radius: 8px;
	}
</style>
