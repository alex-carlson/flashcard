<script>
	import Fa from 'svelte-fa';
	import {
		faShuffle,
		faEyeSlash,
		faEye,
		faTableCells,
		faList,
		faExpand,
		faCompress,
		faPlus,
		faMinus,
		faFlag,
		faRotateBack,
		faArrowUp
	} from '@fortawesome/free-solid-svg-icons';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { fetchCollectionById } from './api/collections';
	import { completeQuiz, fetchUser } from '$lib/api/user';
	import { user } from '$stores/user';
	import { Modes } from './api/constants.js';
	import { addToast } from '$stores/toast';
	import Modal from './Modal.svelte';
	import Card from './Card.svelte';
	import Loading from './components/Loading.svelte';
	import { mapCards } from '$lib/api/utils';
	import { getScoreMessage } from './api/quizScore';
	export let collectionId = null;
	export let isPartyMode = false;

	let author_slug = null;
	let author = null;
	let collectionName = null;
	let collectionDescription = null;
	let collectionThumbnail = null;
	let cards = [];
	let isGrid = false;
	let isFullscreen = false;
	let canReset = false;
	let shuffleTrigger = 0;
	let isComplete = false;
	let showModal = false;
	let currentMode = 'FILL_IN_THE_BLANK';
	let isLoading = true;
	let loadingError = null;

	const dispatch = createEventDispatcher(); // function to fetch collection from id
	async function fetchCollection() {
		isLoading = true;
		loadingError = null;

		if (!collectionId) {
			loadingError = 'No collection ID provided';
			isLoading = false;
			addToast({
				type: 'error',
				message: 'No collection ID provided'
			});
			return;
		}

		try {
			const data = await fetchCollectionById(collectionId);

			if (!data) {
				console.error('No data returned from fetchCollectionById');
				loadingError = 'Collection not found';
				isLoading = false;
				addToast({
					type: 'error',
					message: 'Collection not found'
				});
				return;
			}

			const authorData = await fetchUser(data.author_public_id);

			author = authorData.username;
			author_slug = authorData.username_slug;
			collectionName = data.category;
			collectionDescription = data.description;
			collectionThumbnail = data.thumbnail;

			// set page tab title to collectionName
			document.title = `${collectionName} - ${author}`;

			// if items length is 0, or is undefined, return
			if (!data.items || data.items.length === 0) {
				console.log('No items found in collection');
				isLoading = false;
				addToast({
					type: 'warning',
					message: 'This collection has no items'
				});
				return;
			}

			cards = mapCards(data.items);

			// if isPartyMode, set mode to FILL_IN_THE_BLANK
			if (isPartyMode) {
				currentMode = 'FILL_IN_THE_BLANK';
			}

			isLoading = false;
		} catch (error) {
			console.error('Error fetching collection:', error);
			loadingError = error.message || 'Failed to fetch collection';
			isLoading = false;
			addToast({
				type: 'error',
				message: `Failed to fetch collection: ${error.message || 'Please try again later.'}`
			});
		}
	}

	function updateCards() {
		cards = [...cards];
		// can reset if either any card has a scale of something other than 1, or if any card has been hidden
		canReset = cards.some((card) => card.scale !== 1 || card.hidden);
	}

	function onCardLoad(index) {
		cards[index].loaded = true;
		updateCards();
	}

	export function setRevealed(index, value, playerId = null) {
		// get card at index and add the class "disabled"
		if (cards[index]) {
			cards[index].revealed = value;
			if (playerId) {
				cards[index].answerer = playerId; // store who answered the card
			}
			updateCards();
		}
	}

	function toggleReveal(index) {
		cards[index].revealed = !cards[index].revealed;
	}

	function shuffleCards() {
		// Fisher-Yates shuffle
		for (let i = cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[cards[i], cards[j]] = [cards[j], cards[i]];
		}

		// If needed to trigger reactivity (e.g., in a Svelte or React app)
		cards = [...cards]; // create a new array reference
		shuffleTrigger += 1;
	}

	function toggleCards() {
		const areAnyRevealed = areAnyCardsRevealed();
		// reset cards array
		cards = cards.map((card) => {
			card.revealed = !areAnyRevealed;
			return card;
		});
		//reload cards
		cards = [...cards];
	}

	function areAnyCardsRevealed() {
		return cards.some((card) => card.revealed);
	}

	function toggleGrid() {
		isGrid = !isGrid;
	}

	function scaleImage(amount) {
		cards = cards.map((card) => {
			card.scale += amount;
			// prevent scale from reaching 0
			if (card.scale < 0.1) {
				card.scale = 0.1;
			}
			return card;
		});
	}

	function resetImageScale() {
		cards = cards.map((card) => {
			card.scale = 1;
			return card;
		});
	}

	function goFullscreen() {
		// exit grid mode
		if (isGrid) {
			toggleGrid();
		}
		isFullscreen = true;
		const grid = document.querySelector('.container');
		if (grid.requestFullscreen) {
			grid.requestFullscreen();
		} else if (grid.webkitRequestFullscreen) {
			grid.webkitRequestFullscreen();
		} else if (grid.msRequestFullscreen) {
			grid.msRequestFullscreen();
		}
	}

	function exitFullscreen() {
		isFullscreen = false;
		// set zoom to 1
		resetImageScale();
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
	}

	function resetCards() {
		// loop through cards and reset visibility and scale
		cards = cards.map((card) => {
			card.hidden = false;
			card.scale = 1;
			return card;
		});
	}

	function SetMode(mode) {
		currentMode = mode;

		// force update cards
		cards = cards.map((card) => {
			card.revealed = false;
			return card;
		});

		console.log('Setting mode to:', currentMode);

		cards = [...cards];
	}

	function onCorrectAnswer(event) {
		const { index, answer } = event;
		console.log(event);
		cards[index].revealed = true;
		cards[index].userAnswer = answer;

		console.log('Correct answer for card at index:', index, 'with answer:', answer);

		// Check if all cards are answered
		if (cards.every((card) => card.revealed)) {
			onCompleteQuiz();
		}
		dispatch('correctAnswer', event.detail);
	}

	function onCompleteQuiz() {
		// show an alert with the number of correct answers
		console.log('Quiz completed, calculating score...');
		const correctAnswers = cards.filter(
			(card) => card.revealed && card.userAnswer === card.answer
		).length;

		const percentage = Math.round((correctAnswers / cards.length) * 100);

		if ($user) {
			completeQuiz($user.id, collectionId, percentage, $user.token);
		}

		showModal = true;
		isComplete = true;
	}
	onMount(() => {
		if (collectionId) {
			fetchCollection();
		}
	});
	// Reactive statement to watch for collectionId changes
	$: if (collectionId && !cards.length) {
		fetchCollection();
	}
