<script lang="ts">
	export const prerender = true;

	import AccountSettings from '$lib/AccountSettings.svelte';
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { user } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/utils';
	import { fetchUserCollections } from '$lib/user';
	import { onMount } from 'svelte';

	let scores = [];
	let activeTab = 'settings';
	let collections = [];
	let collectionsPage = 1;
	let collectionsPageSize = 25;

	async function getQuizScores() {
		// get quizzescompleted by the user
		if ($user) {
			const data = await getUserQuizScores($user.id);
			// For each score, resolve the collection name
			scores = await Promise.all(
				data.map(async (score) => {
					const metadata = await getCollectionMetadataFromId(score.quiz_id);
					return {
						...score,
						collectionName: metadata.category,
						author_id: metadata.author_id,
						slug: metadata.slug
					};
				})
			);
			// Sort scores by percentage, highest to lowest
			scores.sort((a, b) => b.percentage - a.percentage);
		}
	}

	async function getUserCollections() {
		if ($user) {
			const data = await fetchUserCollections($user.uid);
			console.log(data);
			collections = data.map((collection) => ({
				id: collection.id,
				title: collection.category,
				items: collection.items,
				slug: collection.slug
			}));
		}
	}

	onMount(() => {
		document.title = 'User Dashboard';
		getQuizScores();
		getUserCollections();
	});

	let page = 1;
	const pageSize = 5;
	$: page = Math.min(page, Math.max(1, Math.ceil(scores.length / pageSize)));
</script>

<div class="container white padding">
	{#if $user}
		<ProfilePicture userId={$user.id} size="150" />
		<h2>{$user.username || $user.email}</h2>
		<div class="container mt-4">
			<ul class="nav nav-tabs">
				<li class="nav-item">
					<a
						class="nav-link {activeTab === 'settings' ? 'active' : ''}"
						on:click={() => (activeTab = 'settings')}
					>
						Account Settings
					</a>
				</li>
				<li class="nav-item">
					<a
						class="nav-link {activeTab === 'scores' ? 'active' : ''}"
						on:click={() => (activeTab = 'scores')}
					>
						Scores
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="/upload"> Your Quizzems </a>
				</li>
			</ul>

			<div class="tab-content p-3 border border-top-0 rounded-bottom">
				{#if activeTab === 'settings'}
					<AccountSettings />
				{:else if activeTab === 'scores'}
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
						<div class="d-flex justify-content-between align-items-center">
							<button class="btn btn-secondary" on:click={() => page--} disabled={page === 1}
								>Prev</button
							>
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
				{/if}
			</div>
		</div>
	{:else}
		<p>Loading user data...</p>
	{/if}
</div>
