<script>
	import { createEventDispatcher } from 'svelte';
	import LazyLoadImage from './LazyLoadImage.svelte';
	import Options from './Options.svelte';
	import ProfilePicture from './ProfilePicture.svelte';
	import YoutubeAudioPlayer from '$lib/YoutubeAudioPlayer.svelte';
	import { areStringsClose } from '$lib/api/utils';
	import Fa from 'svelte-fa';
	import { faFlag } from '@fortawesome/free-solid-svg-icons';

	export let item = {
		type: 'text',
		question: '',
		answer: '',
		userAnswer: '',
		revealed: false,
		incorrect: false,
		hidden: false
	};
	export let i = 0;
	export let cards = [];
	export let currentMode = 'FLASH_CARDS';
	export let shuffleTrigger = 0;
	export let onCardLoad = () => {};
	export let toggleReveal = () => {};
	export let updateCards = () => {};
	export let isPartyMode = false;

	const dispatch = createEventDispatcher();

	function handleGiveUp() {
		dispatch('giveUp', { index: i });
	}

	let userAnswers = [];
	let isValidated = false;
	let isLockedIn = false;
	let multipleChoiceSelected = false; // Track if user has made a selection

	function handleInput(idx, e) {
		if (isLockedIn) return; // Prevent editing when locked in

		if (item.type === 'multiplechoice') {
			userAnswers[0] = e.target.value;
			multipleChoiceSelected = true;
			// Lock in immediately for multiple choice to show feedback
			isLockedIn = true;
			item.revealed = true; // Mark as completed

			// Always dispatch correctAnswer event for multiple choice
			dispatch('correctAnswer', {
				index: i,
				answer: item.answers[item.correctAnswerIndex || 0],
				userAnswer: userAnswers[0],
				isCorrect: isCorrect()
			});
		} else {
			userAnswers[idx] = e.target.value;
		}
		validateAnswer();

		// Lock in if all required answers are correct for multi-answer questions
		if (item.type === 'multianswer' && isValidated) {
			isLockedIn = true;
			item.revealed = true; // Mark as completed

			// Dispatch correctAnswer event to notify parent
			dispatch('correctAnswer', {
				index: i,
				answer: item.answers || [item.answer],
				userAnswer: userAnswers.filter((a) => a && a.trim()),
				isCorrect: isCorrect()
			});
		}
	}

	function isCorrect() {
		if (item.type === 'multiplechoice') {
			// For multiple choice, check if selected answer matches the correct one
			const correctAnswer = item.answers[item.correctAnswerIndex || 0];
			return areStringsClose(userAnswers[0], correctAnswer);
		} else if (item.type === 'multianswer') {
			// For multi-answer, check how many correct answers the user provided
			const req = item.numRequired ?? (item.answers ? item.answers.length : 1);
			const correctAnswers = item.answers || [item.answer];
			const filledUserAnswers = userAnswers.filter((ans) => ans && ans.trim());

			// Count how many of the user's answers match correct answers
			const matchedCorrectAnswers = new Set();
			filledUserAnswers.forEach((userAns) => {
				correctAnswers.forEach((correctAns) => {
					if (areStringsClose(userAns, correctAns)) {
						matchedCorrectAnswers.add(correctAns);
					}
				});
			});

			return matchedCorrectAnswers.size >= req;
		} else {
			if (Array.isArray(item.answer)) {
				return item.answer.some((ans) => areStringsClose(userAnswers[0], ans));
			}
			return areStringsClose(userAnswers[0], item.answer);
		}
	}

	function validateAnswer() {
		if (item.type === 'multiplechoice') {
			// For multiple choice, just validate if an option is selected
			// Event dispatching is handled in handleInput
			isValidated = userAnswers[0]?.trim() && isCorrect();
		} else if (item.type === 'multianswer') {
			const correctAnswers = item.answers || [item.answer];
			const req = item.numRequired ?? correctAnswers.length;
			const filledAnswers = userAnswers.filter((a) => a && a.trim());

			// Check if all filled answers are correct (green)
			const correctFilledAnswers = filledAnswers.filter((userAns) =>
				correctAnswers.some((correctAns) => areStringsClose(userAns, correctAns))
			);

			// Validate if we have enough correct answers and all filled answers are correct
			isValidated =
				filledAnswers.length >= req &&
				correctFilledAnswers.length === filledAnswers.length &&
				correctFilledAnswers.length >= req;
		} else {
			isValidated = userAnswers[0]?.trim() && isCorrect();
			// if is valid, lock in the answer
			if (isValidated) {
				isLockedIn = true;
				item.revealed = true; // Mark as completed

				// Dispatch correctAnswer event to notify parent
				dispatch('correctAnswer', {
					index: i,
					answer: Array.isArray(item.answer) ? item.answer[0] : item.answer,
					userAnswer: userAnswers[0],
					isCorrect: true
				}); // select the next input, or if there isn't one, search the whole document for the next input
				setTimeout(() => {
					const inputs = Array.from(document.querySelectorAll('input, textarea'));
					const currentInput = inputs.find((input) => input.value === userAnswers[0]);
					if (currentInput) {
						const currentIndex = inputs.indexOf(currentInput);
						if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
							inputs[currentIndex + 1].focus();
						} else {
							// If no next input, focus the first input in the document
							if (inputs.length > 0) {
								inputs[0].focus();
							}
						}
					}
				});
			}
		}
	}

	function getInputClass(idx) {
		if (item.type === 'multiplechoice') {
			// For multiple choice, we don't need input styling since we use radio buttons
			return '';
		}

		return 'form-control answer-box';
	}

	// Get class for multiple choice option buttons
	function getChoiceClass(choice, idx) {
		let baseClass = 'choice-option';

		if (!multipleChoiceSelected) {
			// Before selection, show selected state
			return userAnswers[0] === choice ? `${baseClass} selected` : baseClass;
		}

		// After selection, show correct/incorrect states
		const isCorrectChoice = idx === (item.correctAnswerIndex || 0);
		const isSelectedChoice = userAnswers[0] === choice;

		if (isCorrectChoice) {
			return `${baseClass} correct`;
		} else if (isSelectedChoice) {
			return `${baseClass} incorrect`;
		}

		return baseClass;
	}

	// Get class for revealed answer based on correctness
	function getRevealedClass() {
		if (!item.revealed) return 'answer';
		return `answer ${isCorrect() ? 'correct' : 'incorrect'}`;
	}
