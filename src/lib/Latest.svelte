<script>
import { onMount } from "svelte";
let collections = [];

function fetchLatestCollections() {
    const url = `${import.meta.env.VITE_API_URL}/collections/latest`;
    return fetch(url, {
        method: "GET"
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch latest collections");
        }
        return response.json();
    })
    .catch((error) => {
        console.error("Error fetching latest collections:", error);
    });
}

onMount(() => {
    fetchLatestCollections()
        .then((data) => {
            collections = data;
        })
        .catch((error) => {
            console.error("Error fetching latest collections:", error);
        });
});

</script>

<div class="container">
<!-- wait for collections to load -->
{#await fetchLatestCollections() then data}
    {#if data.length > 0}
        <ul>
            {#each data as collection}
                <li>
                    <a href="#/{collection.author}/{collection.category}">
                        {collection.category} by: {collection.author}
                    </a>
                </li>
            {/each}
        </ul>
    {:else}
        <p>No latest collections available.</p>
    {/if}
{:catch error}
    <p>Error loading latest collections: {error.message}</p>
{/await}
</div>

<style global>
    .container {
        padding: 1rem;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin: 0.5rem 0;
    }

    li:nth-child(even) {
        background-color: #f0f0f0;
    }

    a {
        text-decoration: none;
        color: #007bff;
        padding: 1em;
    }

    a:hover {
        text-decoration: underline;
    }
</style>