<script>
    import { onMount } from "svelte";
    let collections = [];

    function fetchLatestCollections() {
        const url = `${import.meta.env.VITE_API_URL}/collections/latest`;
        return fetch(url, {
            method: "GET",
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

<div class="list">
    {#await fetchLatestCollections() then data}
        {#if data.length > 0}
            <ul>
                {#each data as collection}
                    <li>
                        <a href="#/{collection.author_id}/{collection.category}">
                            {#if collection.items.length > 0}
                                <img src="{collection.items[0].image}" alt="{collection.category}" />
                            {/if}
                            <div class="vertical fill align-left">
                                <span>{collection.category} [{collection.items.length}]</span>
                                <span class="sm">{collection.author}</span>
                            </div>
                        </a>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="empty">No latest collections available.</p>
        {/if}
    {:catch error}
        <p class="error">Error loading latest collections: {error.message}</p>
    {/await}
</div>