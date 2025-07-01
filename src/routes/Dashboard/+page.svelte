<script lang="ts">
	import AccountSettings from '$lib/AccountSettings.svelte';
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { user, logOutUser } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/api/utils';
	import { fetchUserCollections } from '$lib/api/user';

	let scores = [];
	let activeTab = 'settings';

	async function getQuizScores() {
		if ($user) {
			const data = await getUserQuizScores($user.id);
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
			const data = await fetchUserCollections($user.public_id);
			console.log(data);
			collections = data.map((collection) => ({
				id: collection.id,
				title: collection.category,
				items: collection.items,
				slug: collection.slug
			}));
		}
	}

	$: if ($user) {
		document.title = 'User Dashboard';
	}

	async function logout() {
		await logOutUser();
	}

	let page = 1;
	const pageSize = 5;
	$: page = Math.min(page, Math.max(1, Math.ceil(scores.length / pageSize)));
</script>

<div class="container pt-5">
	{#if $user}
		<ProfilePicture userId={$user.id} size="150" />
		<h2 class="my-3">{$user.username || $user.email}</h2>
		<div class="mt-4">
			<ul class="nav nav-tabs mb-0">
				<li class="nav-item">
					<a
						class="nav-link {activeTab === 'settings' ? 'active' : ''}"
						on:click={() => {
							activeTab = 'settings';
						}}
					>
						Account Settings
					</a>
				</li>
				<li class="nav-item">
					<a
						class="nav-link {activeTab === 'scores' ? 'active' : ''}"
						on:click={async () => {
							activeTab = 'scores';
							await getQuizScores();
						}}
					>
						Scores
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="/upload"> Your Quizzems </a>
				</li>
			</ul>

			<div class="white tab-content p-3 border border-top-0 rounded-bottom mb-3">
				{#if activeTab === 'settings'}
					<AccountSettings />
				{:else if activeTab === 'scores'}
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
					</div>
				{/if}
			</div>
			<button class="btn btn-danger" on:click={logout}>Log Out</button>
		</div>
	{:else}
		<p>Loading user data...</p>
	{/if}
</div>
