<script>
    import { onMount } from "svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
    import { getImageUrl } from "./supabaseClient";
    import { fetchLatestCollections } from "./collections";

    let collectionsWithImage = [];

    // Convert timestamptz to mm/dd/yyyy format
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }

    async function loadCollections() {
        const collections = await fetchLatestCollections();

        // For each collection, attempt to fetch a valid image URL
        const resolved = await Promise.all(
            collections.map(async (collection) => {
                const path = `${collection.author}/${collection.category}/thumbnail.jpg`;
                const imageUrl = await getImageUrl(path);
                return {
                    ...collection,
                    imageUrl: imageUrl || collection.items[0]?.image || null,
                };
            }),
        );

        collectionsWithImage = resolved;
    }

    onMount(loadCollections);
</script>

<div class="list">
    {#if collectionsWithImage.length > 0}
        <ul>
            {#each collectionsWithImage as collection}
                <li>
                    <a href="#/{collection.author_id}/{collection.category}">
                        {#if collection.items.length > 0}
                            {#await getImageUrl(`${collection.author}/${collection.category}/thumbnail.jpg`)}
                                <LazyLoadImage
                                    imageUrl={collection.items[0].image}
                                    tempSize="100px"
                                />
                            {:then imageUrl}
                                <LazyLoadImage
                                    imageUrl={imageUrl
                                        ? imageUrl
                                        : collection.items[0].image}
                                    tempSize="100px"
                                />
                            {/await}
                        {/if}

                        <div class="vertical fill align-left">
                            <span>
                                {collection.category} [{collection.items
                                    .length}]
                            </span>
                            <span class="sm">
                                {collection.author} - {formatDate(
                                    collection.created_at,
                                )}
                            </span>
                        </div>
                    </a>
                </li>
            {/each}
        </ul>
    {:else}
        <p class="empty">Quizzes currently unavailable :(</p>
    {/if}
</div>
