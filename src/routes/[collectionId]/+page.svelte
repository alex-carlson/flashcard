<script>
    import { params } from "svelte-spa-router";

    let collectionId;

    // Reactive statement to get the collectionId from the route
    $: collectionId = $params.collectionId;

    console.log("Collection ID:", collectionId);
</script>

<div>
    <h1>Collection ID: {collectionId}</h1>
</div>