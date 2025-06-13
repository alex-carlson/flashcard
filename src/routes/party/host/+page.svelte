<script>
	import { onDestroy, onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import Search from '$lib/Search.svelte';
	import { socket, initSocket } from '$stores/socket.js';
	import RandomItems from '$lib/RandomItems.svelte';
	import { user } from '$stores/user.js';
	import { get } from 'svelte/store';

	let collection = null;
	let userId = null;

	const unsubscribeUser = user.subscribe((u) => {
		userId = u?.id ?? null;
	});

	onMount(() => {
		document.title = 'Host a Match';
	});

	onDestroy(() => {
		unsubscribeUser();
	});

	async function createRoom() {
		console.log('Creating room with collection:', collection);

		const currentUser = get(user);
		const token = currentUser?.token;

		if (!token) {
			console.error('No auth token available.');
			return;
		}

		// Initialize socket with token (assuming this sets the socket store)
		initSocket(token);

		// Wait for the socket instance from the store to be available
		const socketInstance = await new Promise((resolve, reject) => {
			const unsubscribe = socket.subscribe((instance) => {
				if (instance) {
					unsubscribe();
					resolve(instance);
				}
			});

			// Optional: timeout after 5 seconds to avoid hanging indefinitely
			setTimeout(() => {
				unsubscribe();
				reject(new Error('Socket initialization timeout'));
			}, 5000);
		}).catch((err) => {
			console.error('Failed to get socket instance:', err.message);
			return null;
		});

		if (!socketInstance) return; // Exit if no socket

		// Attach connection event handlers immediately
		socketInstance.on('connect', () => {
			console.log('Socket connected:', socketInstance.id);
		});
		socketInstance.on('connect_error', (err) => {
			console.error('Socket connection error:', err.message);
		});

		// Ensure userId is loaded
		if (!userId) {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (error || !data?.session) {
					console.error('[Host Page] Session error:', error?.message || 'No session found');
					return;
				}
				userId = data.session.user.id;
			} catch (err) {
				console.error('Failed to get session:', err);
				return;
			}
		}

		// Emit create-room event with payload
		socketInstance.auth = { token };
		socketInstance.emit('create-room', {
			collectionId: collection.id
		});

		// Listen once for room-created event and handle navigation
		socketInstance.once('room-created', ({ code, room }) => {
			console.log('Room created:', code, room);
			try {
				window.location.href = `/party/${code}`;
			} catch (err) {
				console.error('Failed during room creation navigation:', err);
			}
		});
	}
</script>

<div class="container white">
	<h1>Room Setup</h1>
	<div class="categoryPicker padding">
		<Search
			on:SearchItemClicked={(e) => {
				collection = e.detail;
				document.title = `Create a match - ${collection.category}`;
			}}
		/>

		{#if collection}
			<div class="roomSetup">
				<div class="collection">
					{#if collection.items.length > 0}
						<img
							src={collection.items[0].image}
							alt={collection.category}
							class="collection-image"
						/>
					{/if}
					<h3>{collection.category}</h3>
					<p>Author: {collection.author}</p>
				</div>
			</div>
		{:else}
			<h3>Not sure what to pick?</h3>
			<p>How about one of these?</p>
			<RandomItems
				onCollectionClick={(e) => {
					console.log(e);
					collection = e;
					document.title = `Create a match - ${collection.category}`;
				}}
			/>
		{/if}
		{#if collection}
			<button class="button" on:click={createRoom}> Create Room </button>
		{/if}
	</div>
</div>
