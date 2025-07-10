<script>
	import { toasts } from '$stores/toast';

	export let position = 'top-center'; // You can add variants
</script>

<div class="toast-container {position}">
	{#each $toasts as toast (toast.id)}
		<div class="toast {toast.type} {toast.removing ? 'removing' : 'show'}">
			{toast.message}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		z-index: 9999;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		width: 100%;
		top: 0;
		left: 0;
	}
	.toast {
		margin: 0;
		border-radius: 0;
		border: none;
		width: 100%;
		background: #333;
		color: white;
		padding: 0.75rem 1rem;
		border-bottom: solid 1px rgba(0, 0, 0, 0.1);
		opacity: 1;
		transition:
			opacity 0.3s ease-out,
			transform 0.3s ease-out;
	}
	.toast.show {
		opacity: 1;
	}
	.toast.removing {
		opacity: 0;
	}
	.toast.info {
		background: #2196f3;
	}
	.toast.success {
		background: #4caf50;
	}
	.toast.error {
		background: #f44336;
	}
</style>
