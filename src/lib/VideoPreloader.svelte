<script>
	import { onMount } from 'svelte';
	import { youtubePlayerService } from './api/youtubePlayer.js';

	export let videoIds = []; // Array of video IDs to preload
	let preloadStatus = 'idle'; // 'idle', 'loading', 'complete', 'error'
	let preloadResults = [];
	let preloadedCount = 0;

	async function preloadAllVideos() {
		if (!videoIds.length) return;

		preloadStatus = 'loading';
		console.log('Starting video preload for', videoIds.length, 'videos');

		try {
			preloadResults = await youtubePlayerService.preloadVideos(videoIds);
			preloadedCount = preloadResults.filter((r) => r.success).length;
			preloadStatus = 'complete';

			console.log(`Video preload complete: ${preloadedCount}/${videoIds.length} successful`);
		} catch (error) {
			console.error('Video preload failed:', error);
			preloadStatus = 'error';
		}
	}

	onMount(() => {
		if (videoIds.length > 0) {
			preloadAllVideos();
		}
	});

	// Reactive statement to preload when videoIds change
	$: if (videoIds.length > 0 && preloadStatus === 'idle') {
		preloadAllVideos();
	}
</script>

<!-- Optional: Show preload status -->
{#if preloadStatus === 'loading'}
	<div class="preload-status">
		<span>Preloading videos...</span>
	</div>
{:else if preloadStatus === 'complete'}
	<div class="preload-status success">
		<span>✓ Preloaded {preloadedCount}/{videoIds.length} videos</span>
	</div>
{:else if preloadStatus === 'error'}
	<div class="preload-status error">
		<span>⚠ Video preload failed</span>
	</div>
{/if}

<style>
	.preload-status {
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
	}

	.preload-status.success {
		background: #d4edda;
		border-color: #c3e6cb;
		color: #155724;
	}

	.preload-status.error {
		background: #f8d7da;
		border-color: #f5c6cb;
		color: #721c24;
	}
</style>
