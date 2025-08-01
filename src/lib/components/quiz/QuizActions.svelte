<script>
	import Fa from 'svelte-fa';
	import { faFlag, faArrowUp } from '@fortawesome/free-solid-svg-icons';
	import { createEventDispatcher } from 'svelte';

	export let currentMode;
	export let isComplete;
	export let onCompleteQuiz;
	export let isPartyMode = false;

	const dispatch = createEventDispatcher();
</script>

{#if !isPartyMode && !isComplete}
	<div class="py-3" style="display: flex; gap: 4px; flex-direction: column;">
		{#if currentMode === 'FILL_IN_THE_BLANK'}
			<button
				class="give-up"
				on:click={() => {
					console.log('Give up clicked');
					onCompleteQuiz();
					dispatch('giveup');
				}}
			>
				<span>Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" /></span>
			</button>
		{:else}
			<button
				class="scroll-to-top"
				on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			>
				<span>Scroll to Top <Fa icon={faArrowUp} style="margin-left: 0.5rem" /></span>
			</button>
		{/if}
	</div>
{/if}
