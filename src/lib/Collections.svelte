<script>
    import { createEventDispatcher } from "svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
    export let collections = [];
    let isCollapsed = true;

    const dispatch = createEventDispatcher();

    function selectCollection(collectionId) {
        // Dispatch collection ID to parent
        // close the collection list
        isCollapsed = true;
        dispatch("selectCollection", collectionId);
    }
</script>

<div class="list condensed">
    <button on:click={() => (isCollapsed = !isCollapsed)}>
        {isCollapsed ? "Show Collections" : "Hide Collections"}
    </button>
    {#if !isCollapsed}
        <ul>
            {#each collections as collection}
                <li>
                    <a
                        href="#"
                        on:click|preventDefault={() =>
                            selectCollection(collection.id)}
                    >
                        {#if collection.items.length > 0}
                            <LazyLoadImage
                                imageUrl={collection.items[0].image}
                            />
                        {/if}
                        <span>
                            {collection.category}
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
