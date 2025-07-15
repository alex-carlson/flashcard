<script>
	export let invert = false;

	// if invert, apply css invert class to img
	let imgClass = invert ? 'invert' : '';
</script>

<div class="loading-container">
	<img class={imgClass} src="/loading-spinner.png" alt="Loading spinner" />
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: black;
	}

	.loading-container img {
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
	}

	.loading-container img.invert {
		filter: invert(1);
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
