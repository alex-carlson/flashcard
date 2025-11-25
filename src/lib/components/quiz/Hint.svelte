<script>
	import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { createEventDispatcher } from 'svelte';

	export let answer = null;
	let currentRevealedAnswer = '';
	const dispatch = createEventDispatcher();

	function revealNextCharacter() {
		if (answer && currentRevealedAnswer.length < answer.length) {
			currentRevealedAnswer += answer[currentRevealedAnswer.length];
			dispatch('reveal', { revealedAnswer: currentRevealedAnswer });
		}
	}
</script>

<button on:click={revealNextCharacter} style="width: 50px;">
	<Fa icon={faLightbulb} />
</button>
