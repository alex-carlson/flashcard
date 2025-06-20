<script>
	export let imageUrl = '';
	export let tempSize = ''; // e.g. "200px" or "100%"

	let loaded = false;

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		console.error('Error loading image');
	}
</script>

<div class="lazy-load" style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ''}>
	{#if !loaded}
		<!-- Shimmer placeholder -->
		<div class="shimmer" />
	{/if}

	{#if imageUrl}
		<img
			src={imageUrl}
			alt="Lazy Loaded Image"
			loading="lazy"
			class:loaded
			on:load={handleLoad}
			on:error={handleError}
			style={loaded ? '' : `width: ${tempSize}; height: ${tempSize};`}
		/>
	{/if}
</div>

<style>
	.lazy-load {
		overflow: hidden;
		position: relative;
		display: inline-block;
		width: var(--temp-size, auto);
		height: var(--temp-size, auto);
	}

	.lazy-load img {
		display: block;
		transition: opacity 0.3s ease-in-out;
		opacity: 0;
		object-fit: cover;
		position: relative;
		z-index: 2;
	}

	.lazy-load img.loaded {
		opacity: 1;
	}

	/* Shimmer placeholder */
	.shimmer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
		background-size: 200% 100%;
		animation: shimmer 1.2s infinite;
		z-index: 1;
		border-radius: 2px;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
