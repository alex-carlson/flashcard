<script>
    import { onMount } from "svelte";
    import { params } from "svelte-spa-router";

    let collections = [];
    let author = null;

    function fetchCollections(author) {
        // Fetch collections from the server
        fetch(`${import.meta.env.VITE_API_URL}/collections/user/${author}/all`)
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

<style>
    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
    }

    li {
        margin-bottom: 0.5rem;
        width: 100%;
    }

    ul li a {
        display: block;
        position: relative;
        overflow: hidden;
        border-radius: 0.5rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }

    ul li a img {
        width: 100%;
        height: auto;
        display: block;
    }

    li span {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem;
        text-align: center;
    }
</style>
