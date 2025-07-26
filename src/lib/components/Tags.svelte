<script>
	import { onMount } from 'svelte';
	import { fetchTags } from '$lib/api/collections';
	export let count = 10; // Default number of tags to fetch
	export let centered = false; // Whether to center the tags

	let tags = [];

	// on mount, fetch tags from the API
	onMount(async () => {
		try {
			tags = await fetchTags(count);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	});

	function preventAnchorDrag(e) {
		e.preventDefault();
	}
</script>

<div class="tags-scrollbar">
	<div class="tags">
		{#if tags.length > 0}
			<ul class={centered ? 'centered' : ''}>
				{#each tags as item}
					<li>
						<a
							href={`/tags/${item.tag}`}
							class="tag"
							draggable="false"
							on:dragstart={preventAnchorDrag}
						>
							{item.tag} ({item.count})
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No tags available</p>
		{/if}
	</div>
</div>

<style>
	.tags-scrollbar {
		width: 100vw;
		max-width: 100%;
		overflow-x: auto;
		background: #fff;
		padding: 0;
	}

	.tags-scrollbar::-webkit-scrollbar {
		height: 8px;
		background: #fff;
	}
	.tags-scrollbar::-webkit-scrollbar-thumb {
		background: #bbb;
		border-radius: 4px;
	}

	.tags {
		width: max-content;
		min-width: 100vw;
	}

	.tags ul {
		list-style: none;
		margin: 0;
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
	}

	.tags li {
		display: inline-block;
	}

	.tag {
		display: inline-block;
		padding: 1rem 1.1rem;
		background-color: #fff;
		color: #495057;
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		transition: all 0.2s ease;
		white-space: nowrap;
		border-right: solid 1px #c2c2c2;
	}

	.tag:hover {
		background-color: #007bff;
		color: white;
		border-color: #007bff;
		text-decoration: none;
		transform: translateY(-1px) scale(1.04);
		box-shadow: 0 2px 8px rgba(0, 123, 255, 0.13);
	}

	.tags p {
		color: #6c757d;
		font-style: italic;
		margin: 0;
		padding: 0 1rem;
	}

	.centered {
		justify-content: flex-start;
	}
</style>
