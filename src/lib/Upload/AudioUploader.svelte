<script>
	import { createEventDispatcher } from 'svelte';
	import { Fa } from 'svelte-fa';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';
	const dispatch = createEventDispatcher();
	export function addSong(data) {
		// This function can be used to add a song to a playlist or perform other actions
		console.log(`Adding song: ${data.title}, ID: ${data.videoId}`);
		dispatch('addSong', data);
	}
	let searchTerm = '';
	let results = [];
	let pasteUrl = '';

	const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

	async function searchYoutube() {
		if (!searchTerm) return;

		const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
			searchTerm + ' song'
		)}&type=video&videoCategoryId=10&maxResults=5&key=${API_KEY}`;

		try {
			const res = await fetch(url);
			const data = await res.json();
			results = data.items.map((item) => ({
				title: item.snippet.title,
				videoId: item.id.videoId,
				thumbnail: item.snippet.thumbnails.medium.url
			}));
		} catch (err) {
			console.error('Error fetching YouTube data:', err);
		}
	}

	function handlePasteUrl() {
		const videoId = pasteUrl.trim();
		if (!videoId) {
			alert('Invalid YouTube ID');
			return;
		}
		addSong({
			title: `Video ID: ${videoId}`,
			videoId,
			thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
		});
	}
</script>

<div class="container white audio-uploader padding">
	<div class="search-container">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="e.g. Prince"
			on:keydown={(e) => {
				if (e.key === 'Enter') searchYoutube();
			}}
		/>
		<button on:click={searchYoutube}><Fa icon={faSearch} /></button>
	</div>
	<div class="paste-url-container" style="margin-top: 1em;">
		<input
			type="text"
			bind:value={pasteUrl}
			placeholder="Paste YouTube ID here"
			on:keydown={(e) => {
				if (e.key === 'Enter') handlePasteUrl();
			}}
			style="width: 70%; margin-right: 0.5em;"
		/>
		<button on:click={handlePasteUrl} class="btn btn-sm btn-primary">Add by Video ID</button>
	</div>

	{#if results.length > 0}
		<ul>
			{#each results as result}
				<li>
					<button
						type="button"
						on:click={() => addSong(result)}
						style="background:none;border:none;padding:0;cursor:pointer;text-align:left;width:100%;"
					>
						<img
							src={`https://img.youtube.com/vi/${result.videoId}/default.jpg`}
							alt="Thumbnail"
							width="80"
							height="60"
							style="vertical-align: middle; margin-right: 8px;"
						/>
						<div class="text">
							{@html result.title
								.replace(/&amp;/g, '&')
								.replace(/&quot;/g, '"')
								.replace(/&#39;/g, "'")}
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
