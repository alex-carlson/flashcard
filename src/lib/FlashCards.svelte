<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { user } from '../stores/user';
	import { youtubePlayerService } from './api/youtubePlayer.js';
	import { getRandomPhraseForScore, toLetterGrade } from './api/quizScore';
	import { createQuizStore } from '../stores/quiz';

	// Components
	import Modal from './Modal.svelte';
	import Card from './Card.svelte';
	import Loading from './components/Loading.svelte';
	import Toolbar from './components/quiz/Toolbar.svelte';
	import QuizHeader from './components/quiz/QuizHeader.svelte';
	import QuizActions from './components/quiz/QuizActions.svelte';
	import ErrorDisplay from './components/quiz/ErrorDisplay.svelte';
	// Props
	export let collectionId;
	export let practiceMode;
	export let isPartyMode = false;
	export let quiz; // Allow external quiz store to be passed in

	// Initialize quiz store (use external if provided, otherwise create new)
	const quizStore = quiz ?? createQuizStore();
	const dispatch = createEventDispatcher();

	// Access stats as a separate reactive store
	$: stats = quizStore.stats;

	// Auto-trigger completion when all cards are revealed
	$: {
		if ($stats.isComplete && !$quizStore.showModal && !$quizStore.isComplete) {
			quizStore.completeQuiz($user?.id ?? undefined, $user?.token ?? undefined);
			dispatch('finish');
		}
	}

	// Dispatch stats updates for live score display
	$: if ($stats && $quizStore.hasInitialized) {
		dispatch('statsUpdate', $stats);
	}

	// Handle toolbar updates
	function handleToolbarUpdate(event) {
		const updates = event.detail;

		// Handle different types of updates
		if (updates.cards) {
			// Update all cards (e.g., shuffle, reset)
			quizStore.update((state) => ({ ...state, ...updates }));
		} else if (updates.hasOwnProperty('isGrid')) {
			// Toggle grid
			quizStore.toggleGrid();
		} else if (updates.hasOwnProperty('isFullscreen')) {
			// Handle fullscreen toggle
			quizStore.update((state) => ({ ...state, ...updates }));
		} else {
			// Generic update
			quizStore.update((state) => ({ ...state, ...updates }));
		}
	}

	function onCardLoad(index) {
		quizStore.updateCard(index, { loaded: true });
	}

	export function setRevealed(index, value, playerId = null) {
		const updates = { revealed: value };
		if (playerId) {
			updates.answerer = playerId;
		}
		quizStore.updateCard(index, updates);
	}

	function toggleReveal(index) {
		quizStore.update((state) => ({
			...state,
			cards: state.cards.map((card, i) =>
				i === index ? { ...card, revealed: !card.revealed } : card
			)
		}));
	}

	function setMode(mode) {
		quizStore.setMode(mode);
	}
	function onCorrectAnswer(event) {
		const { index, answer, userAnswer, isCorrect } = event.detail;
		quizStore.updateCard(index, {
			revealed: true,
			userAnswer: userAnswer || answer,
			isCorrect: isCorrect // Store whether the answer was actually correct
		});

		const nextCardIndex = $quizStore.cards.findIndex((card, i) => i > index && !card.revealed);
		if (nextCardIndex !== -1) {
			const nextCard = $quizStore.cards[nextCardIndex];
			if (nextCard.questionType === 'audio' && nextCard.audio) {
				try {
					youtubePlayerService.loadVideoOnly(nextCard.audio);
				} catch (error) {
					console.error('Failed to auto-play next audio question:', error);
				}
			}
		}

		dispatch('correctAnswer', event.detail);
	}

	function retryFetch() {
		quizStore.retry();
	}

	onMount(() => {
		if (collectionId && !$quizStore.hasInitialized) {
			quizStore.loadCollection(collectionId);
		}
	});

	export function onQuizStart() {
		quizStore.setIsPractice(practiceMode);
	}

	export function getStats() {
		return $stats;
	}

	$: if (collectionId && !$quizStore.hasInitialized && !$quizStore.isLoading) {
		quizStore.loadCollection(collectionId);
	}
