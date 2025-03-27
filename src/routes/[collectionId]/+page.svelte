<script>
    import { params } from "svelte-spa-router";
    import FlashCards from "../../lib/FlashCards.svelte";

    let author, category;

    // Extract author and collectionName from the route params
    $: if ($params) {
        author = $params.author;
        category = $params.category;
    }
</script>

<div>
    <!-- if collectionId is null, show loading instead -->
    {#if author == null || category == null}
        <p>Loading...</p>
    {:else}
        <FlashCards {author} collection={category} />
    {/if}
</div>
