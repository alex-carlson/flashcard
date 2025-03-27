<script>
    import { onMount, createEventDispatcher } from "svelte";
    export let collections = [];
    let selectedCollection = "";

    const dispatch = createEventDispatcher();

    function selectCollection(collectionId) {
        // Dispatch collection ID to parent
        dispatch("selectCollection", collectionId);
    }
</script>

<div>
    <label for="collections">Choose a collection:</label>
    <select on:change={(e) => selectCollection(e.target.value)}>
        <option value="">Select a collection</option>
        {#each collections as collection}
            <option
                value={collection.id}>{collection.category}</option
            >
        {/each}
    </select>
</div>

{#if selectedCollection}
    <p>You selected collection with ID: {selectedCollection}</p>
{/if}

<style>
    select {
        padding: 0.5rem;
        margin: 0.5rem 0;
    }
</style>
