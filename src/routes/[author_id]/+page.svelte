<script>
    import { onMount } from "svelte";
    import { params } from "svelte-spa-router";
    import ProfilePicture from "$lib/ProfilePicture.svelte";
    import { profile } from "../../stores/user";

    let collections = [];
    let author_id = null;
    let author = null;
    let bio = null;

    function fetchCollections(author_id) {
        console.log("Fetching collections for author_id:", author_id);
        // Fetch collections from the server
        fetch(`${import.meta.env.VITE_API_URL}/collections/user/${author_id}/all`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch collections");
                }
                return response.json();
            })
            .then((data) => {
                collections = data;
                // sortcollection by created_at
                collections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                author = collections[0]?.author || null;
            })
            .catch((error) => {
                console.error("Error fetching collections:", error);
            });
    }

    function fetchUser(author_id){
        console.log("Fetching user for author_id:", author_id);
        // Fetch user from the server
        fetch(`${import.meta.env.VITE_API_URL}/users/${author_id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch user");
                }
                return response.json();
            })
            .then((data) => {
                bio = data.bio;
                console.log("Fetched user data:", data);
            })
            .catch((error) => {
                console.error("Error fetching user:", error);
            });
    }

    $: if ($params) {
        author_id = $params.author_id;
        if (author_id) {
            fetchCollections(author_id);
            fetchUser(author_id);
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
                    <a href={`/#/${item.author_id}/${item.category}`}>
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