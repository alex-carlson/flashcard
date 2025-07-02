<script>
	import { onMount, onDestroy } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faPlayCircle,
		faPauseCircle,
		faVolumeMute,
		faVolumeHigh,
		faDownload,
		faSpinner
	} from '@fortawesome/free-solid-svg-icons';
	import { youtubePlayerService } from './api/youtubePlayer.js';

	export let videoId;
	export let id;
	let isPlaying = false;
	let playerReady = false;
	let isMuted = false;
	let isLoading = false;
	let duration = 0;
	let currentTime = 0;	let progress = 0;
	let isCurrentVideo = false;
	let unsubscribe;	let hasUserInteracted = false;
	let error = null;
	
	// Check if user is on Firefox
	const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

	async function handleButtonClick() {
		console.log('Button clicked for video:', videoId, 'Firefox:', isFirefox);

		// Handle first user interaction for mobile and Firefox
		if (!hasUserInteracted || isFirefox) {
			console.log('First user interaction detected or Firefox - triggering audio unlock');
			await youtubePlayerService.handleUserInteraction();
			hasUserInteracted = true;
		}

		try {
			// If this video isn't loaded yet or has an error, try to load it
			if (!isCurrentVideo || error) {
				// Clear any existing error before attempting to load
				if (error) {
					youtubePlayerService.clearError();
				}
				await youtubePlayerService.loadVideoOnly(videoId);
			} else {
				// If loaded, toggle play/pause
				await youtubePlayerService.togglePlay(videoId);
			}
		} catch (error) {
			console.error('Error in handleButtonClick:', error);
		}
	}
	function toggleMute() {
		youtubePlayerService.toggleMute();
	}

	function seek(e) {
		if (!isCurrentVideo || !playerReady) return;
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percent = x / rect.width;
		youtubePlayerService.seek(percent);
	}

	function formatTime(sec) {
		if (!sec || isNaN(sec)) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60)
			.toString()
			.padStart(2, '0');
		return `${m}:${s}`;
	}
	onMount(async () => {
		// Subscribe to player state changes first		unsubscribe = youtubePlayerService.subscribe((state) => {
			playerReady = state.playerReady;
			isMuted = state.isMuted;
			isLoading = state.isLoading;
			error = state.error;
			isCurrentVideo = state.currentVideoId === videoId;

			if (isCurrentVideo) {
				isPlaying = state.isPlaying;
				duration = state.duration;
				currentTime = state.currentTime;
				progress = state.progress;
			} else {
				isPlaying = false;
			}
		});

		// Initialize the shared player (this will be a no-op if already initialized)
		try {
			await youtubePlayerService.initializePlayer();
		} catch (error) {
			console.error('Failed to initialize YouTube player:', error);
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div class="player-container p-3">
	{#if !playerReady}
		<span>Loading...</span>
	{:else}
		<div class="controls">
			<button
				on:click={handleButtonClick}
				on:touchstart|preventDefault={handleButtonClick}
				on:touchend|preventDefault
				disabled={!playerReady || (error && isCurrentVideo)}
				style="touch-action: manipulation;"
			>
				{#if error && isCurrentVideo}
					<Fa icon={faDownload} style="color: #dc3545;" />
				{:else if isLoading && isCurrentVideo}
					<Fa icon={faSpinner} spin />
				{:else if !isCurrentVideo}
					<Fa icon={faDownload} />
				{:else if isCurrentVideo && isPlaying}
					<Fa icon={faPauseCircle} />
				{:else}
					<Fa icon={faPlayCircle} />
				{/if}
			</button>
			<!-- <button on:click={toggleMute} disabled={!playerReady}>
				{#if isMuted}
					<Fa icon={faVolumeMute} />
				{:else}
					<Fa icon={faVolumeHigh} />
				{/if}
			</button> -->
			<div class="progress-bar-container" on:click={seek}>
				<div class="progress-bar-bg">
					<div class="progress-bar-fill" style="width: {isCurrentVideo ? progress : 0}%"></div>
				</div>
			</div>
		</div>
		{#if error && isCurrentVideo}
			<div class="error-message" style="color: #dc3545; font-size: 0.875rem; margin-top: 0.5rem;">
				{error}
			</div>
		{/if}
		<span class="progress-time">
			{formatTime(isCurrentVideo ? Math.min(currentTime, 60) : 0)} / 1:00
		</span>
	{/if}
</div>
