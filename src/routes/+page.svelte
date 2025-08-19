<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Collections from '$lib/Collections.svelte';
	import Tags from '$lib/components/Tags.svelte';

	const taglines = [
		'The best place on the whole internet for doing trivia (probably)',
		'Your new favorite dot com',
		'The cure for brainrot',
		'One of the websites of all time',
		'It make brain go brrr',
		'Less orange than the alternative!',
		'We love NFT! (Not Failing Trivia)',
		'Tell ur dad!',
		'0% ABV'
	];

	let tagline = '';

	function getRandomTagline() {
		const randomIndex = Math.floor(Math.random() * taglines.length);
		return taglines[randomIndex];
	}

	function loadSearchedPage(event) {
		const detail = event.detail;
		const url = `/quiz/${detail.author_public_id}/${detail.slug}`;
		const state = { collectionId: detail.id };
		if (browser) {
			goto(url, { state });
		}
	}

	onMount(() => {
		if (browser) {
			document.title = 'Quizzems';
			tagline = getRandomTagline();
		}
	});
</script>

<div class="image-section py-3">
	<div class="image-content my-3 container text-center">
		<img
			class="my-2"
			src="/logo_yellow.png"
			alt="Quizzems Logo"
			fetchpriority="high"
			aria-label="Quizzems Logo"
		/>
		<!-- <p class="drop-quote">{tagline}</p> -->
	</div>
</div>

<div class="container mb-5">
	<h2>The quiz of the day is...</h2>
	<div class="white rounded p-2">
		<Collections
			grid={true}
			list={false}
			sortmode="random-daily"
			limit={1}
			showAuthor={true}
			on:searched={loadSearchedPage}
		/>
	</div>
</div>

<div class="container">
	<h2>Popular Categories</h2>
</div>
<Tags count={12} centered={true} />

<div class="container mt-5">
	<h2>Latest Quizzes</h2>
	<Collections sortmode="latest" limit={4} showAuthor={true} />
</div>

<div class="container mt-5">
	<h2>Try something different</h2>
	<Collections sortmode="random" limit={8} showAuthor={true} />
</div>

<div class="container">
	<div class="mt-3 mb-5">
		<a href="/explore?sort=popular">See More...</a>
	</div>
</div>
