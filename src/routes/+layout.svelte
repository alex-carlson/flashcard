<script>
	import '../scss/custom.scss';
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
</script>

<svelte:head>
	<title>Quizzems</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link rel="icon" type="image/png" href="/favicon.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Roboto+Condensed:wght@100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>
<Header></Header>
<main>
	<slot />
	<Toasts position="top-right" />
</main>
<Footer></Footer>
