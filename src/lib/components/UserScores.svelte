<script>
	import { onMount } from 'svelte';
	import { user } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/api/utils';

	let scores = [];
	let page = 1;
	const pageSize = 5;
	$: page = Math.min(page, Math.max(1, Math.ceil(scores.length / pageSize)));

	async function getQuizScores() {
		if ($user) {
			const data = await getUserQuizScores($user.id);
			console.log('Quiz scores data:', data);
			scores = await Promise.all(
				data.map(async (score) => {
					const metadata = await getCollectionMetadataFromId(score.quiz_id);
					console.log('Metadata for quiz:', metadata);
					if (!metadata) {
						return null;
					}
					return {
						...score,
						collectionName: metadata.category,
						author_id: metadata.author_id,
						slug: metadata.slug
					};
				})
			);
			scores.sort((a, b) => b.percentage - a.percentage);
		}
	}

	onMount(() => {
		getQuizScores();
	});
</script>

<div class="scores">
	<h3>Scores</h3>
	{#if scores.length > 0}
		<ul class="list-group mb-3">
			{#each scores.slice((page - 1) * pageSize, page * pageSize) as score}
				<li class="list-group-item">
					<a href="/quiz/{score.author_id}/{score.slug}">
						<strong>{score.collectionName}</strong>
					</a>
					- {score.percentage}%
				</li>
			{/each}
		</ul>
		<div class="pagination d-flex justify-content-between align-items-center">
			<button class="btn btn-secondary" on:click={() => page--} disabled={page === 1}>Prev</button>
			<span>Page {page} of {Math.ceil(scores.length / pageSize)}</span>
			<button
				class="btn btn-secondary"
				on:click={() => page++}
				disabled={page === Math.ceil(scores.length / pageSize)}
			>
				Next
			</button>
		</div>
	{:else}
		<p>No scores found.</p>
	{/if}
</div>
