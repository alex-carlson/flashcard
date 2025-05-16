<script>
    import { createEventDispatcher } from "svelte";
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
                    <a href="#" on:click|preventDefault={() => selectCollection(collection.id)}>
                        <img
                            src={collection.items[0] ? collection.items[0].image : ""}
                            alt={collection.category}
                        />
                        <span>
                            {collection.category}
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>