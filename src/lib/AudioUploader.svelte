<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	export function addSong(title, id) {
		// This function can be used to add a song to a playlist or perform other actions
		console.log(`Adding song: ${title}, ID: ${id}`);
		dispatch('addSong', { title, id });
	}
	let searchTerm = '';
	let results = [];

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
				videoId: item.id.videoId
			}));
		} catch (err) {
			console.error('Error fetching YouTube data:', err);
		}
	}
</script>

<div class="container white audio-uploader">
	<h2>Find Audio</h2>
	<input type="text" bind:value={searchTerm} placeholder="e.g. Prince" />
	<button on:click={searchYoutube}>Search</button>

	{#if results.length > 0}
		<ul>
			{#each results as result}
				<li>
					<button
						type="button"
						on:click={() => addSong(result.title, result.videoId)}
						style="background:none;border:none;padding:0;cursor:pointer;text-align:left;width:100%;"
					>
						<img
							src={`https://img.youtube.com/vi/${result.videoId}/default.jpg`}
							alt="Thumbnail"
							width="80"
							height="60"
							style="vertical-align: middle; margin-right: 8px;"
						/>
						{@html result.title
							.replace(/&amp;/g, '&')
							.replace(/&quot;/g, '"')
							.replace(/&#39;/g, "'")}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