</script>

<div class="container white pt-3">
	{#if $quizStore.isLoading || (!$quizStore.hasInitialized && collectionId)}
		<Loading />
	{:else if $quizStore.loadingError}
		<ErrorDisplay error={$quizStore.loadingError} onRetry={retryFetch} />
	{:else if $quizStore.cards.length > 0}
		{#if !isPartyMode}
			<Toolbar
				cards={$quizStore.cards}
				isGrid={$quizStore.isGrid}
				isFullscreen={$quizStore.isFullscreen}
				shuffleTrigger={$quizStore.shuffleTrigger}
				on:update={handleToolbarUpdate}
			/>
		{/if}

		{#if !isPartyMode && practiceMode}
			<select class="my-3" name="mode" id="mode" on:change={(e) => setMode(e.target.value)}>
				{#each [['FILL_IN_THE_BLANK', 'Fill in the Blank'], ['TRUE_FALSE', '50/50'], ['MULTIPLE_CHOICE', 'Multiple Choice'], ['FLASH_CARDS', 'Flashcard']] as [mode, label]}
					<option value={mode} selected={mode === $quizStore.currentMode}>
						{label}
					</option>
				{/each}
			</select>
		{/if}

		<div class={'flashcards ' + ($quizStore.isGrid ? 'grid' : 'vertical')}>
			{#if $quizStore.hasInitialized}
				{#each $quizStore.cards as item, i (item.id || i)}
					<Card
						{item}
						{i}
						cards={$quizStore.cards}
						currentMode={$quizStore.currentMode}
						shuffleTrigger={$quizStore.shuffleTrigger}
						{onCardLoad}
						{toggleReveal}
						{isPartyMode}
						updateCards={() => {}}
						on:correctAnswer={onCorrectAnswer}
						on:giveUp={(e) => {
							console.log('Give up on card', i);
							setRevealed(e.detail.index, true);
						}}
					/>
				{/each}
			{/if}
		</div>

		<QuizActions
			currentMode={$quizStore.currentMode}
			isComplete={$quizStore.isComplete}
			on:giveup={() => {
				quizStore.completeQuiz($user?.id, $user?.token);
				dispatch('giveup');
			}}
			onCompleteQuiz={() => quizStore.completeQuiz($user?.id, $user?.token)}
			{isPartyMode}
		/>
	{/if}

	<div class="youtube-wrapper" id="player" style="width:1px; height:1px; overflow:hidden;"></div>
	{#if $quizStore.isPractice}
		<Modal
			bind:show={$quizStore.showModal}
			title="Practice Concluded"
			message="Practice makes perfect!"
			onClose={() => {
				quiz.revealCards();
				quiz.closeModal();
			}}
			buttons={[
				{
					text: 'Retry',
					action: () => {
						quiz.retry();
					},
					class: 'bg-yellow-400 text-black'
				},
				{
					text: 'See Answers',
					action: () => {
						quiz.revealCards();
						quiz.closeModal();
					},
					class: 'bg-yellow-400 text-black'
				}
			]}
		/>
	{:else}
		<Modal
			bind:show={$quizStore.showModal}
			title="Quiz Completed"
			message={getRandomPhraseForScore($stats.percentage)}
			grade={toLetterGrade($stats.percentage)}
			effect={$stats.isComplete ? 'confetti' : 'none'}
			onClose={() => {
				quiz.revealCards();
				quiz.closeModal();
			}}
			buttons={[
				{
					text: 'Retry',
					action: () => {
						quiz.retry();
					},
					class: 'bg-yellow-400 text-black'
				},
				{
					text: 'Leaderboards',
					action: () => {
						window.location.href = '/leaderboard';
					},
					class: 'bg-blue-500 text-white'
				}
			]}
		/>
	{/if}
</div>
