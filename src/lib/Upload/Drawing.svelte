<script>
	import Fa from 'svelte-fa';
	import {
		faUndo,
		faCancel,
		faCheck,
		faEraser,
		faEyedropper,
		faFloppyDisk,
		faPencil
	} from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let src; // Image source passed into the component
	let canvas;
	let ctx;
	let image = new Image();
	let drawing = false;
	let eyedropping = false;
	let erasing = false;
	let color = '#000000';
	let width = 10;

	let lastX = 0;
	let lastY = 0;

	let removingBackground = false;
	const undoStack = []; // Stack to keep track of undo actions

	function saveState() {
		if (!canvas) return;
		undoStack.push(canvas.toDataURL('image/png'));
	}

	// Load image and draw it on the canvas
	function drawImageToCanvas() {
		canvas.width = image.width;
		canvas.height = image.height;
		ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.lineWidth = width;
	}

	image.onload = drawImageToCanvas;
	image.crossOrigin = 'anonymous'; // Enable CORS for image loading
	onMount(() => {
		if (src) {
			// Set crossOrigin before setting src
			image.crossOrigin = 'anonymous';
			image.src = src;
		}
	});

	function startDrawing(x, y) {
		saveState(); // Save the current state before starting a new drawing
		drawing = true;
		[lastX, lastY] = [x, y];
	}
	function draw(x, y) {
		if (!drawing) return;

		if (erasing) {
			// Use destination-out composite operation to erase
			ctx.globalCompositeOperation = 'destination-out';
			ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for erasing
		} else {
			// Normal drawing
			ctx.globalCompositeOperation = 'source-over';
			ctx.strokeStyle = color;
		}

		ctx.lineWidth = width; // Use the current width setting
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(x, y);
		ctx.stroke();
		[lastX, lastY] = [x, y];
	}
	function endDrawing() {
		drawing = false;
		// Reset composite operation to normal
		ctx.globalCompositeOperation = 'source-over';
	}
	function toggleEyedropper() {
		eyedropping = !eyedropping;
		erasing = false; // Disable erasing when eyedropping
		if (eyedropping) {
			canvas.style.cursor = 'crosshair';
		} else {
			canvas.style.cursor = 'default';
		}
	}

	function toggleEraser() {
		erasing = !erasing;
		eyedropping = false; // Disable eyedropping when erasing
		if (erasing) {
			canvas.style.cursor = 'crosshair';
		} else {
			canvas.style.cursor = 'default';
		}
	}
	function pickColor(x, y) {
		saveState(); // Save the current state before picking color
		try {
			const imageData = ctx.getImageData(x, y, 1, 1);
			const pixel = imageData.data;
			const r = pixel[0];
			const g = pixel[1];
			const b = pixel[2];
			color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
			toggleEyedropper(); // Turn off eyedropper after picking
		} catch (error) {
			console.error('Cannot pick color from cross-origin image:', error);
			// Fallback: just turn off eyedropper without picking color
			toggleEyedropper();
			alert(
				'Cannot pick color from this image due to security restrictions. Please use the color picker instead.'
			);
		}
	}

	function floodFillRemove(startX, startY, threshold = 30) {
		saveState(); // Save the current state before removing background
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		const width = canvas.width;
		const height = canvas.height;

		const index = (x, y) => (y * width + x) * 4;

		// Get target color
		const i = index(startX, startY);
		const target = [data[i], data[i + 1], data[i + 2]];

		const visited = new Uint8Array(width * height);
		const stack = [[startX, startY]];

		const colorDistance = (r1, g1, b1, r2, g2, b2) =>
			Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

		while (stack.length) {
			const [x, y] = stack.pop();
			const idx = index(x, y);

			if (x < 0 || x >= width || y < 0 || y >= height) continue;
			if (visited[y * width + x]) continue;

			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];

			if (colorDistance(r, g, b, ...target) < threshold) {
				// Make transparent
				data[idx + 3] = 0;

				stack.push([x + 1, y]);
				stack.push([x - 1, y]);
				stack.push([x, y + 1]);
				stack.push([x, y - 1]);
			}

			visited[y * width + x] = 1;
		}

		ctx.putImageData(imageData, 0, 0);
	}
	// Mouse events
	function handleMouseDown(e) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const x = Math.floor((e.clientX - rect.left) * scaleX);
		const y = Math.floor((e.clientY - rect.top) * scaleY);

		if (eyedropping) {
			pickColor(x, y);
		} else if (removingBackground) {
			floodFillRemove(x, y);
		} else {
			// Normal drawing or erasing
			startDrawing(x, y);
		}
	}

	function handleMouseMove(e) {
		if (eyedropping) return; // Don't draw when eyedropper is active

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const x = (e.clientX - rect.left) * scaleX;
		const y = (e.clientY - rect.top) * scaleY;
		draw(x, y);
	}
	// Touch events
	function getTouchPos(touch) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (touch.clientX - rect.left) * scaleX,
			y: (touch.clientY - rect.top) * scaleY
		};
	}
	function handleTouchStart(e) {
		e.preventDefault();
		const touch = e.touches[0];
		const pos = getTouchPos(touch);

		if (eyedropping) {
			pickColor(pos.x, pos.y);
		} else if (removingBackground) {
			floodFillRemove(Math.floor(pos.x), Math.floor(pos.y));
			removingBackground = false;
		} else {
			// Normal drawing or erasing
			startDrawing(pos.x, pos.y);
		}
	}

	function handleTouchMove(e) {
		if (eyedropping) return; // Don't draw when eyedropper is active

		e.preventDefault();
		const touch = e.touches[0];
		const pos = getTouchPos(touch);
		draw(pos.x, pos.y);
	}

	function handleTouchEnd() {
		endDrawing();
	}

	function undo() {
		if (undoStack.length === 0) return;
		const lastState = undoStack.pop();
		const img = new Image();
		img.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
		};
		img.src = lastState;
	}

	function saveDrawing() {
		// dispatch a custom event to notify parent component
		const dataURL = canvas.toDataURL('image/webp', 0.6);
		dispatch('save', { dataURL });
	}
	function cancelDrawing() {
		console.log('Drawing cancelled');
		// dispatch a custom event to notify parent component
		dispatch('cancel');
	}
