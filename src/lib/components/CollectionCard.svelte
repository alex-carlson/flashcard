<script>
	export let collection;
	export let onNavigate = null; // Allow parent to override navigation
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { goto } from '$app/navigation';

	function defaultGotoPageWithState(authorId, slug) {
		const url = `/quiz/${authorId}/${slug}`;
		console.log('Navigating to:', url);
		// Set the state with the collection ID
		const state = { collectionId: collection.id };
		console.log('State:', state);
		goto(url, { state });
	}

	function handleNavigation() {
		if (onNavigate) {
			// Use parent's navigation function if provided
			onNavigate(collection);
		} else {
			// Use default navigation
			defaultGotoPageWithState(collection.author_public_id, collection.slug);
		}
	}
</script>

<li>
	<a
		class="collection-card-link"
		href="/quiz/{collection.author_public_id}/{collection.slug}"
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
