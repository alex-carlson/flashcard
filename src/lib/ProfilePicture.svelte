<script>
	export let userId;
	export let isRound = true;
	export let size = 100;
	const baseUrl = import.meta.env.VITE_SUPABASE_URL;
	const bucketName = 'profilepictures';
	const imageUrl = userId
		? `${baseUrl}/storage/v1/object/public/${bucketName}/${userId}/avatar.jpg`
		: '/avatar.png';

	// export a function to refresh the image
	export const refreshImage = () => {
		const img = document.querySelector('.profile-picture img');
		if (img) {
			img.src = userId
				? `${baseUrl}/storage/v1/object/public/${bucketName}/${userId}/avatar.jpg`
				: '/avatar.png';
		}
	};

	// fallback if image fails to load
	function handleError(event) {
		console.log('Error loading profile picture:', event);
		event.target.src = '/avatar.png';
	}
</script>

<div class="profile-picture">
	<img
		src={imageUrl}
		alt="Profile"
		class={isRound ? 'rounded' : ''}
		style="width: {size}px; height: {size}px; object-fit: cover;"
		on:error={handleError}
	/>
</div>
