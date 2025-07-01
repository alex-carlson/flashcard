<script>
	export let collection;
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
</script>

<li>
	<a class="collection-card-link" href="/quiz/{collection.author_public_id}/{collection.slug}">
		<div class="collection-card">
			<div class="card-image-container">
				{#if collection.items.length > 0}
					<LazyLoadImage
						imagePath={`${collection.author}/${collection.category}/thumbnail.jpg`}
						imageUrl={collection.items[0].image}
						tempSize="100%"
						class="card-image"
					/>
				{:else}
					<div class="card-image placeholder"></div>
				{/if}
			</div>
			<div class="card-content">
				<h2 class="card-title">{collection.category}</h2>
				{#if collection.description}
					<p class="card-description">{collection.description}</p>
				{/if}
				<div class="card-meta">
					<span class="card-questions">{collection.items.length} questions</span>
					<span class="card-date">{formatTimestamp(collection.created_at)}</span>
				</div>
			</div>
		</div>
	</a>
</li>
