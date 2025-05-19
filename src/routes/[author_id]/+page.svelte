<script>
    import { onMount } from "svelte";
    import { params } from "svelte-spa-router";

    let collections = [];
    let author_id = null;
    let author = null;

    function fetchCollections(author) {
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
            })
            .catch((error) => {
                console.error("Error fetching collections:", error);
            });
    }

    $: if ($params) {
        author_id = $params.author_id;

        // set page title to <author>'s collections
        document.title = `${author_id}'s Collections`;

        if (author_id) {
            fetchCollections(author_id);
        }
    }
</script>

<div class="container">
    {#if author}
        <h1>Collections for {author}</h1>
        <ul>
            {#each collections as item}
                <li>
                    <a href={`/#/${item.author}/${item.category}`}>
                        <img src={item.items[0].image} alt={item.category} />
                        <span>{item.category} - {item.items.length}</span>
                    </a>
                </li>
            {/each}
        </ul>
    {:else}
        <p>Loading...</p>
    {/if}
</div>