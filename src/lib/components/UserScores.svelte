<script>
	import { onMount } from 'svelte';
	import { user } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/api/utils';
	import { fetchUser, deleteQuizScore } from '$lib/api/user';
	import { addToast } from '$stores/toast';
	import Fa from 'svelte-fa';
	import { faTrash } from '@fortawesome/free-solid-svg-icons';
	import { supabase } from '$lib/api/supabaseClient';

	let scores = [];
	let page = 1;
	const pageSize = 5;
	$: page = Math.min(page, Math.max(1, Math.ceil(scores.length / pageSize)));

	async function getQuizScores() {
		if ($user) {
			const data = await getUserQuizScores($user.id);
			const collectionIds = data.map((score) => score.quiz_id);

			const { data: metadataList, error: metadataError } = await supabase
				.from('collections')
				.select('id, category, author, created_at, author_public_id, slug, private')
				.in('id', collectionIds);

			if (metadataError) {
				console.error('Error fetching collection metadata:', metadataError);
				addToast({
					type: 'error',
					message: 'Failed to load scores. Please try again later.'
				});
				return;
			}

			const uniqueAuthorIds = [...new Set(metadataList.map((m) => m.author_public_id))];
			const { data: users, error: usersError } = await supabase
				.from('profiles')
				.select('username_slug, public_id')
				.in('public_id', uniqueAuthorIds);

			if (usersError) {
				console.error('Error fetching user data:', usersError);
				addToast({
					type: 'error',
					message: 'Failed to load scores. Please try again later.'
				});
				return;
			}

			const metadataMap = new Map(metadataList.map((m) => [m.id, m]));
			const usersMap = new Map(users.map((u) => [u.public_id, u.username_slug]));

			const processedScores = data
				.map((score) => {
					const metadata = metadataMap.get(score.quiz_id);
					if (!metadata) {
						return null;
					}
					return {
						...score,
						collectionName: metadata.category,
						author_id: metadata.author_public_id,
						author: metadata.author,
						username_slug: usersMap.get(metadata.author_public_id) || 'unknown-author',
						slug: metadata.slug,
						private: metadata.private
					};
				})
				.filter(Boolean);
			processedScores.sort((a, b) => b.percentage - a.percentage);
			scores = processedScores;
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
