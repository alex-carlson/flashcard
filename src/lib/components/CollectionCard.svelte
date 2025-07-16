<script>
	export let collection;
	export let onNavigate = null; // Allow parent to override navigation
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { goto } from '$app/navigation';
	import { fetchUser } from '$lib/api/user';

	async function defaultGotoPageWithState(author_id, slug) {
		try {
			const user = await fetchUser(author_id);
			const author_slug = user.username_slug || user.username || 'unknown-author';
			const url = `/quiz/${author_slug}/${slug}`;
			const state = { collectionId: collection.id };

			goto(url, { state });
		} catch (error) {
			console.error('Error fetching user for navigation:', error);
			const url = `/quiz/unknown-author/${slug}`;

			const state = { collectionId: collection.id };
			goto(url, { state });
		}
	}

	function handleNavigation() {
		if (onNavigate) {
			onNavigate(collection);
		} else {
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
		<div class="card-content p-3">
			<h2 class="card-title">{collection.category}</h2>
			<div class="card-meta">
				<span class="card-questions">{collection.itemsLength} questions</span>
				<span class="card-date">{formatTimestamp(collection.created_at)}</span>
			</div>
		</div>
	</a>
</li>

<style>
	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		height: 100%;
	}

	.card-meta {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.collection-card-link {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
</style>
