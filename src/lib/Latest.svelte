<script>
    import { onMount } from "svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
    import { getImageUrl } from "./supabaseClient";
    import { fetchLatestCollections } from "./collections";

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
        fetchLatestCollections();
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
                            {#await getImageUrl(`${collection.author}/${collection.category}/thumbnail`) then imageUrl}
                                <LazyLoadImage imageUrl={imageUrl ? imageUrl+".jpg" : collection.items[0].image} />
                            {/await}
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
