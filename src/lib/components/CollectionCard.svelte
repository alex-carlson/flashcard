<script>
	export let collection;
	export let onNavigate = null; // Allow parent to override navigation
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { goto } from '$app/navigation';
	import { fetchUser } from '$lib/api/user';

	async function defaultGotoPageWithState(author_id, slug) {
		console.log('Default navigation function called with:', { author_id, slug });

		try {
			// Wait for the user data to be fetched
			const user = await fetchUser(author_id);
			const author_slug = user.username_slug || user.username || 'unknown-author';

			const url = `/quiz/${author_slug}/${slug}`;
			console.log('Navigating to:', url);

			// Set the state with the collection ID
			const state = { collectionId: collection.id };
			console.log('State:', state);

			goto(url, { state });
		} catch (error) {
			console.error('Error fetching user for navigation:', error);
			// Fallback navigation with unknown author
			const url = `/quiz/unknown-author/${slug}`;
			console.log('Fallback navigation to:', url);

			const state = { collectionId: collection.id };
			goto(url, { state });
		}
	}

	function handleNavigation() {
		if (onNavigate) {
			// Use parent's navigation function if provided
			onNavigate(collection);
		} else {
			// Use default navigation (now properly async)
			console.log('default navigating with collection:', collection);
			defaultGotoPageWithState(collection.author_public_id, collection.slug);
		}
	}
</script>

<li>
	<a
		class="collection-card-link"
		href="/quiz/{collection.author}/{collection.slug}"
		on:click|preventDefault={handleNavigation}
	>
		<div class="card-image-container">
			{#if collection.itemsLength > 0}
				<LazyLoadImage imageUrl={collection.thumbnail} tempSize="100%" class="card-image" />
			{:else}
				<div class="card-image placeholder"></div>
			{/if}
		</div>
		<div class="card-content">
			<h2 class="card-title">{collection.category}</h2>
			<div class="card-meta">
				<span class="card-questions">{collection.itemsLength} questions</span>
				<span class="card-date">{formatTimestamp(collection.created_at)}</span>
			</div>
		</div>
	</a>
</li>
