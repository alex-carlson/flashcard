<script>
	export let imageUrl = '';

	import { addToast } from '../stores/toast';

	function handleError() {
		console.error('Error loading image');
		addToast({
			type: 'error',
			message: 'Failed to load image. Please try again later.'
		});
	}
</script>

<div>
	{#if imageUrl}
		<img
			bind:this={imgElement}
			src="{imageUrl}{imageUrl.includes('?') ? '&' : '?'}quality=75&format=auto&width=800&fit=cover"
			alt="question"
			on:error={handleError}
		/>
	{/if}
</div>
