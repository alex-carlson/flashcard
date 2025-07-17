<script>
	import Fa from 'svelte-fa';
	import { faFlag, faArrowUp } from '@fortawesome/free-solid-svg-icons';

	export let currentMode;
	export let isComplete;
	export let onCompleteQuiz;
	export let isPartyMode = false;
</script>

{#if !isPartyMode && !isComplete}
	<div class="py-3" style="display: flex; gap: 4px; flex-direction: column;">
		{#if currentMode === 'FILL_IN_THE_BLANK'}
			<button class="give-up" on:click={onCompleteQuiz}>
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
