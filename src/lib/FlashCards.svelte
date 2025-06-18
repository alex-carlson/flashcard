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
		faRotateBack
	} from '@fortawesome/free-solid-svg-icons';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { fetchCollectionById } from './collections';
	import { completeQuiz } from '$lib/user';
	import { user } from '$stores/user';
	import { Modes } from './constants.js';
	import Modal from './Modal.svelte';
	import Card from './Card.svelte';
	import { mapCards } from '$lib/utils';
	import { getScoreMessage } from './quizScore';
	export let collection = null;
	export let author_id = null;
	export let isPartyMode = false;
	let author = null;
	let collectionId = null;
	let collectionName = null;
	let cards = [];
	let isGrid = false;
	let isFullscreen = false;
	let canReset = false;
	let shuffleTrigger = 0;
	let isComplete = false;
	let showModal = false;
	let currentMode = 'FILL_IN_THE_BLANK';

	const dispatch = createEventDispatcher();

	// function to fetch collection from id
	async function fetchCollection() {
		try {
			const data = await fetchCollectionById(author_id, collection);

			author = data.author;
			collectionId = data.id;
			collectionName = data.category;

			// if items length is 0, or is undefined, return
			if (!data.items || data.items.length === 0) {
				return;
			}

			cards = mapCards(data.items);
			// if isPartyMode, set mode to FILL_IN_THE_BLANK
			if (isPartyMode) {
				currentMode = 'FILL_IN_THE_BLANK';
			}
		} catch (error) {
			console.error('Error fetching collection:', error);
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
		console.log('Setting revealed for card at index:', index, 'to value:', value);
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

	function scaleCards(event) {
		const scaleValue = parseFloat(event.target.value); // Extract numeric value
		const grid = document.querySelector('.flashcards');
		const cards = document.querySelectorAll('.card');
		const answers = document.querySelectorAll('.card span');
		cards.forEach((card) => {
			if (isGrid) {
				card.style.width = `${300 * scaleValue}px`;
			} else {
				// set with auto
				card.style.width = 'auto';
			}
		});
		answers.forEach((answer) => {
			if (isGrid) {
				answer.style.fontSize = `${32 * scaleValue}px`;
			} else {
				// set with auto
				answer.style.fontSize = '32px';
			}
		});
		grid.style.setProperty('--card-size', `${300 * scaleValue}px`);
	}

	function selectOption(e, item) {
		const value = e.target.value; // Get the selected value

		if (value === 'Hide') {
			item.hidden = !item.hidden; // Toggle the hidden state
		} else if (value === 'Reset') {
			item.scale = 1; // Reset the scale
		} else if (value === 'Reveal') {
			item.revealed = true; // Reveal the answer
		}

		updateCards(); // Trigger reactivity to update the UI
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

	function onCompleteQuiz() {
		// show an alert with the number of correct answers
		const correctAnswers = cards.filter(
			(card) => card.revealed && card.userAnswer === card.answer
		).length;

		const percentage = Math.round((correctAnswers / cards.length) * 100);

		if ($user) {
			console.log('Completing quiz with content:', {
				userId: $user.id,
				collectionId,
				token: $user.token
			});
			completeQuiz($user.id, collectionId, percentage, $user.token);
		}

		showModal = true;
		isComplete = true;
	}

	onMount(() => {
		fetchCollection();
	});
</script>

<div class="container">
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
		<div class="headline padding">
			<h1>{collectionName}</h1>
			<p>
				by <a href={`/author/${author_id}`}>{author}</a>
			</p>
			{#if !isPartyMode}
				<select name="mode" id="mode" on:change={() => SetMode(event.target.value)}>
					{#each Object.keys(Modes) as mode}
						<option value={mode}>
							{Modes[mode]}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<div class={'flashcards padding ' + (isGrid ? 'grid' : 'vertical')}>
			{#each cards as item, i}
				<Card
					{item}
					{i}
					{cards}
					{currentMode}
					{isPartyMode}
					{shuffleTrigger}
					{onCardLoad}
					{toggleReveal}
					{selectOption}
					{updateCards}
					{onCompleteQuiz}
					on:correctAnswer={(e) => dispatch('correctAnswer', e.detail)}
				/>
			{/each}
		</div>
	{/if}

	{#if !isPartyMode && !isComplete}
		<div class="padding">
			<button class="give-up" on:click={onCompleteQuiz}>
				<span>Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" /></span>
			</button>
		</div>
	{/if}

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
					window.location.hash = '/leaderboard';
				},
				class: 'bg-blue-500 text-white'
			}
		]}
	/>
</div>
