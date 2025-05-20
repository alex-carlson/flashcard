<script>
    import { params } from "svelte-spa-router";
    import FlashCards from "../../lib/FlashCards.svelte";

    // Declare variables to avoid reference errors
    let author_id = null;
    let category = null;

    // Extract author_id and collectionName from the route params
    $: if ($params) {
        author_id = $params.author_id;
        category = $params.category;

        // set page title to <category> by <author_id>
        document.title = `${category}`;
    }
</script>

<div>
    <!-- if collectionId is null, show loading instead -->
    {#if author_id == null || category == null}
        <p>Loading...</p>
    {:else}
        <FlashCards author_id={author_id} collection={category} />
    {/if}
</div>
