<script>
    import { onMount } from "svelte";
    import { fetchTaggedCollections } from "$lib/api/collections";
    export let tag = "General Knowledge";

    let collections = [];


    onMount(async () => {
        collections = await fetchTaggedCollections(tag, 5);
    });
</script>

<div class="weekly-category">
    <ul>

    </ul>
</div>