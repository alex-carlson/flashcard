<script lang="ts">
	import { onMount } from 'svelte';
	import confetti from 'canvas-confetti';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

		myConfetti({
			particleCount: 150,
			spread: 70,
			origin: { y: 0.6 }
		});
	});
</script>

<canvas bind:this={canvas} class="confetti-canvas"></canvas>

<style>
	.confetti-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 9999;
	}
</style>
