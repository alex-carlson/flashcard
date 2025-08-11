<script>
	import Confetti from './components/Confetti.svelte';
	import Fa from 'svelte-fa';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	export let show = false;
	export let title = '';
	export let message = '';
	export let grade = '';
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
			<button type="button" class="modal-close" aria-label="Close" on:click={onClose}>
				<Fa icon={faTimes} />
			</button>
			<div class="modal-content">
				<div class="modal-header">
					<h2 class="modal-title">{title}</h2>
				</div>
				{#if grade !== ''}
					<div class="modal-grade">
						<p>{grade}</p>
					</div>
				{/if}
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

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1050;
	}

	.modal-dialog {
		max-width: 500px;
		width: 100%;
		position: relative;
	}

	.modal-content {
		background: #fff;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem 1rem 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.modal-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 500;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		color: #888;
		cursor: pointer;
		margin-left: 1rem;
		padding: 0 0.5rem;
		transition: color 0.2s;
		width: 44px;
		height: 44px;
		position: absolute;
		top: 0;
		right: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
	}

	.modal-close:hover {
		color: #222;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0.5rem 1.5rem;
		border-top: 1px solid #eee;
	}

	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		margin-left: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		text-align: center;
		text-decoration: none;
		vertical-align: middle;
		cursor: pointer;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		transition:
			background-color 0.2s,
			border-color 0.2s,
			color 0.2s;
	}

	.btn-secondary {
		background-color: #f0f0f0;
		color: #333;
		border-color: #ddd;
	}

	.btn-secondary:hover {
		background-color: #e0e0e0;
		color: #222;
		border-color: #ccc;
	}
</style>
