<script>
	import { onMount } from 'svelte';
	import { createFluidSim } from '$lib/webgl-fluid.js';

	let canvas;
	let sim;

	onMount(() => {
		sim = createFluidSim(canvas);
	});
</script>

<canvas bind:this={canvas} style="width: 300px; height: 400px; border-radius: 12px;"></canvas>