</script>

{#if !item.hidden}
	<div
		class="card {item.revealed ? 'revealed' : ''} {item.incorrect ? 'incorrect' : ''} {item.type}"
		data-card-index={i}
		role="button"
		tabindex="-1"
		on:keydown={(e) => currentMode === 'FLASH_CARDS' && e.key === 'Enter' && toggleReveal(i)}
		on:click={() => currentMode === 'FLASH_CARDS' && toggleReveal(i)}
	>
		{#if item.type === 'audio'}
			<YoutubeAudioPlayer id={item.id} videoId={item.audio} />
			{#if item.revealed}
				<div class="audio-revealed">
					<a
						href={`https://www.youtube.com/watch?v=${item.audio}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src={item.thumbnail} alt="YouTube thumbnail" class="youtube-thumbnail" />
					</a>
					<div class="youtube-title">
						{item.title}
					</div>
				</div>
			{/if}
		{/if}

		{#if item.imageUrl}
			<LazyLoadImage
				imageUrl={item.imageUrl}
				on:load={() => onCardLoad(i)}
				on:error={() => {
					item.hidden = true;
					updateCards();
				}}
			/>
		{/if}

		{#if item.type === 'text' || item.question}
			<h2 class="p-3">{item.question || 'Loading'}</h2>
		{/if}

		{#if item.supplemental}
			<span class="supplemental">{@html (item.supplemental || '').replace(/\n/g, '<br>')}</span>
		{/if}

		<div class="answerbox mt-2">
			{#if currentMode === 'TRUE_FALSE'}
				<Options
					{cards}
					currentCardIndex={i}
					numberOfOptions="2"
					{shuffleTrigger}
					on:correctAnswer
				/>
			{:else if currentMode === 'MULTIPLE_CHOICE'}
				<Options
					{cards}
					currentCardIndex={i}
					numberOfOptions="4"
					{shuffleTrigger}
					on:correctAnswer
				/>
			{:else if currentMode === 'FILL_IN_THE_BLANK'}
				{#if item.answerer}
					<ProfilePicture userId={item.answerer} size={32} class="answerer" />
				{/if}
				<span
					class={`${getRevealedClass()} ${item.revealed ? 'revealed' : 'hidden'}`}
					style="transform: scale(1);"
				>
					{#if item.revealed}
						{#if item.type === 'multiplechoice'}
							{item.answers[item.correctAnswerIndex || 0]}
						{:else if item.type === 'multianswer'}
							{userAnswers.filter((a) => a?.trim()).join(', ') || 'No answers provided'}
						{:else}
							{Array.isArray(item.answer) ? item.answer[0] : item.answer}
						{/if}
					{:else}
						{item.answer}
					{/if}
				</span>
				{#if item.extra && item.revealed}
					<span class="extra">{item.extra}</span>
				{/if}
				<div class="input-container">
					{#if !item.revealed && !isPartyMode}
						<button
							class="give-up-btn small {item.type === 'multiplechoice' ||
							item.type === 'multianswer'
								? 'floating'
								: ''}"
							on:click|stopPropagation={handleGiveUp}
							tabindex="-1"
						>
							<Fa icon={faFlag} />
						</button>
					{/if}
					{#if item.type === 'multiplechoice'}
						<!-- Multiple Choice - Radio buttons -->
						<div class="multiple-choice-inputs">
							{#each item.answers || [] as choice, idx}
								<button
									type="button"
									class={getChoiceClass(choice, idx)}
									on:click={() => {
										if (!isLockedIn) {
											userAnswers[0] = choice;
											handleInput(0, { target: { value: choice } });
										}
									}}
									disabled={isLockedIn}
								>
									<span class="choice-text">{choice}</span>
								</button>
							{/each}
						</div>
					{:else if item.type === 'multianswer'}
						<!-- Multi-Answer - Multiple text inputs -->
						<div class="multi-answer-inputs">
							{#each Array(item.numRequired || (item.answers ? item.answers.length : 1)) as _, idx}
								<div class="input-row">
									<input
										type="text"
										class={getInputClass(idx)}
										placeholder={`Answer ${idx + 1}`}
										value={userAnswers[idx] || ''}
										on:input={(e) => handleInput(idx, e)}
										disabled={isLockedIn}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<!-- Single Answer - Single text input -->
						<input
							type="text"
							class={getInputClass(0)}
							placeholder="Enter your answer"
							value={userAnswers[0] || ''}
							on:input={(e) => handleInput(0, e)}
						/>
					{/if}
				</div>
			{:else}
				<span
					class={`answer black ${item.revealed ? 'revealed' : 'hidden'}`}
					style="transform: scale(1);"
				>
					{Array.isArray(item.answer) ? item.answer[0] : item.answer || 'Loading'}
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.answer.correct {
		border: 2px solid #28a745;
		background-color: #d4edda;
		color: #155724;
		padding: 0.5rem;
		border-radius: 0.375rem;
	}

	.answer.incorrect {
		border: 2px solid #dc3545;
		background-color: #f8d7da;
		color: #721c24;
		padding: 0.5rem;
		border-radius: 0.375rem;
	}

	.validation-status {
		display: inline-block;
		margin-left: 10px;
		font-weight: bold;
	}

	.validation-status.correct {
		color: #28a745;
	}

	.validation-status.incorrect {
		color: #dc3545;
	}

	input:disabled {
		background-color: #e9ecef;
		opacity: 1;
		cursor: not-allowed;
	}

	.multi-answer-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex: 1;
		width: 100%;
	}

	.multiple-choice-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex: 1;
		width: 100%;
	}

	.choice-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.375rem;
		cursor: pointer;
		background-color: white;
		color: #333;
		width: 100%;
		transition:
			background-color 0.3s ease,
			border-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	.choice-option.selected {
		background-color: #e3f2fd;
		border-color: #2196f3;
		color: #1565c0;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
	}

	.choice-option.correct {
		background-color: #d4edda;
		border-color: #28a745;
		color: #155724;
		box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
	}

	.choice-option.incorrect {
		background-color: #f8d7da;
		border-color: #dc3545;
		color: #721c24;
		box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
	}

	.choice-option:hover:not(.correct):not(.incorrect) {
		background-color: #f8f9fa;
		border-color: #adb5bd;
	}

	.choice-option:disabled {
		cursor: not-allowed;
		opacity: 0.8;
	}

	.choice-text {
		flex: 1;
		cursor: pointer;
		user-select: none;
	}

	.input-row {
		display: block;
		width: 100%;
	}

	.input-row input {
		width: 100%;
		display: block;
		flex: 1;
	}

	.input-container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
		width: 100%;
	}

	.give-up-btn {
		flex-shrink: 0;
		align-self: flex-start;
	}
</style>
