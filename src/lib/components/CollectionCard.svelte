<script>
	export let collection;
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
</script>

<li>
	<a class="collection-card-link" href="/quiz/{collection.author_public_id}/{collection.slug}">
		<div class="collection-card">
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
		</div>
	</a>
</li>
