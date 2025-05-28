<script>
    import { onMount } from "svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
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

    // convert timestamptz to mm/dd/yyyy format
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
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
                        <a
                            href="#/{collection.author_id}/{collection.category}"
                        >
                            {#if collection.items.length > 0}
                                <LazyLoadImage
                                    imageUrl={collection.items[0].image}
                                />
                            {/if}
                            <div class="vertical fill align-left">
                                <span
                                    >{collection.category} [{collection.items
                                        .length}]</span
                                >
                                <span class="sm"
                                    >{collection.author} - {formatDate(
                                        collection.created_at,
                                    )}</span
                                >
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
