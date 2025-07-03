<!-- Example usage in a page component -->
<script>
	import { onMount } from 'svelte';
	import YoutubeAudioPlayer from '$lib/YoutubeAudioPlayer.svelte';
	import VideoPreloader from '$lib/VideoPreloader.svelte';
	import { youtubePlayerService } from '$lib/api/youtubePlayer.js';

	// Example video IDs - replace with your actual video IDs
	let videoIds = [
		'dQw4w9WgXcQ',
		'9bZkp7q19f0',
		'kJQP7kiw5Fk'
		// ... more video IDs
	];

	let videos = [];

	onMount(async () => {
		// Convert video IDs to video objects with preloaded metadata
		videos = videoIds.map((id) => ({
			id,
			videoId: id
			// You can add other properties like title, description, etc.
		}));
	});

	// Function to get preloaded video info for display
	function getVideoInfo(videoId) {
		const preloaded = youtubePlayerService.getPreloadedVideo(videoId);
		return preloaded || { title: 'Loading...', author: 'Unknown' };
	}
</script>

<div class="video-page">
	<h1>Video Collection</h1>

	<!-- Preload videos in the background -->
	<VideoPreloader {videoIds} />

	<!-- Display video players -->
	<div class="video-grid">
		{#each videos as video (video.id)}
			{@const videoInfo = getVideoInfo(video.videoId)}
			<div class="video-card">
				<div class="video-info">
					<h3>{videoInfo.title}</h3>
					<p>by {videoInfo.author}</p>
					{#if !videoInfo.available}
						<span class="unavailable">Video unavailable</span>
					{/if}
				</div>

				<!-- Only render the audio player - no extra iframes -->
				<YoutubeAudioPlayer videoId={video.videoId} />
			</div>
		{/each}
	</div>
</div>

<style>
	.video-page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.video-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.video-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		background: white;
	}

	.video-info {
		margin-bottom: 1rem;
	}

	.video-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.video-info p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.unavailable {
		color: #dc3545;
		font-size: 0.8rem;
		font-weight: bold;
	}
</style>
