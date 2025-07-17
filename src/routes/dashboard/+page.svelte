<script lang="ts">
	import AccountSettings from '$lib/AccountSettings.svelte';
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { user, logOutUser } from '$stores/user';
	import { getUserQuizScores, getCollectionMetadataFromId } from '$lib/api/utils';
	import { fetchUser, fetchUserCollections } from '$lib/api/user';

	type Score = {
		quiz_id: string;
		percentage: number;
		// add other properties from the score object as needed
		collectionName?: string;
		author_id?: string;
		slug?: string;
	};

	let scores: Score[] = [];
	let activeTab = 'settings';

	async function getQuizScores(): Promise<Score[]> {
		if ($user) {
			const data: Score[] = await getUserQuizScores($user.id);
			const result: Score[] = await Promise.all(
				data.map(async (score: Score) => {
					const metadataArr = await getCollectionMetadataFromId(score.quiz_id);
					const metadata = Array.isArray(metadataArr) ? metadataArr[0] : metadataArr;
					const userData = await fetchUser(metadata?.author_public_id ?? '');
					console.log('User Data:', userData);
					return {
						...score,
						collectionName: metadata?.category ?? 'Unknown',
						author_id: metadata?.author_public_id ?? '',
						slug: metadata?.slug ?? '',
						author_slug: userData?.username_slug ?? ''
					};
				})
			);
			// Sort scores by percentage, highest to lowest
			result.sort((a, b) => b.percentage - a.percentage);
			scores = result;
			return result;
		}
		return [];
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
							scores = await getQuizScores();
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
									<a href="/quiz/{score.author_slug}/{score.slug}">
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
