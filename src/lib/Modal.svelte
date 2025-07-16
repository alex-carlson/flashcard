<script>
	import Confetti from './components/Confetti.svelte';
	export let show = false;
	export let title = '';
	export let message = '';
	export const Effect = {
		NONE: 'none',
		CONFETTI: 'confetti',
		TROMBONE: 'trombone',
		AIRHORN: 'airhorn'
	};
	export let effect = Effect.NONE;
	export let onClose = () => {};
	export let buttons = [
		{
			text: 'Close',
			action: () => onClose(),
			class: 'bg-gray-300 text-black'
		}
	];

	function handleBackgroundClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if show}
	<div
		class="modal"
		tabindex="-1"
		role="dialog"
		on:click={handleBackgroundClick}
		on:keydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		{#if effect === Effect.CONFETTI}
			<Confetti />
		{/if}
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h2 class="modal-title">{title}</h2>
				</div>
				<div class="modal-body">
					<p>{message}</p>
				</div>
				<div class="modal-footer">
					{#each buttons as btn}
						<button
							type="button"
							class={btn.class ? btn.class : 'btn btn-secondary'}
							on:click={btn.action}
						>
							{btn.text}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
