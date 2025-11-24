<script>
	import FlashCards from '$lib/FlashCards.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { incrementPlayCounter } from '$lib/api/collections.js';
	import QuizHeader from '$lib/components/quiz/QuizHeader.svelte';
	import { createQuizStore } from '$lib/../stores/quiz';
	export let data;

	// Destructure page data
	const { category, collectionId, author, thumbnail, quizScore, timesPlayed, meta } = data;

	// Initialize quiz store
	const quiz = createQuizStore();
	$: stats = quiz.stats;

	let timer = 0;
	let interval = null;
	let quizStarted = false;
	let practiceMode = false;
	let flashCardsComponent;
	let quizStats = { correct: 0, total: 0 };
	let imagesPreloaded = false;
	let imagePreloadCount = 0;
	let totalImages = 0;
	let preloadStarted = false;
	let loadedImages = 0;
	let failedImages = 0;

	// Preload images function
	function preloadImages(cards) {
		// Extract all unique image URLs from cards
		const imageUrls = [
			...new Set([
				...cards
					.filter((card) => card.questionType === 'image' && card.imageUrl)
					.map((card) => card.imageUrl)
			])
		];

		totalImages = imageUrls.length;
		imagePreloadCount = 0;
		loadedImages = 0;
		failedImages = 0;

		console.log(`Starting preload of ${totalImages} unique images:`, imageUrls);

		if (totalImages === 0) {
			imagesPreloaded = true;
			return;
		}

		const preloadPromises = imageUrls.map((url, index) => {
			return new Promise((resolve) => {
				const img = new Image();
				let completed = false;

				const onComplete = (loaded = false) => {
					if (completed) return; // Prevent multiple calls
					completed = true;
					imagePreloadCount++;
					if (loaded) {
						loadedImages++;
					} else {
						failedImages++;
					}
					resolve(loaded);
				};

				img.onload = () => onComplete(true);
				img.onerror = () => onComplete(false); // Mark as failed but continue
				img.src = url;
				// No artificial timeout - let the browser handle loading naturally
			});
		});

		// Wait for all images to either load or fail naturally
		Promise.all(preloadPromises).then(() => {
			console.log(
				`Image preloading completed. Loaded: ${loadedImages}, Failed: ${failedImages}, Total: ${imagePreloadCount}/${totalImages}`
			);
			imagesPreloaded = true;
		});
	}

	// Load quiz data on mount
	onMount(() => {
		if (collectionId) {
			quiz.loadCollection(collectionId);
		}
	});

	// Preload images when cards are loaded
	$: if ($quiz.hasInitialized && $quiz.cards.length > 0 && !imagesPreloaded && !preloadStarted) {
		preloadStarted = true;
		preloadImages($quiz.cards);
	}

	function startQuiz(isPractice = false) {
		if (!isPractice) {
			timer = 0;
			interval = setInterval(() => (timer += 1), 1000);
		} else {
			clearInterval(interval);
		}

		if (collectionId) {
			incrementPlayCounter(collectionId);
		}

		quizStarted = true;
		practiceMode = isPractice;

		// Call onQuizStart on the FlashCards component
		if (flashCardsComponent?.onQuizStart) {
			flashCardsComponent.onQuizStart();
		}
	}
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
			{#if $quiz.hasInitialized}
				<QuizHeader
					collectionName={$quiz.collection.name || category}
					author={$quiz.collection.author || author}
					authorSlug={$quiz.collection.author_slug}
					thumbnail={$quiz.collection.thumbnail || thumbnail}
					description={$quiz.collection.description}
				/>
			{:else}
				<QuizHeader collectionName={category} {author} authorSlug="" {thumbnail} description="" />
			{/if}
			{#if timesPlayed > 0}<h3 class="mb-3">Times Played: {timesPlayed}</h3>{/if}
			{#if !$quiz.hasInitialized}
				<h2 class="mb-3">Loading quiz data...</h2>
			{:else if !imagesPreloaded && totalImages > 0}
				<h2 class="mb-3">Preparing images... ({imagePreloadCount}/{totalImages})</h2>
				<div class="progress mb-3" style="height: 12px;">
					<div
						class="progress-bar bg-success"
						role="progressbar"
						style="width: {totalImages > 0 ? (loadedImages / totalImages) * 100 : 0}%"
						title="Successfully loaded images"
					></div>
					<div
						class="progress-bar bg-warning"
						role="progressbar"
						style="width: {totalImages > 0 ? (failedImages / totalImages) * 100 : 0}%"
						title="Failed to load images"
					></div>
				</div>
				<p class="text-muted small mb-2">
					{loadedImages} loaded, {failedImages} failed of {totalImages} images
				</p>
				<p class="text-muted small mb-3">Loading images in the background...</p>
				<button
					class="btn btn-outline-primary btn-sm me-2"
					style="width: auto; padding: 0 1rem;"
					on:click={() => {
						imagesPreloaded = true;
						preloadStarted = true;
					}}>Skip Preload</button
				>
				{#if failedImages > 0}
					<small class="text-muted"
						>{failedImages} image(s) failed to load and will be skipped</small
					>
				{/if}
			{:else}
				<h2 class="mb-3">Ready to start?</h2>
				<button
					class="btn btn-primary me-2"
					style="width: auto; padding: 0 2rem;"
					on:click={() => startQuiz(false)}>Go</button
				>
				<button
					class="btn btn-outline-secondary"
					style="width: auto; padding: 0 2rem;"
					on:click={() => startQuiz(true)}>Practice</button
				>
			{/if}
		</div>
	{:else}
		<div class="mb-3 sticky-top white py-3">
			<div
				style="display:flex; justify-content:space-between; align-items:center; padding:0 1rem; gap: 1rem;"
			>
				<div style="flex:1;"></div>
				<h2 style="margin:0; text-align:center; flex:1;">
					{quizStats.correct}/{quizStats.total}
				</h2>
				{#if !practiceMode}
					<div class="timer" style="flex:1; text-align:right; white-space:nowrap;">
						Time: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
					</div>
				{:else}
					<div class="timer" style="flex:1; text-align:right; white-space:nowrap;"></div>
				{/if}
			</div>
		</div>
	{/if}

	<div id="quiz" style="display: {quizStarted ? 'block' : 'none'}">
		<FlashCards
			bind:this={flashCardsComponent}
			{practiceMode}
			{collectionId}
			{quiz}
			on:finish={() => clearInterval(interval)}
			on:giveup={() => clearInterval(interval)}
			on:statsUpdate={(e) => {
				quizStats = e.detail;
			}}
		/>
	</div>
</div>
