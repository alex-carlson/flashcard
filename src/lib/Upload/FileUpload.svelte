<script>
	import { createEventDispatcher } from 'svelte';
	export let placeholderImage = ''; // Placeholder image input prop

	const dispatch = createEventDispatcher();

	let fileInput;
	let myImg = null;

	const convertFileToImage = (e) => {
		const image = e.target.files[0];

		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];

		if (!image || !allowedTypes.includes(image.type)) {
			alert('Only images are allowed (jpeg, png, gif, svg, webp)');
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL(image);

		reader.onload = (e) => {
			myImg = e.target.result;
			dispatch('uploadImage', image);
		};
	};
</script>

<div
	class="drop-zone"
	role="button"
	tabindex="0"
	on:click={() => fileInput?.click()}
	on:keydown={(e) => {
		if (e.key === 'Enter') {
			fileInput?.click();
		}
	}}
>
	<div class="drop-zone__prompt">
		<p class="text">{myImg ? 'Change image' : 'Drop your image or click here'}</p>
		<img class="preview" src={myImg || placeholderImage} alt="" />
	</div>
</div>

<input
	style="display: none"
	type="file"
	accept="image/*"
	bind:this={fileInput}
	on:change={convertFileToImage}
/>
