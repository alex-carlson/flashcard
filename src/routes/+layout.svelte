<script>
	import '../scss/custom.scss';
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
</script>

<svelte:head>
	<title>Quizzems</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta
		name="description"
		content="Make your brain bigger and smarter, fight your friends! Waste and afternoon."
	/>
	<meta
		name="keywords"
		content="flash cards, quizzes, study, learning, education, flashcards, quiz maker, study tools"
	/>
	<meta name="author" content="Quizzems" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Quizzems - Bar Trivia with Attitude" />
	<meta
		property="og:description"
		content="Make your brain bigger and smarter, fight your friends! Waste and afternoon."
	/>
	<meta property="og:image" content="/ogimage.jpg" />
	<meta property="og:url" content="https://quizzems.com" />
	<meta property="og:site_name" content="Quizzems" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Quizzems - Bar Trivia with Attitude" />
	<meta
		name="twitter:description"
		content="Make your brain bigger and smarter, fight your friends! Waste and afternoon."
	/>
	<meta name="twitter:image" content="/ogimage.jpg" />
	<meta name="twitter:site" content="@quizzems" />
	<meta name="twitter:creator" content="@quizzems" />

	<!-- Additional SEO and Social -->
	<meta name="application-name" content="Quizzems" />
	<meta name="apple-mobile-web-app-title" content="Quizzems" />
	<meta name="theme-color" content="#007bff" />
	<meta name="msapplication-TileColor" content="#007bff" />
	<!-- <meta name="msapplication-config" content="/browserconfig.xml" /> -->

	<!-- Canonical URL -->
	<link rel="canonical" href="https://quizzems.com" />

	<!-- Favicon and Icons -->
	<link rel="icon" type="image/png" href="/favicon.png" />
	<!-- <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> -->
	<!-- <link rel="manifest" href="/manifest.json" /> -->

	<!-- Preconnect for Performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Roboto+Condensed:wght@100..900&display=swap"
		rel="stylesheet"
	/>

	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "Quizzems",
			"description": "Make your brain bigger and smarter, fight your friends! Waste and afternoon.",
			"url": "https://quizzems.com",
			"logo": "https://quizzems.com/ogimage.jpg",
			"sameAs": ["https://twitter.com/quizzems", "https://facebook.com/quizzems"],
			"potentialAction": {
				"@type": "SearchAction",
				"target": "https://quizzems.com/search?q={search_term_string}",
				"query-input": "required name=search_term_string"
			}
		}
	</script>
</svelte:head>
<Header></Header>
<main>
	<slot />
	<Toasts position="top-right" />
</main>
<Footer></Footer>
