<script>
	import { createEventDispatcher } from 'svelte';
	import FileUpload from '../Upload/FileUpload.svelte';
	import AudioUploader from '../Upload/AudioUploader.svelte';
	import ImageSuggestions from '../ImageSuggestions.svelte';
	import AnswerInput from './AnswerInput.svelte';
	import { addToast } from '../../stores/toast';
	import { uploadData, uploadQuestion, uploadAudio } from '../Upload/uploader';
	import { QuestionType, AnswerType } from '$lib/types/enums';

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

	// Upload handlers
	async function handleImageUpload() {
		console.log('Uploading image item:', item);
		console.log('Item file:', item.file, 'Item src:', item.src);
		console.log('Item answers:', item.answers, 'Item answer:', item.answer);

		if (
			(item.answer ?? '').trim() === '' &&
			(Array.isArray(item.answers) ? item.answers.join('').trim() : (item.answers ?? '').trim()) ===
				''
		) {
			addToast({
				type: 'error',
				message: 'Please enter an answer.'
			});
			return;
		}
		if (!item.src && !item.file) {
			console.log('No image found - src:', item.src, 'file:', item.file);
			addToast({
				type: 'error',
				message: 'Please add an image.'
			});
			return;
		}
		const newItems = await uploadData(
			{
				...item,
				questionType: QuestionType.IMAGE,
				answerType: item.answerType || AnswerType.SINGLE
			},
			undefined,
			false
		);
		if (newItems && Array.isArray(newItems) && newItems.length > 0 && newItems[0]?.items) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				questionType: 'image'
			});

			addToast({
				type: 'success',
				message: 'Image added successfully!'
			});
			item.question = '';
			item.answer = '';
			item.answers = '';
			item.src = '';
			item.supplemental_text = '';
			imageSuggestions = [];
			searchTerm = '';
			// Focus and scroll to question input for next item
			setTimeout(focusQuestionInput, 100);
		}
	}

	async function handleAudioUpload() {
		// Add type properties for audio uploads
		const audioItem = {
			...item,
			questionType: QuestionType.AUDIO,
			answerType: item.answerType || AnswerType.SINGLE
		};
		const newItems = await uploadAudio(audioItem);
		if (newItems && Array.isArray(newItems) && newItems.length > 0 && newItems[0]?.items) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				questionType: 'audio'
			});

			addToast({
				type: 'success',
				message: 'Audio added successfully!'
			});
			item.question = '';
			item.answer = '';
			item.answers = '';
			item.src = '';
			item.supplemental_text = '';
			// Focus and scroll to question input for next item
			setTimeout(focusQuestionInput, 100);
		}
	}

	async function handleQuestionUpload() {
		if ((item.question ?? '').trim() === '') {
			addToast({
				type: 'error',
				message: 'Please enter a question.'
			});
			return;
		}
		console.log('Uploading question:', item);
		const newItems = await uploadQuestion({
			...item,
			questionType: QuestionType.TEXT,
			answerType: item.answerType || AnswerType.SINGLE
		});
		if (newItems && Array.isArray(newItems) && newItems.length > 0 && newItems[0]?.items) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				questionType: 'text'
			});

			addToast({
				type: 'success',
				message: 'Question added successfully!'
			});
			item.question = '';
			item.answer = '';
			item.answers = '';
			item.src = '';
			item.supplemental_text = '';
			const inputs = document.querySelectorAll('input, textarea');
			inputs.forEach((input) => {
				input.value = '';
			});
			// Focus and scroll to question input for next item
			setTimeout(focusQuestionInput, 100);
		}
	}
</script>

<div class="question-type-form w-100 px-2">
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
								item.file = event.detail;
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
									// Extract just the URL string for proper URL upload handling
									item.file = e.detail.file;
									// Copy other properties that might be needed, but NOT answer/answers
									// to preserve what user typed in AnswerInput component
									if (e.detail.question) item.question = e.detail.question;
									if (e.detail.src) item.src = e.detail.src;
									if (e.detail.questionType) item.questionType = e.detail.questionType;
									if (e.detail.answerType) item.answerType = e.detail.answerType;
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
