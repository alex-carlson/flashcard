<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	import Search from '$lib/Search.svelte';
	import Latest from '$lib/Latest.svelte';

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
		const url = `/quiz/${detail.author_id}/${detail.slug}`;
		if (browser) {
			goto(url);
		}
	}

	onMount(() => {
		if (browser) {
			document.title = 'Quizzems';
			tagline = getRandomTagline();
		}
	});
</script>

<div class="image-section content">
	<div class="image-content">
		<h1>Welcome to Quizzems</h1>
		<p id="tagline" class="drop-quote">{tagline}</p>
	</div>
</div>
<div class="container">
	<Search on:SearchItemClicked={loadSearchedPage} />
	<Latest />
	<div class="mt-3">
		<a href="/explore">See More...</a>
	</div>
</div>
