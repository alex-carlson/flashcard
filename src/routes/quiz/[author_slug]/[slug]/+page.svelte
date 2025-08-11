<script>
	import { toLetterGrade } from '$lib/api/quizScore.js';
	import FlashCards from '$lib/FlashCards.svelte';
	import { onDestroy } from 'svelte';
	import { incrementPlayCounter } from '$lib/api/collections.js';
	export let data;

	const { category, thumbnail, collectionId, author, quizScore, timesPlayed } = data;
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
		interval = setInterval(() => {
			timer += 1;
		}, 1000);
	}

	function startPractice() {
		incrementPlayCounter(collectionId);
		quizStarted = true;
		practiceMode = true;
		clearInterval(interval);
	}

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<svelte:head>
	{#if category && author}
		<!-- Primary title - most important for SMS apps -->
		<title>Play {category} by {author}</title>

		<!-- Description for link previews -->
		<meta name="description" content="Play {category} by {author} - Interactive flash cards quiz" />

		<!-- Open Graph tags (used by some messaging apps) -->
		<meta property="og:type" content="website" />
		<meta property="og:title" content="Play {category} by {author}" />
		<meta property="og:description" content="Interactive flash cards quiz - Test your knowledge!" />
		<meta property="og:site_name" content="Flash Cards" />

		<!-- Twitter Card tags -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="Play {category} by {author}" />
		<meta
			name="twitter:description"
			content="Interactive flash cards quiz - Test your knowledge!"
		/>

		<!-- Legacy image tag for older systems -->
		<meta name="image" content={thumbnail || ''} />

		<!-- Additional metadata for better compatibility -->
		<meta name="robots" content="index, follow" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="format-detection" content="telephone=no" />

		<!-- Schema.org structured data for better understanding -->
		<meta name="application-name" content="Flash Cards" />
		<meta name="theme-color" content="#007bff" />
	{/if}
	{#if thumbnail != null && thumbnail != ''}
		<!-- Multiple image meta tags for maximum compatibility -->
		<meta property="og:image" content={thumbnail} />
		<meta property="og:image:secure_url" content={thumbnail} />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:image" content={thumbnail} />
		<meta name="twitter:image:src" content={thumbnail} />
		<link rel="image_src" href={thumbnail} />
		<link rel="apple-touch-icon" href={thumbnail} />
	{/if}
</svelte:head>
<div>
	{#if !quizStarted}
		<div class="white padding rounded m-3">
			<!-- add category and title -->
			<h1 class="mb-3">{category}</h1>
			{#if author}
				<p class="mb-3">by {author}</p>
			{/if}
			{#if timesPlayed > 0}
				<p class="mb-3">Times Played: {timesPlayed}</p>
			{/if}
			<!-- {#if quizScore !== null}
				<p class="mb-3">Your High Score: {quizScore}% ({toLetterGrade(quizScore)})</p>
			{/if} -->
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
			on:finish={() => {
				console.log('Quiz finished');
				clearInterval(interval);
			}}
			on:giveup={() => {
				console.log('Quiz given up');
				clearInterval(interval);
			}}
		/>
	</div>
</div>
