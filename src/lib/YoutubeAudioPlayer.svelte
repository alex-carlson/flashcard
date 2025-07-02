<script>
	import { onMount, onDestroy } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faPlayCircle,
		faPauseCircle,
		faVolumeMute,
		faVolumeHigh
	} from '@fortawesome/free-solid-svg-icons';
	import { youtubePlayerService } from './api/youtubePlayer.js';

	export let videoId;
	export let id;
	let isPlaying = false;
	let playerReady = false;
	let isMuted = false;
	let duration = 0;
	let currentTime = 0;
	let progress = 0;
	let isCurrentVideo = false;
	let unsubscribe;
	let hasUserInteracted = false;

	async function togglePlay() {
		// Handle first user interaction for mobile
		if (!hasUserInteracted) {
			await youtubePlayerService.handleUserInteraction();
			hasUserInteracted = true;
		}

		youtubePlayerService.togglePlay(videoId);
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
		// Subscribe to player state changes first
		unsubscribe = youtubePlayerService.subscribe((state) => {
			playerReady = state.playerReady;
			isMuted = state.isMuted;
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
			<button on:click={togglePlay} on:touchend|preventDefault={togglePlay} disabled={!playerReady}>
				{#if isCurrentVideo && isPlaying}
					<Fa icon={faPauseCircle} />
				{:else}
					<Fa icon={faPlayCircle} />
				{/if}
			</button>
			<button on:click={toggleMute} disabled={!playerReady}>
				{#if isMuted}
					<Fa icon={faVolumeMute} />
				{:else}
					<Fa icon={faVolumeHigh} />
				{/if}
			</button>
			<div class="progress-bar-container" on:click={seek}>
				<div class="progress-bar-bg">
					<div class="progress-bar-fill" style="width: {isCurrentVideo ? progress : 0}%"></div>
				</div>
			</div>
		</div>
		<span class="progress-time">
			{formatTime(isCurrentVideo ? Math.min(currentTime, 60) : 0)} / 1:00
		</span>
	{/if}
</div>
