<script>
	import { createEventDispatcher } from 'svelte';
	import LazyLoadImage from './LazyLoadImage.svelte';
	import Options from './Options.svelte';
	import ProfilePicture from './ProfilePicture.svelte';
	import YoutubeAudioPlayer from '$lib/YoutubeAudioPlayer.svelte';
	import { areStringsClose } from '$lib/api/utils';

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

	const dispatch = createEventDispatcher();

	function handleInput(e) {
		if (!item) return;
		clearTimeout(item._debounceTimeout);
		item._debounceTimeout = setTimeout(() => {
			if (areStringsClose(item.userAnswer, item.answer, 0.9)) {
				item.revealed = true;
				item.userAnswer = item.answer;
				e.target.value = item.answer;
				e.target.disabled = true;
				e.target.style.display = 'none';
				e.target.style.backgroundColor = '#d4edda';

				dispatch('correctAnswer', { index: i });

				const inputs = document.querySelectorAll('.flashcards input');
				for (let j = i + 1; j < inputs.length; j++) {
					if (!inputs[j].disabled) {
						inputs[j].scrollIntoView({
							behavior: 'smooth',
							block: 'end',
							inline: 'nearest'
						});
						setTimeout(() => {
							inputs[j].focus({ preventScroll: true });
						}, 80);
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
		role="button"
		tabindex="-1"
		on:keydown={(e) => currentMode === 'FLASH_CARDS' && e.key === 'Enter' && toggleReveal(i)}
		on:click={() => currentMode === 'FLASH_CARDS' && toggleReveal(i)}
	>
		{#if item.type === 'audio'}
			<YoutubeAudioPlayer id={item.id} videoId={item.audio} />
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

		{#if currentMode === 'TRUE_FALSE'}
			<Options {cards} currentCardIndex={i} numberOfOptions="2" {shuffleTrigger} />
		{:else if currentMode === 'MULTIPLE_CHOICE'}
			<Options {cards} currentCardIndex={i} numberOfOptions="4" {shuffleTrigger} />
		{:else if currentMode === 'FILL_IN_THE_BLANK'}
			{#if item.answerer}
				<ProfilePicture userId={item.answerer} size={32} class="answerer" />
			{/if}
			<span class={`answer ${item.revealed ? 'revealed' : 'hidden'}`} style="transform: scale(1);">
				{item.answer}
			</span>
			<input
				style="box-sizing: border-box;"
				type="text"
				placeholder="Type your answer here..."
				bind:value={item.userAnswer}
				on:input={handleInput}
			/>
		{:else}
			<span class={item.revealed ? 'revealed' : 'hidden'} style="transform: scale(1);">
				{item.answer || 'Loading'}
			</span>
		{/if}
	</div>
{/if}
