<script>
	import { toLetterGrade } from '$lib/api/quizScore.js';
	import FlashCards from '$lib/FlashCards.svelte';
	import { onDestroy } from 'svelte';
	export let data;

	const { category, thumbnail, collectionId, author, quizScore } = data;
	let timer = 0;
	let interval = null;
	let quizStarted = false;
	let practiceMode = false;

	function startQuiz() {
		quizStarted = true;
		practiceMode = false;
		timer = 0;
		clearInterval(interval);
		interval = setInterval(() => {
			timer += 1;
		}, 1000);
	}

	function startPractice() {
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
		<title>{category} by {author}</title>
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
	{#if !quizStarted}
		<div class="white padding rounded m-3">
			<!-- add category and title -->
			<h1 class="mb-3">{category}</h1>
			{#if author}
				<p class="mb-3">by {author}</p>
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
	{/if}
</div>
