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
	import {
		faEye,
		faEyeSlash,
		faListOl,
		faCalendar,
		faChartSimple,
		faCircleQuestion,
		faFolderOpen,
		faPencil
	} from '@fortawesome/free-solid-svg-icons';
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

<li class="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 mb-3 mb-md-4 w-100">
	{#if collection}
		<a
			class="collection-card-link card border-0 shadow-sm w-100"
			class:h-100={false}
			class:mobile-card={true}
			href="/quiz/{collection.profiles.username}/{collection.slug}"
			on:click|preventDefault={handleNavigation}
		>
			<!-- Mobile horizontal layout -->
			<div class="d-flex d-sm-none align-items-stretch w-100">
				<div class="mobile-thumbnail">
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
				<div class="flex-grow-1 d-flex flex-column justify-content-center px-3">
					<h2 class="mobile-title text-center mb-1">{collection.category}</h2>
					<div class="mobile-meta d-flex justify-content-center gap-2 small text-muted">
						<span class="d-flex align-items-center gap-1">
							<Fa icon={faPencil} size="xs" />
							{collection.items_length || 0}
						</span>
						{#if showDate}
							<span class="d-flex align-items-center gap-1">
								<Fa icon={faCalendar} size="xs" />
								{formatTimestamp(collection.created_at).split('/').slice(0, 2).join('/')}
							</span>
						{/if}
						{#if collection.times_played}
							<span class="d-flex align-items-center gap-1">
								<Fa icon={faChartSimple} size="xs" />
								{collection.times_played > 999
									? Math.floor(collection.times_played / 1000) + 'k'
									: collection.times_played}
							</span>
						{/if}
						{#if showIsVisible}
							<span class="d-flex align-items-center">
								{#if collection.private}
									<Fa icon={faEyeSlash} size="xs" />
								{:else}
									<Fa icon={faEye} size="xs" />
								{/if}
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Desktop vertical layout -->
			<div class="d-none d-sm-flex flex-column h-100 w-100">
				<div class="card-image-container position-relative overflow-hidden">
					{#if collection.items_length > 0 && collection.thumbnail_url}
						<img
							src={collection.thumbnail_url.replace(
								'https://media.quizzems.com/',
								'https://media.quizzems.com/cdn-cgi/image/' + imageOptions
							)}
							alt="Thumbnail"
							class="img-fluid w-100 h-100"
						/>
					{/if}
				</div>
				<div class="card-body p-2 d-flex flex-column">
					<div
						class="fit-text-container flex-grow-1 d-flex align-items-center justify-content-center"
					>
						<h2 bind:this={titleEl} class="fit-text text-center mb-0 h6 h5-md">
							{collection.category}
						</h2>
					</div>

					<div
						class="card-meta d-flex flex-wrap justify-content-center gap-1 gap-md-2 small text-muted"
					>
						{#if showTags}
							<span class="card-meta-item d-none d-sm-inline">
								{tagCount}
								{tagCount === 1 ? 'tag' : 'tags'}
							</span>
						{/if}
						<span class="card-questions d-flex align-items-center gap-1">
							<Fa icon={faPencil} size="xs" />
							<span class="d-none d-sm-inline">{collection.items_length || 0}</span>
							<span class="d-sm-none">{collection.items_length || 0}</span>
						</span>
						{#if showDate}
							<span class="card-date d-flex align-items-center gap-1">
								<Fa icon={faCalendar} size="xs" />
								<span class="d-none d-md-inline">{formatTimestamp(collection.created_at)}</span>
								<span class="d-md-none"
									>{formatTimestamp(collection.created_at).split('/').slice(0, 2).join('/')}</span
								>
							</span>
						{/if}
						{#if showIsVisible}
							<span class="card-visibility d-flex align-items-center">
								{#if collection.private}
									<Fa icon={faEyeSlash} size="xs" />
								{:else}
									<Fa icon={faEye} size="xs" />
								{/if}
							</span>
						{/if}
						{#if collection.times_played}
							<span class="d-flex align-items-center gap-1">
								<Fa icon={faChartSimple} size="xs" />
								<span class="d-none d-sm-inline">{collection.times_played}</span>
								<span class="d-sm-none"
									>{collection.times_played > 999
										? Math.floor(collection.times_played / 1000) + 'k'
										: collection.times_played}</span
								>
							</span>
						{/if}
						{#if showAuthor && collection.profiles}
							<span class="card-author d-none d-xl-block small">
								by {collection.profiles.username || collection.profiles.public_id}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</a>
	{:else}
		<a class="collection-card-link card border-0 shadow-sm placeholder w-100 mobile-card" href="#">
			<!-- Mobile horizontal placeholder -->
			<div class="d-flex d-sm-none align-items-stretch w-100">
				<div class="mobile-thumbnail flex-shrink-0">
					<div class="w-100 h-100 bg-secondary shimmer"></div>
				</div>
				<div class="flex-grow-1 d-flex flex-column justify-content-center px-3">
					<h2 class="mobile-title text-center mb-1 bg-secondary shimmer text-transparent">
						Loading...
					</h2>
					<div class="mobile-meta d-flex justify-content-center gap-2 small text-muted">
						<span class="bg-secondary shimmer text-transparent">--</span>
						<span class="bg-secondary shimmer text-transparent">--/--</span>
					</div>
				</div>
			</div>

			<!-- Desktop vertical placeholder -->
			<div class="d-none d-sm-flex flex-column h-100">
				<div class="card-image-container position-relative overflow-hidden">
					<img
						src="../loading-spinner.png"
						alt="placeholder image"
						class="img-fluid w-100 h-100 shimmer"
					/>
				</div>
				<div class="card-body p-2 p-md-3 d-flex flex-column">
					<div
						class="fit-text-container flex-grow-1 d-flex align-items-center justify-content-center"
					>
						<h2 class="text-center mb-0 h6 h5-md">Loading...</h2>
					</div>
					<div
						class="card-meta mt-2 d-flex flex-wrap justify-content-center gap-1 gap-md-2 small text-muted"
					>
						<span class="card-questions">--</span>
						<span class="card-date">--/--</span>
					</div>
				</div>
			</div>
		</a>
	{/if}
</li>

<style>
	/* Mobile thumbnail styles */
	.mobile-thumbnail {
		width: 80px;
		height: 80px;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: #f8f9fa;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mobile-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.mobile-title {
		font-size: 1.4rem;
		line-height: 1.2;
		margin: 0;
	}

	.mobile-meta {
		font-size: 1rem;
		line-height: 1.2;
	}

	/* Override Bootstrap card styles for our custom layout */
	.collection-card-link {
		transition:
			transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
		text-decoration: none;
		color: inherit;
	}

	/* Desktop cards get full height, mobile cards get content height */
	.mobile-card {
		height: auto;
	}

	@media (min-width: 576px) {
		.mobile-card {
			height: 100%;
		}
	}

	.collection-card-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
		text-decoration: none;
		color: inherit;
	}

	/* Desktop card image container */
	.card-image-container {
		width: 100%;
		aspect-ratio: 5 / 4;
		height: auto;
		min-height: 120px;
		max-height: 300px;
		background: #f8f9fa;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image-container img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}

	.fit-text-container {
		height: 1.2rem;
		min-height: 1.2rem;
		overflow: hidden;
	}

	.fit-text {
		transform-origin: center center;
		display: inline-block;
		transform: scale(var(--scale));
		font-size: 1rem;
		line-height: 1.2;
		max-width: 100%;
		--scale: 1;
	}

	/* Responsive typography */
	@media (min-width: 768px) {
		.fit-text {
			font-size: 1.1rem;
		}
		.fit-text-container {
			/* height: 3rem; */
			/* min-height: 3rem; */
		}
	}

	@media (min-width: 992px) {
		.fit-text {
			font-size: 1.2rem;
		}
	}

	/* Placeholder styles */
	.placeholder .card-image-container {
		background-color: #e9ecef;
	}

	.placeholder .fit-text,
	.placeholder .card-meta span {
		background-color: #dee2e6;
		color: transparent;
		border-radius: 0.25rem;
		animation: shimmer 1.5s infinite;
	}

	.shimmer {
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}

	/* We use inline style to apply scale dynamically */
	:global(.fit-text) {
		transform: scale(var(--scale));
	}
</style>
