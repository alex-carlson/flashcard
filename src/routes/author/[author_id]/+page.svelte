<script>
	import ProfilePicture from '$lib/ProfilePicture.svelte';
	import { fetchUser, fetchUserCollections } from '$lib/user';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	let collections = [];
	let author_id = null;
	let author = null;
	let bio = null;
	let userData = null;

	async function init(author_id) {
		collections = await fetchUserCollections(author_id);
		userData = await fetchUser(author_id);
		bio = userData?.bio || null;
		if (!author) author = userData?.username || null;
	}

	$: {
		const params = get(page).params;
		if (params && params.author_id) {
			author_id = params.author_id;
			init(author_id);
		}
	}
</script>

<div class="container padding list white">
	{#if author}
		<div class="profile">
			<div class="left">
				<ProfilePicture userId={author_id} size={150} isRound={true} />
			</div>
			<div class="right">
				<h2>{author}</h2>
				<p>{collections.length} quizzes published</p>
			</div>
			<div class="clear">
				{#if bio && bio.length > 0}
					<p>{bio}</p>
				{/if}
			</div>
		</div>
		<ul>
			{#each collections as item}
				<li>
					<a href={`/${item.author_id}/${item.category}`}>
						{#if item.items.length > 0}
							<img src={item.items[0].image} alt={item.category} />
						{/if}
						<span>{item.category} - {item.items.length}</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Loading...</p>
	{/if}
</div>
