<script>
	import { onMount, onDestroy } from 'svelte';
	import { socket, disconnectSocket } from '$stores/socket.js';
	import { user } from '$stores/user.js';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import FlashCards from '$lib/FlashCards.svelte';
	import Search from '$lib/Search.svelte';
	import RandomItems from '$lib/RandomItems.svelte';
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { faFlag } from '@fortawesome/free-solid-svg-icons';
	import { addToast } from '$stores/toast.js';
	import Fa from 'svelte-fa';

	let party_id = null;
	let partyData = null;
	let author_id = null;
	let authorName = null; // Assuming you might want to display the author's name
	let collectionName = null; // Assuming you might want to display the collection name
	let slug = null;
	let flashCardsRef;
	let isHost = false;
	let collection = null;
	let socketInstance = null;

	// Subscribe to socket store
	const unsubscribeSocket = socket.subscribe((instance) => {
		socketInstance = instance;
	});

	// Subscribe to user store (if you need user info here)
	let currentUser;
	const unsubscribeUser = user.subscribe((u) => {
		currentUser = u;
	});

	function startGame() {
		if (!partyData || !isHost) return;

		partyData.isStarted = true;

		socketInstance.emit('start-game', party_id);
	}

	// Setup socket event listeners when socket is ready
	function setupSocketListeners() {
		if (!socketInstance) return;

		// Remove any previous listeners to avoid duplicates
		socketInstance.off('room-update');
		socketInstance.off('game-started');

		socketInstance.on('room-update', (room) => {
			console.log('Room updated:', room);
			// if room.collectionId changed, fetch collection info
			if (room.collectionId && room.collectionId !== partyData?.collectionId) {
				// getCollectionInformation(room.collectionId);
			}
			partyData = {
				...partyData,
				...room
			};
			updatePre();
		});

		socketInstance.on('game-started', (data) => {
			console.log('Game started:', data);
			partyData = { ...partyData, isStarted: true };
			updatePre();
		});

		socketInstance.on('score-updated', (data) => {
			const { scores: newScores, cardIndex, playerId: pID, cards } = data;

			// Merge new scores
			partyData = {
				...partyData,
				scores: {
					...(partyData.scores || {}),
					...newScores
				},
				cards: cards || partyData.cards || []
			};

			// Sort players by score descending
			if (partyData.scores && partyData.players) {
				partyData.players = [...partyData.players].sort(
					(a, b) => (partyData.scores[b] || 0) - (partyData.scores[a] || 0)
				);
			}

			// loop through partyData.cards
			if (partyData.cards && partyData.cards.length > 0) {
				// for each card, call flashCardsRef.setRevealed(key, true, val)
				partyData.cards.forEach((key, index) => {
					console.log('Setting card revealed:', key, index);
					flashCardsRef.setRevealed(key, true, index);
				});
			}

			updatePre();

			if (flashCardsRef) {
				flashCardsRef.setRevealed(cardIndex, true, pID);
			} else {
				// try to set the ref
				console.warn('FlashCards reference not ready yet');
			}
		});

		socketInstance.on('player-gave-up', (data) => {
			const { playerId, finishedPlayers } = data;
			console.log('Player gave up:', playerId);
			// set partyData.finishedPlayers to the new array
			partyData = {
				...partyData,
				finishedPlayers: finishedPlayers || []
			};

			updatePre();
		});

		socketInstance.on('game-finished', () => {
			console.log('Game finished');
			// Handle game finish logic here, e.g., show results or reset state
			partyData = {
				...partyData,
				isStarted: false,
				isFinished: true,
				finishedPlayers: []
			};
			updatePre();
		});

		socketInstance.on('room-closed', () => {
			console.log('Room closed');
			// Handle room closed logic here, e.g., redirect or show message
			partyData = null;
			document.title = 'Party Closed';
			updatePre();
			window.location.hash = '/party';
		});

		socketInstance.on('room-reset', (data) => {
			console.log('Room reset:', data);
			// Reset partyData to initial state
			partyData = {
				...partyData,
				isStarted: false,
				isFinished: false,
				scores: {},
				finishedPlayers: [],
				collectionId: data.collectionId || null
			};
			updatePre();
		});

		socketInstance.on('collection-changed', (data) => {
			console.log('Collection changed:', data);
			// updated partydata with data
			partyData = {
				...partyData,
				...data
			};
			updatePre();
		});
	}

	function updatePre() {
		// This function is not used in the current code, but can be used to update the pre element
		// if needed in the future.
		const preElement = document.getElementById('party-data');
		if (preElement) {
			preElement.textContent = JSON.stringify(partyData, null, 2);
		}
	}

	onMount(() => {
		async function init() {
			const params = get(page).params;

			if (params && params.party_id) {
				party_id = params.party_id;
				await getPartyData(party_id);
			}

			// Wait for socket instance to be ready, then setup listeners & join room
			const waitForSocket = setInterval(() => {
				if (socketInstance) {
					setupSocketListeners();
					clearInterval(waitForSocket);
				}
			}, 100);
		}

		init();
	});

	onDestroy(() => {
		if (socketInstance) {
			disconnectSocket();
		}

		unsubscribeSocket();
		unsubscribeUser();
	});

	async function getPartyData(party_id) {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/party/${party_id}`);
			const data = await response.json();
			console.log('Party data:', data);
			document.title = `Party - ${data.name || 'Unknown Party'}`;
			partyData = data;
			console.log('Party data fetched:', partyData);
			updatePre();

			partyData.hostId = data.hostId;
			partyData.collectionId = data.collectionId;
		} catch (error) {
			console.error('Error fetching party data:', error);
			addToast({
				type: 'error',
				message: 'Failed to fetch party data. Please try again later.'
			});
		}
	}

	function scorePoint(cardIndex) {
		// If cardIndex is an object with an 'index' property, extract it
		const idx =
			typeof cardIndex === 'object' && cardIndex !== null && 'index' in cardIndex
				? cardIndex.index
				: cardIndex;
		socketInstance.emit('score-point', {
			code: party_id,
			playerId: currentUser?.id || localStorage.getItem('playerId'),
			cardIndex: idx
		});
	}

	function giveUp() {
		socketInstance.emit('give-up', {
			code: party_id,
			playerId: currentUser?.id || localStorage.getItem('playerId')
		});
	}

	// Reactive update if route param changes
	$: {
		const params = get(page).params;

		if (params?.party_id && params.party_id !== party_id) {
			party_id = params.party_id;
			getPartyData(party_id);

			// Rejoin the new room if socket is connected
			if (socketInstance) {
				socketInstance.emit('join-room', { code: party_id });
			}
		}
	}

	$: isHost = currentUser?.id && partyData?.hostId && currentUser.id === partyData.hostId;
</script>

<div class="container white partymode">
	<div class="padding">
		<pre class="debug-box padding" id="party-data"></pre>
		<h1 class="room-label">{party_id}</h1>

		<!-- Connected players -->
		{#if partyData?.players?.length > 0 && !partyData.isStarted}
			<p>Connected players:</p>
			<ul class="players-list">
				{#each partyData.players as player}
					<li><ProfilePicture userId={player} size={32} /></li>
				{/each}
			</ul>
		{/if}

		<!-- Category Picker -->
		{#if partyData && !partyData.isStarted && !partyData.isFinished}
			<div class="categoryPicker padding">
				{#if isHost}
					<Search
						on:SearchItemClicked={(e) => {
							collection = e.detail;
						}}
					/>
					<h3>Not sure what to pick?</h3>
					<p>How about one of these?</p>
					<RandomItems
						onCollectionClick={(e) => {
							socketInstance.emit('set-collection', {
								code: party_id,
								collectionId: e.id
							});
						}}
					/>
				{:else if collectionName}
					<h3>Category: {collectionName}</h3>
					<p>Author: {authorName}</p>
				{:else}
					<p>No category selected yet.</p>
				{/if}
			</div>
		{/if}

		<!-- Start Game Button -->
		{#if isHost && partyData && !partyData.isStarted && !partyData.isFinished && partyData.collectionId}
			<button class="button" on:click={startGame}>Start Game</button>
		{/if}

		<!-- Game Finished -->
		{#if partyData?.isFinished}
			<h2>That's a wrap!</h2>
			<ul class="final-scores-list padding">
				{#each partyData.players as playerId}
					<li>
						<ProfilePicture userId={playerId} size={32} />
						<span>{partyData.scores[playerId] || 0}</span>
					</li>
				{/each}
			</ul>

			{#if isHost}
				<div class="button-group">
					<button class="button" on:click={() => socketInstance.emit('close-room', party_id)}>
						Close Lobby
					</button>
					<button class="button" on:click={() => socketInstance.emit('reset-room', party_id)}>
						New Category
					</button>
				</div>
			{/if}
		{/if}

		<!-- Game In Progress -->
		{#if partyData?.isStarted && !partyData.isFinished}
			<ul class="scores-list padding">
				{#each Object.entries(partyData.scores) as [playerId, score]}
					<li class:finishedPlayer={partyData.finishedPlayers?.includes(playerId)}>
						<ProfilePicture userId={playerId} size={32} />
						<span>{score}</span>
					</li>
				{/each}
			</ul>

			<FlashCards
				collectionId={partyData.collectionId}
				isPartyMode={true}
				bind:this={flashCardsRef}
				on:correctAnswer={(e) => scorePoint(e.detail)}
			/>

			<button class="button" on:click={giveUp}>
				Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" />
			</button>
		{/if}

		<!-- Waiting State -->
		{#if partyData && !partyData.isStarted && !partyData.isFinished}
			{#if isHost && !partyData.collectionId}
				<p>Select a category to start the match</p>
			{:else if !isHost}
				<p>The game has not started yet. Waiting for the host to start...</p>
			{/if}
		{/if}
	</div>
</div>
