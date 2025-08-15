<script>
	import '../scss/custom.scss';
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';
	import Toasts from '$lib/components/Toasts.svelte';

	export let data;

	const meta = {
		title: data.meta?.title ?? 'Quizzems - Bar Trivia with Attitude',
		description:
			data.meta?.description ??
			'Make your brain bigger and smarter, fight your friends! Waste an afternoon.',
		image: data.meta?.image ?? '/ogimage.jpg',
		url: data.meta?.url ?? 'https://quizzems.com',
		siteName: 'Quizzems',
		themeColor: '#6F1D1B'
	};
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="description" content={meta.description} />
	<meta
		name="keywords"
		content="flash cards, quizzes, study, learning, education, flashcards, quiz maker, study tools"
	/>
	<meta name="author" content="Quizzems" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={meta.image} />
	<meta property="og:url" content={meta.url} />
	<meta property="og:site_name" content="Quizzems" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
	<meta name="twitter:site" content="@quizzems" />
	<meta name="twitter:creator" content="@quizzems" />

	<!-- Canonical -->
	<link rel="canonical" href={meta.url} />
</svelte:head>

<Header />
<main>
	<slot />
	<Toasts position="top-right" />
</main>
<Footer />
