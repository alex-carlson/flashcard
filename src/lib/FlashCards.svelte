<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { user } from '$stores/user';
	import { youtubePlayerService } from './api/youtubePlayer.js';
	import { getScoreMessage } from './api/quizScore';
	import { createQuizStore } from '$stores/quiz';

	// Components
	import Modal from './Modal.svelte';
	import Card from './Card.svelte';
	import Loading from './components/Loading.svelte';
	import Toolbar from './components/quiz/Toolbar.svelte';
	import QuizHeader from './components/quiz/QuizHeader.svelte';
	import QuizActions from './components/quiz/QuizActions.svelte';
	import ErrorDisplay from './components/quiz/ErrorDisplay.svelte';
	// Props
	export let collectionId = null;
	export let isPartyMode = false;

	// Initialize quiz store
	const quiz = createQuizStore();
	const { stats } = quiz;
	const dispatch = createEventDispatcher();

	// Auto-trigger completion when all cards are revealed
	$: if ($stats.isComplete && !$quiz.showModal && !$quiz.isComplete) {
		quiz.completeQuiz($user?.id, $user?.token);
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
		// Override for party mode
		if (isPartyMode && mode !== 'FILL_IN_THE_BLANK') {
			quiz.update((state) => ({ ...state, currentMode: 'FILL_IN_THE_BLANK' }));
		}
	}
	function onCorrectAnswer(event) {
		const { index, answer } = event;
		quiz.updateCard(index, {
			revealed: true,
			userAnswer: answer
		});

		// Check if all cards are answered
		if ($quiz.cards.every((card) => card.revealed)) {
			quiz.completeQuiz($user?.id, $user?.token);
		} else {
			// Auto-play next audio question
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
		}

		dispatch('correctAnswer', event.detail);
	}

	function retryFetch() {
		quiz.retry();
		quiz.loadCollection(collectionId);
	}
	// Lifecycle
	onMount(() => {
		if (collectionId && !$quiz.hasInitialized) {
			quiz.loadCollection(collectionId);
		}
	});

	// Reactive statement to watch for collectionId changes
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

		{#if !isPartyMode}
			<select class="mt-3" name="mode" id="mode" on:change={(e) => setMode(e.target.value)}>
				{#each Object.entries( { FILL_IN_THE_BLANK: 'Fill in the Blank', MULTIPLE_CHOICE: 'Multiple Choice', FLASHCARD: 'Flashcard' } ) as [mode, label]}
					<option value={mode} selected={mode === $quiz.currentMode}>
						{label}
					</option>
				{/each}
			</select>
		{/if}

		<div class={'flashcards ' + ($quiz.isGrid ? 'grid' : 'vertical')}>
			{#each $quiz.cards as item, i (item.id || i)}
				<Card
					{item}
					{i}
					cards={$quiz.cards}
					currentMode={$quiz.currentMode}
					shuffleTrigger={$quiz.shuffleTrigger}
					{onCardLoad}
					{toggleReveal}
					updateCards={() => {}}
					on:correctAnswer={(e) => onCorrectAnswer({ index: i, answer: $quiz.cards[i].answer })}
					on:giveUp={(e) => setRevealed(e.detail.index, true)}
				/>
			{/each}
		</div>

		<QuizActions
			currentMode={$quiz.currentMode}
			isComplete={$quiz.isComplete}
			onCompleteQuiz={() => quiz.completeQuiz($user?.id, $user?.token)}
			{isPartyMode}
		/>
	{:else if !$quiz.isLoading && !$quiz.loadingError}
		<div class="empty-state">
			<p>No cards available in this collection.</p>
		</div>
	{/if}

	<div class="youtube-wrapper" id="player" style="width:1px; height:1px; overflow:hidden;"></div>
	<Modal
		bind:show={$quiz.showModal}
		title="Quiz Completed"
		message={getScoreMessage($stats.percentage)}
		effect={$stats.isComplete ? 'confetti' : 'none'}
		onClose={() => quiz.closeModal()}
		buttons={[
			{
				text: 'Close',
				action: () => quiz.closeModal(),
				class: 'bg-gray-300 text-black'
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
</div>
