<script>
	export let collection = null;
	export let onNavigate = null; // Allow parent to override navigation
	export let showTags = false;
	export let showAuthor = false;
	export let showIsVisible = false;
	export let showDate = true;
	import { formatTimestamp } from '$lib/api/utils.js';
	import LazyLoadImage from '$lib/LazyLoadImage.svelte';
	import { goto } from '$app/navigation';
	import { fetchUser } from '$lib/api/user';
	import { afterUpdate, onMount } from 'svelte';
	import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	let titleEl;
	let tagCount = 0;
	let scale = 1;

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

	function resizeText() {
		if (!titleEl) return;

		const container = titleEl.parentElement;
		const containerWidth = container.offsetWidth;
		const containerHeight = container.offsetHeight;
		const contentWidth = titleEl.scrollWidth;
		const contentHeight = titleEl.scrollHeight;

		const widthScale = containerWidth / contentWidth;
		const heightScale = containerHeight / contentHeight;

		scale = Math.min(widthScale, heightScale, 1);
	}

	onMount(() => {
		resizeText();
		tagCount = collection?.tags ? collection.tags.split(',').length : 0;
		console.log('collection data:', collection);
		window.addEventListener('resize', resizeText);
	});

	afterUpdate(() => {
		resizeText();
	});
</script>

<li class="pb-2">
	{#if collection}
		<a
			class="collection-card-link"
			href="/quiz/{collection.profiles.username}/{collection.slug}"
			on:click|preventDefault={handleNavigation}
		>
			<div class="card-image-container">
				{#if collection.items_length > 0}
					<LazyLoadImage imageUrl={collection.thumbnail_url} tempSize="100%" />
				{/if}
			</div>
			<div class="card-content">
				<div class="fit-text-container">
					<h2 bind:this={titleEl} class="fit-text">{collection.category}</h2>
				</div>

				<div class="card-meta">
					{#if showTags}
						<span class="card-meta-item">
							{tagCount}
							{tagCount === 1 ? 'tag' : 'tags'}
						</span>
					{/if}
					<span class="card-questions">{collection.items_length || 0} questions</span>
					{#if showDate}
						<span class="card-date">{formatTimestamp(collection.created_at)}</span>
					{/if}
					{#if showIsVisible}
						<span class="card-visibility">
							{#if collection.private}
								<Fa icon={faEyeSlash} />
								Private
							{:else}
								<Fa icon={faEye} />
								Public
							{/if}
						</span>
					{/if}
				</div>
			</div>
		</a>
	{:else}
		<div class="placeholder-card">
			<div class="card-image-container">
				<div class="card-image placeholder shimmer"></div>
			</div>
			<div class="card-content">
				<h2 class="card-title shimmer placeholder fit-title" style="width: 80%; height: 1.5em"></h2>
				<div class="card-meta wd-100 mt-2" style="width: 100%;">
					<span class="card-questions shimmer placeholder" style="width: 40%; height: 1em;"></span>
					<span class="card-date shimmer placeholder" style="width: 30%; height: 1em;"></span>
				</div>
			</div>
		</div>
	{/if}
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
		transition:
			transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
	}

	.card-image-container img,
	:global(.card-image-container) :global(img) {
		max-height: 180px;
		width: auto;
		height: auto;
		display: block;
		margin: 0 auto;
	}

	.card-image.placeholder {
		width: 100%;
		aspect-ratio: 4 / 3;
		background-color: #e0e0e0;
		display: block;
		border-radius: 0.5em;
		position: relative;
		overflow: hidden;
	}

	.placeholder {
		border-radius: 0.3em;
	}

	.fit-text-container {
		height: 3em; /* Fixed height */
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.fit-text {
		margin: 0;
		white-space: normal;
		transform-origin: center center;
		display: inline-block;
		transform: scale(var(--scale));
		font-size: 1.3rem;
		line-height: 1.2;
		text-align: center;
		max-width: 100%;
		--scale: 1;
	}

	/* We use inline style to apply scale dynamically */
	:global(.fit-text) {
		transform: scale(var(--scale));
	}
</style>
