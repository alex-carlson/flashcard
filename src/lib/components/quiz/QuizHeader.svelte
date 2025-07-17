<script>
	export let collectionName, author, authorSlug, thumbnail, description;
</script>

<div class="headline my-3">
	{#if thumbnail}
		<div class="thumbnail">
			<img src={thumbnail} alt={collectionName} />
		</div>
	{/if}
	<div class="details">
		<h1>{collectionName}</h1>
		<p>by <a href={`/author/${authorSlug}`}>{author}</a></p>
	</div>
	{#if description}
		<p class="description">{description}</p>
	{/if}
</div>
