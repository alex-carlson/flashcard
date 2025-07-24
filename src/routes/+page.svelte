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
		<!-- <h1 class="my-3">Quizzems</h1> -->
		<img class="my-2" src="/logo_yellow.png" alt="" />
		<!-- <p class="drop-quote">{tagline}</p> -->
	</div>
</div>

<div class="container">
	<h2>Popular Categories</h2>
	<Tags count={5} centered={true} />
</div>

<div class="container mt-3">
	<h2>Latest Collections</h2>
	<Collections sortmode="latest" limit={4} />
</div>

<div class="container">
	<h2 class="mt-3">Most Popular Collections</h2>
	<Collections sortmode="popular" limit={4} />
	<div class="mt-3 mb-5">
		<a href="/explore?sort=popular">See More...</a>
	</div>
</div>
