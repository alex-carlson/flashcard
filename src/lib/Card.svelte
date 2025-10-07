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

	// Remove filler words and spaces before comparing
	function normalize(str) {
		const fillerWords = ['the', 'of', 'in', 'a', 'an', 'to', 'and', 'for', 'on', 'at', 'by', 'with', 'from'];
		return (str || '')
			.toLowerCase()
			.replace(/\s+/g, '') // remove all spaces
			.split(/[\s,.;:!?]+/)
			.filter(word => word && !fillerWords.includes(word))
			.join('');
	}

	function handleInput(idx, e) {
		if (isLockedIn) return; // Prevent editing when locked in
		
		if (item.type === 'multiplechoice') {
			userAnswers[0] = e.target.value;
		} else {
			userAnswers[idx] = e.target.value;
		}
		console.log("User answers now:", userAnswers);
		validateAnswer();
		
		// Lock in if all required answers are correct for multi-answer questions
		if ((item.type === 'multianswer' || Array.isArray(item.answer)) && isValidated) {
			isLockedIn = true;
			item.revealed = true; // Mark as completed
		}
	}

	function isCorrect() {
		if (item.type === 'multiplechoice') {
			// For multiple choice, check if selected answer matches the correct one
			const correctAnswer = item.answers[item.correctAnswerIndex || 0];
			return normalize(userAnswers[0]) === normalize(correctAnswer);
		} else if (item.type === 'multianswer' || Array.isArray(item.answer)) {
			const req = item.numRequired ?? item.answer.length;
			const correct = item.answer.filter((ans, i) => normalize(userAnswers[i]) === normalize(ans));
			return correct.length >= req;
		} else {
			return normalize(userAnswers[0]) === normalize(item.answer);
		}
	}

	function validateAnswer() {
		if (item.type === 'multiplechoice') {
			// For multiple choice, validate if an option is selected
			isValidated = userAnswers[0]?.trim() && isCorrect();
		} else if (item.type === 'multianswer' || Array.isArray(item.answer)) {
			const req = item.numRequired ?? item.answer.length;
			const filledAnswers = userAnswers.filter(a => a?.trim());
			
			// Check if all filled answers are correct (green)
			const correctFilledAnswers = filledAnswers.filter(userAns => 
				item.answer.some(correctAns => 
					normalize(userAns) === normalize(correctAns)
				)
			);
			
			// Validate if we have enough correct answers and all filled answers are correct
			isValidated = filledAnswers.length >= req && correctFilledAnswers.length === filledAnswers.length && correctFilledAnswers.length >= req;
		} else {
			isValidated = userAnswers[0]?.trim() && isCorrect();
			// if is valid, lock in the answer
			if (isValidated) {
				isLockedIn = true;
				item.revealed = true; // Mark as completed
				// select the next input, or if there isn't one, search the whole document for the next input
				setTimeout(() => {
					const inputs = Array.from(document.querySelectorAll('input, textarea'));
					const currentInput = inputs.find(input => input.value === userAnswers[0]);
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
		
		if (!userAnswers[idx]?.trim()) return 'form-control answer-box';
		
		if (item.type === 'multianswer' || Array.isArray(item.answer)) {
			const isThisCorrect = item.answer.some(ans => 
				normalize(userAnswers[idx]) === normalize(ans)
			);
			return `form-control answer-box ${isThisCorrect ? 'correct' : 'incorrect'}`;
		} else {
			return `form-control answer-box ${isCorrect() ? 'correct' : 'incorrect'}`;
		}
	}
</script>

{#if !item.hidden}
	<div
		class="card {item.revealed ? 'revealed' : ''} {item.incorrect ? 'incorrect' : ''}"
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
		{:else if item.type === 'image'}
			<LazyLoadImage
				imageUrl={item.imageUrl}
				on:load={() => onCardLoad(i)}
				on:error={() => {
					item.hidden = true;
					updateCards();
				}}
			/>
		{:else if item.type === 'text'}
			<h2 class="p-3">{item.question || 'Loading'}</h2>
		{/if}

		{#if item.supplemental}
			<span class="supplemental">{@html (item.supplemental || '').replace(/\n/g, '<br>')}</span>
		{/if}

		<div class="answerbox mt-2">
			{#if currentMode === 'TRUE_FALSE'}
				<Options {cards} currentCardIndex={i} numberOfOptions="2" {shuffleTrigger} />
			{:else if currentMode === 'MULTIPLE_CHOICE'}
				<Options {cards} currentCardIndex={i} numberOfOptions="4" {shuffleTrigger} />
			{:else if currentMode === 'FILL_IN_THE_BLANK'}
				{#if item.answerer}
					<ProfilePicture userId={item.answerer} size={32} class="answerer" />
				{/if}
				<span
					class={`answer ${item.revealed ? 'revealed' : 'hidden'}`}
					style="transform: scale(1);"
				>
					{#if item.revealed}
						{#if item.type === 'multiplechoice'}
							{item.answers[item.correctAnswerIndex || 0]}
						{:else if item.type === 'multianswer' || Array.isArray(item.answer)}
							{userAnswers.filter(a => a?.trim()).join(', ') || 'No answers provided'}
						{:else}
							{item.answer}
						{/if}
					{:else}
						{#if item.type === 'multiplechoice'}
							{item.answers ? item.answers[0] : item.answer}
						{:else if Array.isArray(item.answer)}
							{item.answer[0]}
						{:else}
							{item.answer}
						{/if}
					{/if}
				</span>
				{#if item.extra && item.revealed}
					<span class="extra">{item.extra}</span>
				{/if}
				<div class="input-container">
					{#if !item.revealed && !isPartyMode}
						<button class="give-up-btn small" on:click|stopPropagation={handleGiveUp} tabindex="-1">
							<Fa icon={faFlag} />
						</button>
					{/if}
					{#if item.type === 'multiplechoice'}
						<!-- Multiple Choice - Radio buttons -->
						<div class="multiple-choice-inputs">
							{#each (item.answers || (Array.isArray(item.answer) ? item.answer : [])) as choice, idx}
								<button
									type="button"
									class="choice-option {userAnswers[0] === choice ? 'selected' : ''}"
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
					{:else if item.type === 'multianswer' || Array.isArray(item.answer)}
						<!-- Multi-Answer - Multiple text inputs -->
						<div class="multi-answer-inputs">
							{#each Array(item.numRequired || item.answer.length) as _, idx}
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
	/* .answer-box.correct {
		border-color: #28a745;
		background-color: #d4edda;
	}

	.answer-box.incorrect {
		border-color: #dc3545;
		background-color: #f8d7da;
	} */

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
	}

	.multiple-choice-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.choice-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.choice-option:hover {
		background-color: #f8f9fa;
		border-color: #adb5bd;
	}

	.choice-option input[type="radio"] {
		margin: 0;
		cursor: pointer;
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
	}
</style>