</script>

<div class="drawing-container">
	<div class="container py-3 drawing-controls">
		<h4 class="mb-3">Tools</h4>
		<!-- Tool Buttons -->
		<div class="row mb-3">
			<div class="col-12 d-flex gap-2">
				<button
					type="button"
					class="btn btn-outline-secondary"
					on:click={() => {
						eyedropping = false;
						erasing = false;
						canvas && (canvas.style.cursor = 'default');
					}}
					class:active={!eyedropping && !erasing}
				>
					<Fa icon={faPencil} /> Draw
				</button>

				<button
					type="button"
					class="btn btn-outline-secondary"
					on:click={toggleEraser}
					class:active={erasing}
				>
					<Fa icon={faEraser} /> Erase
				</button>

				<button
					type="button"
					class="btn btn-outline-secondary"
					on:click={toggleEyedropper}
					class:active={eyedropping}
				>
					<Fa icon={faEyedropper} /> Pick Color
				</button>
				<button
					type="button"
					class="btn btn-outline-secondary"
					on:click={() => {
						removingBackground = !removingBackground;
					}}
				>
					{#if removingBackground}
						<Fa icon={faCheck} /> Confirm Background
					{:else}
						<Fa icon={faEraser} />Remove Background
					{/if}
				</button>
			</div>
		</div>

		<!-- Color and Brush Size -->
		<div class="row mb-3" style="height: 50px;">
			<div class="col-12 d-flex align-items-center gap-3 flex-wrap">
				<label class="d-flex align-items-center gap-2 m-0">
					Color:
					<input
						type="color"
						bind:value={color}
						style="
                            width: {width}px;
                            height: {width}px;
                            border-radius: 50%;
                            border: 1px solid black;
                            padding: 0;
                            appearance: none;
                            cursor: pointer;
                        "
					/>
				</label>

				<label class="d-flex align-items-center gap-2 m-0">
					Brush Size:
					<input type="range" min="1" max="200" bind:value={width} />
					<span>{width}px</span>
				</label>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="row">
			<div class="col-12 d-flex gap-2 flex-wrap">
				<button type="button" class="btn btn-warning" on:click={undo}
					><Fa icon={faUndo} />Undo</button
				>
				<button type="button" class="btn btn-success" on:click={saveDrawing}
					><Fa icon={faFloppyDisk} />Save</button
				>
				<button type="button" class="btn btn-secondary" on:click={cancelDrawing}
					><Fa icon={faCancel} />Cancel</button
				>
			</div>
		</div>
	</div>

	<canvas
		class="my-3"
		bind:this={canvas}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={endDrawing}
		on:mouseleave={endDrawing}
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
	/>
</div>

<style>
	canvas {
		border: 1px solid #ccc;
		touch-action: none;
		max-width: 100%;
		display: block;
	}

	.drawing-container {
		background-color: #badbdb;
	}

	.drawing-controls {
		display: flex;
		gap: 15px;
		align-items: center;
		flex-wrap: wrap;
	}
	.drawing-controls label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 14px;
	}

	.drawing-controls button.active {
		background-color: #007bff;
		color: white;
	}
</style>
