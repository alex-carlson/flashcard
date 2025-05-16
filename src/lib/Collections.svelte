<script>
    import { onMount, createEventDispatcher } from "svelte";
    export let collections = [];
    let selectedCollection = "";
    let isCollapsed = true;

    const dispatch = createEventDispatcher();

    function selectCollection(collectionId) {
        // Dispatch collection ID to parent
        // close the collection list
        isCollapsed = true;
        dispatch("selectCollection", collectionId);
    }
</script>

<div>
    <button on:click={() => (isCollapsed = !isCollapsed)}>
        {isCollapsed ? "Show Collections" : "Hide Collections"}
    </button>
    {#if !isCollapsed}
        <ul>
            {#each collections as collection}
                <li on:click={() => selectCollection(collection.id)}>
                    <img
                        src={collection.items[0].image}
                        alt={collection.category}
                        style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 4 / 3;"
                    />
                    <span>
                        {collection.category}
                    </span>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    ul {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0;
        list-style: none;
        padding: 0;
        margin: 0;
        margin-top: 1rem;
    }

    li {
        background-color: #f0f0f0;
        padding: 1rem;
        text-align: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
        aspect-ratio: 4 / 3;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    li:hover {
        background-color: #e0e0e0;
    }

    ul li span {
        color: white;
        background: black;
        padding: 0.5rem;
    }
</style>
