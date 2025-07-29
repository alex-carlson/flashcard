<script>
	import { onMount } from 'svelte';
	export let videoId;
	let thumbnail = '';
	let title = '';
	let error = '';

	onMount(async () => {
		try {
			const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
			const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
			const response = await fetch(url);
			const data = await response.json();
			console.log('YouTube data:', data);
			if (data.items && data.items.length > 0) {
				thumbnail = data.items[0].snippet.thumbnails?.medium?.url || '';
				title = data.items[0].snippet.title || '';
			} else {
				error = 'No video data found.';
			}
		} catch (e) {
			error = 'Failed to fetch YouTube data.';
		}
	});
</script>

<div class="audio-revealed">
	{#if error}
		<div class="youtube-title">{error}</div>
	{:else}
		<a
			href={`https://www.youtube.com/watch?v=${videoId}`}
			target="_blank"
			rel="noopener noreferrer"
		>
			<img src={thumbnail} alt={title} class="youtube-thumbnail" />
		</a>
		<div class="youtube-title">{title}</div>
	{/if}
</div>
