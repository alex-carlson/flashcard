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
	let imageOptions = 'format=webp,anim=false,fit=cover,quality=75,width=288,height=288/';

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
		window.addEventListener('resize', resizeText);
	});

	afterUpdate(() => {
		resizeText();
	});
</script>

<li>
	{#if collection}
		<a
			class="collection-card-link"
			href="/quiz/{collection.profiles.username}/{collection.slug}"
			on:click|preventDefault={handleNavigation}
		>
			<div class="card-image-container">
				{#if collection.items_length > 0 && collection.thumbnail_url}
					<img
						src={collection.thumbnail_url.replace(
							'https://media.quizzems.com/',
							'https://media.quizzems.com/cdn-cgi/image/' + imageOptions
						)}
						alt="Thumbnail"
						class="img-fluid"
					/>
				{/if}
			</div>
			<div class="card-content pb-2">
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
					{#if showAuthor && collection.profiles}
						<span class="card-author">
							by {collection.profiles.username || collection.profiles.public_id}
						</span>
					{/if}
				</div>
			</div>
		</a>
	{:else}
		<a class="collection-card-link placeholder" href="#">
			<div class="card-image-container">
				<img src="../loading-spinner.png" alt="placeholder image" class="img-fluid shimmer" />
			</div>
			<div class="card-content pb-2">
				<div class="fit-text-container">
					<h2>asdf</h2>
				</div>
				<div class="card-meta">
					<span class="card-questions">30</span>
					<span class="card-date">11/1/2011</span>
				</div>
			</div>
		</a>
	{/if}
</li>

<style>
	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.card-meta {
		display: flex;
		gap: 10px;
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

	.card-image-container {
		position: relative;
		width: 100%;
		aspect-ratio: 5 / 4;
		height: auto;
		min-height: 180px;
		max-height: 400px;
		overflow: hidden;
		background: #f8f9fa;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image-container img {
		max-width: 100%;
		max-height: 100%;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}

	.placeholder .img-fluid {
		width: 100%;
		height: 100%;
		background-color: gray;
	}

	.placeholder .fit-text-container,
	.placeholder .card-meta {
		width: 100%;
	}

	.placeholder h2,
	.placeholder span {
		background-color: gray;
		color: gray;
		border-radius: 15px;
		width: 100%;
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

	@media (max-width: 600px) {
		.card-image-container {
			width: 80px;
			height: 80px;
			min-width: 80px;
			min-height: 80px;
			aspect-ratio: unset;
		}
	}
</style>
