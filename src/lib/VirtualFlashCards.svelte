<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import Card from './Card.svelte';

	export let cards = [];
	export let isGrid = true;
	export let cardHeight = 200; // Estimated card height
	export let overscan = 5; // Number of cards to render outside viewport

	let container;
	let scrollY = 0;
	let containerHeight = 0;
	let containerTop = 0;

	const dispatch = createEventDispatcher();

	// Calculate visible range
	$: visibleStart = Math.max(0, Math.floor((scrollY - containerTop) / cardHeight) - overscan);
	$: visibleEnd = Math.min(
		cards.length,
		Math.ceil((scrollY - containerTop + window.innerHeight) / cardHeight) + overscan
	);
	$: visibleCards = cards.slice(visibleStart, visibleEnd);

	// Calculate total height to maintain scroll behavior
	$: totalHeight = cards.length * cardHeight;
	$: offsetY = visibleStart * cardHeight;

	function updateScrollY() {
		scrollY = window.pageYOffset;
	}

	function updateContainerDimensions() {
		if (container) {
			const rect = container.getBoundingClientRect();
			containerTop = rect.top + window.pageYOffset;
			containerHeight = rect.height;
		}
	}

	onMount(() => {
		window.addEventListener('scroll', updateScrollY, { passive: true });
		window.addEventListener('resize', updateContainerDimensions);
		updateContainerDimensions();
	});

	onDestroy(() => {
		window.removeEventListener('scroll', updateScrollY);
		window.removeEventListener('resize', updateContainerDimensions);
	});
</script>

<div bind:this={container} class="virtual-container" style="height: {totalHeight}px;">
	<div class="visible-cards" style="transform: translateY({offsetY}px);">
		{#each visibleCards as card, i}
			<Card item={card} i={visibleStart + i} {cards} on:correctAnswer on:giveUp {...$$restProps} />
		{/each}
	</div>
</div>

<style>
	.virtual-container {
		position: relative;
		overflow: visible;
	}

	.visible-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		padding: 4px;
	}
</style>
