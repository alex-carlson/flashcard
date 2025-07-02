<script>
	import { createEventDispatcher } from 'svelte';
	import LazyLoadImage from './LazyLoadImage.svelte';
	export let collections = [];
	let isCollapsed = true;

	const dispatch = createEventDispatcher();

	function selectCollection(slug) {
		// Dispatch collection ID to parent
		// close the collection list
		isCollapsed = true;
		dispatch('selectCollection', slug);
	}
</script>

<div class="list condensed">
	<button
		on:click={() => (isCollapsed = !isCollapsed)}
		on:touchend|preventDefault={() => (isCollapsed = !isCollapsed)}
	>
		{isCollapsed ? 'Show Collections' : 'Hide Collections'}
	</button>
	{#if !isCollapsed}
		<ul class="py-3">
			{#each collections as collection}
				<li>
					<a href="#" on:click|preventDefault={() => selectCollection(collection.slug)}>
						<LazyLoadImage imageUrl={collection.thumbnail} tempSize="50px" />
						<span>
							{collection.category}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.placeholder {
		display: flex;
		align-items: center;
		margin-bottom: 1em;
		gap: 1em;
	}

	.image-placeholder {
		border-radius: 4px;
		background: #eee;
		flex-shrink: 0;
	}

	.text-placeholder {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.line {
		border-radius: 4px;
		background: #eee;
		margin-bottom: 0.4em;
	}

	.shimmer {
		background: linear-gradient(45deg, #e0e0e0 0%, #cccccc 20%, #e0e0e0 40%, #e0e0e0 100%);
		background-size: 200% 100%;
		animation: shimmer 2.4s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
