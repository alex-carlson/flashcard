<script>
	import { onMount } from 'svelte';
	import { fetchTags } from '$lib/api/collections';

	let tags = [];

	// on mount, fetch tags from the API
	onMount(async () => {
		try {
			tags = await fetchTags();
			console.log('Fetched tags:', tags);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	});
</script>

<div class="tags">
	{#if tags.length > 0}
		<ul>
			{#each tags as tag}
				<li>
					<a href={`/tags/${tag}`} class="tag">
						{tag}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No tags available</p>
	{/if}
</div>

<style>
	.tags {
		margin: 1rem 0;
	}

	.tags ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tags li {
		display: inline-block;
	}

	.tag {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background-color: #f8f9fa;
		color: #495057;
		text-decoration: none;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #dee2e6;
		transition: all 0.2s ease;
	}

	.tag:hover {
		background-color: #007bff;
		color: white;
		border-color: #007bff;
		text-decoration: none;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
	}

	.tags p {
		color: #6c757d;
		font-style: italic;
		margin: 0;
	}
</style>
