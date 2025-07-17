<script>
	import Fa from 'svelte-fa';
	import { faRotateBack } from '@fortawesome/free-solid-svg-icons';

	export let error;
	export let onRetry;
</script>

<div class="error-container">
	<p>Error: {error}</p>
	<button on:click={onRetry} class="retry-button">
		<Fa icon={faRotateBack} />
		Retry
	</button>
</div>
