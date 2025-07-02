<script>
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { fetchUser, fetchUserCollections } from '$lib/api/user';
	import { page } from '$app/stores';
	import CollectionCard from '$lib/components/CollectionCard.svelte';

	let collections = [];
	let author = null;
	let bio = null;
	let userData = null;

	// This runs whenever $page.params.author_id changes
	$: if ($page.params.author_id) {
		init($page.params.author_id);
	}

	async function init(author_id) {
		userData = await fetchUser(author_id);
		collections = await fetchUserCollections(author_id);
		bio = userData?.bio || null;
		author = userData?.username || null;
		console.log('User data fetched:', userData);
		console.log('Collections fetched:', collections);
	}
</script>

{#if author}
	<div class="container p-4 mb-4">
		<div class="row align-items-center white rounded">
			<div class="col-auto">
				<ProfilePicture userId={userData.id} size={150} isRound={true} />
			</div>
			<div class="col">
				<h2 class="mb-1">{author}</h2>
				<p class="mb-2">{collections.length} quizzes published</p>
				{#if bio && bio.length > 0}
					<p class="mb-0" style="border: 1px solid #ddd; padding: 0.75rem; border-radius: 0.5rem;">
						{bio}
					</p>
				{/if}
			</div>
		</div>
	</div>
	<div class="container list grid pt-3">
		<ul>
			{#each collections as data}
				<CollectionCard collection={data} />
			{/each}
		</ul>
	</div>
{:else}
	<div class="white padding rounded">
		<p>Loading...</p>
	</div>
{/if}
