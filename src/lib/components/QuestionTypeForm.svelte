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
        if (((item.answer ?? '').trim() === '') && ((Array.isArray(item.answers) ? item.answers.join('').trim() : (item.answers ?? '').trim()) === '')) {
			addToast({
				type: 'error',
				message: 'Please enter an answer.'
			});
			return;
		}
        if (!item.src && !item.file) {
            addToast({
                type: 'error',
                message: 'Please add an image.'
            });
            return;
        }
		const newItems = await uploadData(item, undefined, false);
		if (newItems) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				type: 'image'
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
			// Focus and scroll to question input for next item
			setTimeout(focusQuestionInput, 100);
		}
	}

	async function handleAudioUpload() {
		if ((item.question ?? '').trim() === '') {
			addToast({
				type: 'error',
				message: 'Please enter a question.'
			});
			return;
		}

        const newItems = await uploadAudio(item);
		if (newItems) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				type: 'audio'
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
        console.log("Uploading question:", item);
		const newItems = await uploadQuestion(item);
		if (newItems) {
			// Dispatch event to parent instead of directly modifying collection
			dispatch('itemAdded', {
				items: newItems[0].items,
				itemsLength: newItems[0].items.length,
				type: 'question'
			});
			
			addToast({
				type: 'success',
				message: 'Question added successfully!'
			});
			item.question = '';
			item.answer = '';
			item.answers = '';
			// Focus and scroll to question input for next item
			setTimeout(focusQuestionInput, 100);
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
                                    item.file = e.detail;
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
                                item.src = e.detail.videoId;
                                item.audio = e.detail.videoId;
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