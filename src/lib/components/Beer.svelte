<script>
	import { onMount } from 'svelte';
	import { createFluidSim } from '$lib/webgl-fluid.js';
	import Mug from '$lib/components/Mug.svelte';
	export let width = 300;
	export let height = 400;
	let canvas;
	let sim;
	let tiltAngle = 0; // Track tilt angle for CSS transform
	let translateX = 0; // Track horizontal translation for CSS transform

	onMount(() => {
		sim = createFluidSim(canvas);
		// Trigger cheers animation after 3 seconds
		setTimeout(() => {
			if (sim && sim.cheers) {
				sim.cheers();
			}
		}, 3000);

		// Start animation loop
		updateAnimation();
	});

	// Expose cheers function
	export function cheers() {
		if (sim && sim.cheers) {
			sim.cheers();
		}
	}

	// Update animation values from simulation
	function updateAnimation() {
		if (sim && sim.getTiltAngle && sim.getTranslateX) {
			tiltAngle = sim.getTiltAngle();
			translateX = sim.getTranslateX();
		}
		requestAnimationFrame(updateAnimation);
	}
</script>

<div class="beer-container" style="transform: translateX({translateX}px) rotate({tiltAngle}rad);">
	<div class="mug-background">
		<Mug {width} {height} />
	</div>
	<div class="canvas-container">
		<canvas bind:this={canvas} {width} {height} style="width: {width}px; height: {height}px;"
		></canvas>
	</div>

	<div class="mug-overlay">
		<Mug {width} {height} />
	</div>
</div>

<style>
	.beer-container {
		position: relative;
		display: inline-block;
		transition: transform 0.1s ease-out;
		transform-origin: center bottom;
	}

	.mug-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}
	.canvas-container {
		position: relative;
		z-index: 2;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='319.5,293,700,700'%3E%3Cpath d='M466.2708,955.99701c0.80245,30.56714 379.7325,27.67441 378.4684,-3.61805c-1.2641,-31.29246 21.80612,-178.81429 -9.01676,-616.02624c-121.03635,-28.57319 -230.43071,-35.44221 -364.72122,1.28877c-31.1891,344.74642 -5.53287,587.78838 -4.73042,618.35552z' fill='white'/%3E%3C/svg%3E");
		mask-size: 100% 60%;
		mask-repeat: no-repeat;
		mask-position: center;
		transition: transform 0.1s ease-out;
		transform-origin: center bottom;
	}

	.canvas-container svg {
		pointer-events: none;
	}

	.canvas-container canvas {
		border-radius: 0;
	}

	.mug-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 3;
		pointer-events: none;
	}

	.mug-overlay :global(svg) {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}
</style>
