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

	function handleInput(e) {
		if (!item) return;
		clearTimeout(item._debounceTimeout);
		item._debounceTimeout = setTimeout(() => {
			let isCorrect = false;
			if (Array.isArray(item.answer)) {
				isCorrect = item.answer.some((ans) => areStringsClose(item.userAnswer, ans, 1));
			} else {
				isCorrect = areStringsClose(item.userAnswer, item.answer, 1);
			}
			if (isCorrect) {
				item.revealed = true;
				// If answer is array, set userAnswer to the matched answer
				if (Array.isArray(item.answer)) {
					const matched = item.answer.find((ans) => areStringsClose(item.userAnswer, ans, 1));
					item.userAnswer = matched;
					e.target.value = item.answer[0];
				} else {
					item.userAnswer = item.answer;
					e.target.value = item.answer;
				}
				e.target.disabled = true;
				e.target.style.display = 'none';
				e.target.style.backgroundColor = '#d4edda';

				dispatch('correctAnswer', { index: i });

				const inputs = document.querySelectorAll('.flashcards .card input[type="text"]');
				for (let j = i + 1; j < inputs.length; j++) {
					if (!inputs[j].disabled) {
						inputs[j].scrollIntoView({
							behavior: 'auto',
							block: 'end', // Scroll so input is at the bottom of the visible area
							inline: 'nearest'
						});
						setTimeout(() => {
							inputs[j].focus({ preventScroll: true });
							// Ensure input is visible and at the bottom of the viewport
							const rect = inputs[j].getBoundingClientRect();
							const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
							if (rect.bottom > viewportHeight || rect.top < 0) {
								inputs[j].scrollIntoView({ behavior: 'smooth', block: 'end' });
							}
						}, 0);
						break;
					}
				}
			}
		}, 100);
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
					{Array.isArray(item.answer) ? item.answer[0] : item.answer}
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
					<input
						class="user-answer"
						style="box-sizing: border-box;"
						type="text"
						placeholder="Type your answer here..."
						data-card-index={i}
						bind:value={item.userAnswer}
						on:input={handleInput}
					/>
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
