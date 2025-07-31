<script>
	import FlashCards from '$lib/FlashCards.svelte';
	export let data;
	const { category, thumbnail, collectionId, author } = data;
</script>

<svelte:head>
	{#if category && author}
		<title>{category} by {author}!</title>
		<meta property="og:title" content="Play {category} by {author}!" />
		<meta name="twitter:title" content="Play {category} by {author}!" />
		{#if thumbnail}
			<meta property="og:image" content={thumbnail} />
			<meta name="twitter:image" content={thumbnail} />
		{/if}
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

<div>
	<FlashCards {collectionId} />
</div>
