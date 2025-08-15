<script>
	import { toLetterGrade } from '$lib/api/quizScore.js';
	import FlashCards from '$lib/FlashCards.svelte';
	import { onDestroy } from 'svelte';
	import { incrementPlayCounter } from '$lib/api/collections.js';
	export let data;

	// Destructure page data
	const { category, collectionId, author, quizScore, timesPlayed, meta } = data;

	let timer = 0;
	let interval = null;
	let quizStarted = false;
	let practiceMode = false;

	function startQuiz() {
		incrementPlayCounter(collectionId);
		quizStarted = true;
		practiceMode = false;
		timer = 0;
		clearInterval(interval);
		interval = setInterval(() => (timer += 1), 1000);
	}

	function startPractice() {
		incrementPlayCounter(collectionId);
		quizStarted = true;
		practiceMode = true;
		clearInterval(interval);
	}

	//onmount, print meta
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('Meta:', meta);
	});

	onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
	{#if meta}
		<!-- Title & Description -->
		<title>{meta.title}</title>
		<meta name="description" content={meta.description} />

		<!-- Open Graph -->
		<meta property="og:type" content="website" />
		<meta property="og:title" content={meta.title} />
		<meta property="og:description" content={meta.description} />
		<meta property="og:site_name" content={meta.siteName || 'Quizzems'} />
		{#if meta.url}<meta property="og:url" content={meta.url} />{/if}

		<!-- Twitter -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={meta.title} />
		<meta name="twitter:description" content={meta.description} />

		<!-- Image -->
		{#if meta.image}
			<meta name="image" content={meta.image} />
			<meta property="og:image" content={meta.image} />
			<meta property="og:image:secure_url" content={meta.image} />
			<meta property="og:image:type" content="image/jpeg" />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta name="twitter:image" content={meta.image} />
			<meta name="twitter:image:src" content={meta.image} />
			<link rel="image_src" href={meta.image} />
			<link rel="apple-touch-icon" href={meta.image} />
		{/if}

		<!-- Additional metadata -->
		<meta name="robots" content="index, follow" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="format-detection" content="telephone=no" />
		<meta name="application-name" content={meta.siteName || 'Quizzems'} />
		<meta name="theme-color" content={meta.themeColor || '#6F1D1B'} />
	{/if}
</svelte:head>

<div>
	{#if !quizStarted}
		<div class="white padding rounded m-3">
			<h1 class="mb-3">{category}</h1>
			{#if author}<p class="mb-3">by {author}</p>{/if}
			{#if timesPlayed > 0}<p class="mb-3">Times Played: {timesPlayed}</p>{/if}
			<h2 class="mb-3">Ready to start?</h2>
			<button
				class="btn btn-primary me-2"
				style="width: auto; padding: 0 2rem;"
				on:click={startQuiz}>Go</button
			>
			<button
				class="btn btn-outline-secondary"
				style="width: auto; padding: 0 2rem;"
				on:click={startPractice}>Practice</button
			>
		</div>
	{:else}
		{#if !practiceMode}
			<div class="timer mb-3 fixed-timer white">
				Time: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
			</div>
		{/if}
		<style>
			.fixed-timer {
				position: fixed;
				top: 1rem;
				right: 1rem;
				padding: 0.5rem 1rem;
				border-radius: 0.5rem;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
				z-index: 1000;
			}
		</style>
	{/if}

	<div id="quiz" style="display: {quizStarted ? 'block' : 'none'}">
		<FlashCards
			{collectionId}
			on:finish={() => clearInterval(interval)}
			on:giveup={() => clearInterval(interval)}
		/>
	</div>
</div>