</script>

<div class="container white pt-3">
	{#if isLoading}
		<Loading />
	{:else if loadingError}
		<div class="error-container">
			<p>Error: {loadingError}</p>
			<button on:click={fetchCollection} class="retry-button">
				<Fa icon={faRotateBack} />
				Retry
			</button>
		</div>
	{:else}
		{#if !isPartyMode}
			<div class="toolbar">
				<button on:click={shuffleCards}>
					<Fa icon={faShuffle} />
				</button>
				<button on:click={toggleCards}>
					<Fa icon={areAnyCardsRevealed() ? faEyeSlash : faEye} />
				</button>
				{#if canReset}
					<button on:click={resetCards}>
						<Fa icon={faRotateBack} />
					</button>
				{/if}
				{#if isFullscreen}
					<button on:click={() => scaleImage(-0.25)}>
						<Fa icon={faMinus} />
					</button>
					<button on:click={() => scaleImage(0.25)}>
						<Fa icon={faPlus} />
					</button>
				{:else}
					<button on:click={toggleGrid}>
						<Fa icon={isGrid ? faList : faTableCells} />
					</button>
				{/if}
				<button on:click={isFullscreen ? exitFullscreen : goFullscreen}>
					<Fa icon={isFullscreen ? faCompress : faExpand} />
				</button>
			</div>
		{/if}

		{#if cards.length > 0}
			<div class="headline my-3">
				{#if collectionThumbnail}
					<div class="thumbnail">
						<img src={collectionThumbnail} alt={collectionName} />
					</div>
				{/if}
				<div class="details">
					<h1>{collectionName}</h1>
					<p>
						by <a href={`/author/${author_slug}`}>{author}</a>
					</p>
				</div>
				{#if collectionDescription && collectionDescription.length > 0}
					<p class="description">{collectionDescription}</p>
				{/if}
			</div>
			{#if !isPartyMode}
				<select class="mt-3" name="mode" id="mode" on:change={() => SetMode(event.target.value)}>
					{#each Object.keys(Modes) as mode}
						<option value={mode}>
							{Modes[mode]}
						</option>
					{/each}
				</select>
			{/if}

			<div class={'flashcards ' + (isGrid ? 'grid' : 'vertical')}>
				{#each cards as item, i}
					<Card
						{item}
						{i}
						{cards}
						{currentMode}
						{shuffleTrigger}
						{onCardLoad}
						{toggleReveal}
						{updateCards}
						on:correctAnswer={(e) => onCorrectAnswer({ index: i, answer: cards[i].answer })}
						on:giveUp={(e) => setRevealed(e.detail.index, true)}
					/>
				{/each}
			</div>
			{#if !isPartyMode && !isComplete}
				<div class="py-3" style="display: flex; gap: 4px; flex-direction: column;">
					{#if currentMode === 'FILL_IN_THE_BLANK'}
						<button class="give-up" on:click={onCompleteQuiz}>
							<span>Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" /></span>
						</button>
					{:else}
						<button
							class="scroll-to-top"
							on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
						>
							<span>Scroll to Top <Fa icon={faArrowUp} style="margin-left: 0.5rem" /></span>
						</button>
					{/if}
				</div>
			{/if}
		{:else if !isLoading && !loadingError}
			<div class="empty-state">
				<p>No cards available in this collection.</p>
			</div>
		{/if}
	{/if}

	<div class="youtube-wrapper" id="player" style="width:1px; height:1px; overflow:hidden;"></div>
	<Modal
		bind:show={showModal}
		title="Quiz Completed"
		message={getScoreMessage(
			Math.round(
				(cards.filter((card) => card.revealed && card.userAnswer === card.answer).length /
					cards.length) *
					100
			)
		)}
		effect={cards.every((card) => card.revealed) ? 'confetti' : 'none'}
		onClose={() => {
			showModal = false;
			// reveal all cards
			cards = cards.map((card) => {
				if (card.userAnswer !== card.answer) {
					card.incorrect = true;
				}
				card.revealed = true;
				return card;
			});
		}}
		buttons={[
			{
				text: 'Close',
				action: () => {
					showModal = false;
					// reveal all cards
					cards = cards.map((card) => {
						if (card.userAnswer !== card.answer) {
							card.incorrect = true;
						}
						card.revealed = true;
						return card;
					});
				},
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

<style>
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #dc3545;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.retry-button:hover {
		background-color: #0056b3;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
	}
</style>
