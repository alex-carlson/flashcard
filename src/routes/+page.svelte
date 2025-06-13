<script>
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

	function getRandomTagline() {
		const randomIndex = Math.floor(Math.random() * taglines.length);
		return taglines[randomIndex];
	}

	function loadSearchedPage(event) {
		console.log('Search item clicked:', event);
		const detail = event.detail;
		const url = `/${detail.author_id}/${detail.slug}`;
		window.location.href = url;
	}

	// on mount, set a random tagline
	import { onMount } from 'svelte';
	onMount(() => {
		const taglineElement = document.getElementById('tagline');
		if (taglineElement) {
			taglineElement.textContent = getRandomTagline();
		}
	});
</script>

<div class="container white">
	<div class="image-section">
		<div class="image-content">
			<h1>Welcome to Quizzems</h1>
			<p id="tagline" class="drop-quote"></p>
		</div>
	</div>
	<div class="padding">
		<Search on:SearchItemClicked={loadSearchedPage} />
		<Latest />
	</div>
	<div class="padding">
		<a href="/explore">See More...</a>
	</div>
</div>
