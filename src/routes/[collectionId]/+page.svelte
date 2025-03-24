<script>
    import { params } from "svelte-spa-router";
    import FlashCards from "../../lib/FlashCards.svelte";

    let author, collectionName;

    // Extract author and collectionName from the route params
    $: if ($params) {
        author = $params.author;
        collectionName = $params.category;
    }
</script>

<div>
    <!-- if collectionId is null, show loading instead -->
    {#if author == null || collectionName == null}
        <p>Loading...</p>
    {:else}
        <FlashCards {author} collection={collectionName} />
    {/if}
</div>
