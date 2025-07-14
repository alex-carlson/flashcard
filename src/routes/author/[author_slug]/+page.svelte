<script>
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { fetchUser, fetchUserBySlug, fetchUserCollections } from '$lib/api/user';
	import { page } from '$app/stores';
	import CollectionCard from '$lib/components/CollectionCard.svelte';

	let collections = [];
	let author = null;
	let bio = null;
	let userData = null;

	// This runs whenever $page.params.author_id changes
	$: if ($page.params.author_slug) {
		init($page.params.author_slug);
	}
	async function init(authorSlug) {
		try {
			// First, get the user data using the slug to find the author_id
			userData = await fetchUserBySlug(authorSlug);

			if (!userData) {
				console.error('User not found:', authorSlug);
				author = null;
				collections = [];
				bio = null;
				return;
			}

			// Now fetch collections using the author_id from userData
			collections = await fetchUserCollections(userData.public_id);
			bio = userData?.bio || null;
			author = userData?.username || null;
		} catch (error) {
			console.error('Error fetching author data:', error);
			author = null;
			collections = [];
			bio = null;
		}
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
