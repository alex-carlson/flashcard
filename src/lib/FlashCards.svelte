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

	// Initialize quiz store
	const quiz = createQuizStore();
	const dispatch = createEventDispatcher();

	// Access stats as a separate reactive store
	$: stats = quiz.stats;

	// Auto-trigger completion when all cards are revealed
	$: {
		console.log('Quiz state check:', {
			isComplete: $stats.isComplete,
			practiceMode: $quiz.isPractice,
			showModal: $quiz.showModal,
			quizComplete: $quiz.isComplete,
			cardsRevealed: $quiz.cards.filter((c) => c.revealed).length,
			totalCards: $quiz.cards.length
		});

		if ($stats.isComplete && !$quiz.showModal && !$quiz.isComplete) {
			console.log('Auto-completing quiz...');
			quiz.completeQuiz($user?.id ?? undefined, $user?.token ?? undefined);
			dispatch('finish');
		}
	}

	// Dispatch stats updates for live score display
	$: if ($stats && $quiz.hasInitialized) {
		dispatch('statsUpdate', $stats);
	}

	// Handle toolbar updates
	function handleToolbarUpdate(event) {
		const updates = event.detail;

		// Handle different types of updates
		if (updates.cards) {
			// Update all cards (e.g., shuffle, reset)
			quiz.update((state) => ({ ...state, ...updates }));
		} else if (updates.hasOwnProperty('isGrid')) {
			// Toggle grid
			quiz.toggleGrid();
		} else if (updates.hasOwnProperty('isFullscreen')) {
			// Handle fullscreen toggle
			quiz.update((state) => ({ ...state, ...updates }));
		} else {
			// Generic update
			quiz.update((state) => ({ ...state, ...updates }));
		}
	}

	function onCardLoad(index) {
		quiz.updateCard(index, { loaded: true });
	}

	export function setRevealed(index, value, playerId = null) {
		const updates = { revealed: value };
		if (playerId) {
			updates.answerer = playerId;
		}
		quiz.updateCard(index, updates);
	}

	function toggleReveal(index) {
		quiz.update((state) => ({
			...state,
			cards: state.cards.map((card, i) =>
				i === index ? { ...card, revealed: !card.revealed } : card
			)
		}));
	}

	function setMode(mode) {
		quiz.setMode(mode);
	}
	function onCorrectAnswer(event) {
		const { index, answer, userAnswer } = event.detail;
		quiz.updateCard(index, {
			revealed: true,
			userAnswer: userAnswer || answer
		});

		const nextCardIndex = $quiz.cards.findIndex((card, i) => i > index && !card.revealed);
		if (nextCardIndex !== -1) {
			const nextCard = $quiz.cards[nextCardIndex];
			if (nextCard.type === 'audio' && nextCard.audio) {
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
		quiz.retry();
	}

	onMount(() => {
		if (collectionId && !$quiz.hasInitialized) {
			quiz.loadCollection(collectionId);
		}
	});

	export function onQuizStart() {
		quiz.setIsPractice(practiceMode);
	}

	export function getStats() {
		return $stats;
	}

	$: if (collectionId && !$quiz.hasInitialized && !$quiz.isLoading) {
		quiz.loadCollection(collectionId);
	}
</script>

<div class="container white pt-3">
	{#if $quiz.isLoading || (!$quiz.hasInitialized && collectionId)}
		<Loading />
	{:else if $quiz.loadingError}
		<ErrorDisplay error={$quiz.loadingError} onRetry={retryFetch} />
	{:else if $quiz.cards.length > 0}
		{#if !isPartyMode}
			<Toolbar
				cards={$quiz.cards}
				isGrid={$quiz.isGrid}
				isFullscreen={$quiz.isFullscreen}
				shuffleTrigger={$quiz.shuffleTrigger}
				on:update={handleToolbarUpdate}
			/>
		{/if}

		<QuizHeader
			collectionName={$quiz.collection.name}
			author={$quiz.collection.author}
			authorSlug={$quiz.collection.author_slug}
			thumbnail={$quiz.collection.thumbnail}
			description={$quiz.collection.description}
		/>

		{#if !isPartyMode && practiceMode}
			<select class="my-3" name="mode" id="mode" on:change={(e) => setMode(e.target.value)}>
				{#each [['FILL_IN_THE_BLANK', 'Fill in the Blank'], ['TRUE_FALSE', '50/50'], ['MULTIPLE_CHOICE', 'Multiple Choice'], ['FLASH_CARDS', 'Flashcard']] as [mode, label]}
					<option value={mode} selected={mode === $quiz.currentMode}>
						{label}
					</option>
				{/each}
			</select>
		{/if}

		<div class={'flashcards ' + ($quiz.isGrid ? 'grid' : 'vertical')}>
			{#if $quiz.hasInitialized}
				{#each $quiz.cards as item, i (item.id || i)}
					<Card
						{item}
						{i}
						cards={$quiz.cards}
						currentMode={$quiz.currentMode}
						shuffleTrigger={$quiz.shuffleTrigger}
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
			currentMode={$quiz.currentMode}
			isComplete={$quiz.isComplete}
			on:giveup={() => {
				quiz.completeQuiz($user?.id, $user?.token);
				dispatch('giveup');
			}}
			onCompleteQuiz={() => quiz.completeQuiz($user?.id, $user?.token)}
			{isPartyMode}
		/>
	{/if}

	<div class="youtube-wrapper" id="player" style="width:1px; height:1px; overflow:hidden;"></div>
	{#if $quiz.isPractice}
		<Modal
			bind:show={$quiz.showModal}
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
			bind:show={$quiz.showModal}
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
