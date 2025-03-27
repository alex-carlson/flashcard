<script>
    import { onMount } from "svelte";
    import { params } from "svelte-spa-router";

    let collections = [];
    let author = null;

    function fetchCollections(author) {
        // Fetch collections from the server
        fetch(
            `${import.meta.env.VITE_API_URL}/collections/user/${author}/all`,
        )
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
        author = $params.author;

        if (author) {
            fetchCollections(author);
        }
    }
</script>

<div>
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

<style>
    ul {
        list-style-type: none;
        padding: 0;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
    }

    li {
        margin-bottom: 0.5rem;
        position: relative;
    }

    li span {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 0.5rem;
        text-align: center;
    }
</style>
