<script>
	import { onMount } from 'svelte';
	import { user } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/api/utils';
	import { fetchUser, deleteQuizScore } from '$lib/api/user';
	import { addToast } from '$stores/toast';
	import Fa from 'svelte-fa';
	import { faTrash } from '@fortawesome/free-solid-svg-icons';

	let scores = [];
	let page = 1;
	const pageSize = 5;
	$: page = Math.min(page, Math.max(1, Math.ceil(scores.length / pageSize)));

	async function getQuizScores() {
		if ($user) {
			const data = await getUserQuizScores($user.id);
			const processedScores = await Promise.all(
				data.map(async (score) => {
					const metadata = await getCollectionMetadataFromId(score.quiz_id);
					if (!metadata || !metadata[0]) {
						return null;
					}
					return {
						...score,
						collectionName: metadata[0].category,
						author_id: metadata[0].author_public_id,
						author: metadata[0].author,
						username_slug: await fetchUser(metadata[0].author_public_id).then(
							(userData) => userData.username_slug
						),
						slug: metadata[0].slug,
						private: metadata[0].private
					};
				})
			);
			scores = processedScores.filter(Boolean);
			scores.sort((a, b) => b.percentage - a.percentage);
		}
	}
	onMount(() => {
		getQuizScores();
	});
	async function deleteScore(quiz_id, collectionName) {
		if (!$user) return;

		// Show confirmation dialog
		const confirmed = confirm(
			`Are you sure you want to delete your score for "${collectionName}"? This action cannot be undone.`
		);
		if (!confirmed) return;

		try {
			const result = await deleteQuizScore($user.id, quiz_id, $user.token);
			if (result) {
				addToast({
					type: 'success',
					message: 'Score deleted successfully'
				});
				// Refresh the scores list
				await getQuizScores();
			} else {
				throw new Error('Failed to delete score');
			}
		} catch (error) {
			console.error('Error deleting score:', error);
			addToast({
				type: 'error',
				message: 'Failed to delete score. Please try again.'
			});
		}
	}
</script>

<div class="scores">
	<h3>Scores</h3>
	{#if scores.length > 0}
		<ul class="list-group mb-3">
			{#each scores.slice((page - 1) * pageSize, page * pageSize) as score}
				<li class="list-group-item d-flex justify-content-between align-items-center">
					<div>
						{#if !score.private}
							<a href="/quiz/{score.username_slug}/{score.slug}">
								<strong>{score.collectionName} by {score.author}</strong>
							</a>
						{:else}
							<strong style="color: #8a9299;">{score.collectionName} (unavailable)</strong>
						{/if}
						- {score.percentage}%
					</div>
					<button
						class="btn btn-sm btn-outline-danger"
						style="width: auto; padding: 0.5rem 1rem;"
						on:click={() => deleteScore(score.quiz_id, score.collectionName)}
						title="Delete this score"
					>
						<Fa icon={faTrash} />
					</button>
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
