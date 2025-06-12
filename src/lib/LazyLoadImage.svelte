<script>
    import { onMount } from "svelte";
    export let imageUrl = "";

    let loaded = false;

    function handleLoad() {
        loaded = true;
    }

    function handleError() {
        console.error("Error loading image");
    }

    onMount(() => {
        // Component mounted
    });
</script>

<div class="lazy-load">
    {#if imageUrl}
        <img
            src={imageUrl}
            alt="Lazy Loaded Image"
            loading="lazy"
            class:loaded={loaded}
            on:load={handleLoad}
            on:error={handleError}
        />
    {/if}
</div>

<style>
    .lazy-load {
        /* overflow: hidden; */
        /* position: relative; */
    }

    .lazy-load img {
        /* display: block; */
        /* transition: opacity 0.3s ease-in-out; */
        /* opacity: 0; */
    }

    .lazy-load img.loaded {
        /* opacity: 1; */
    }
</style>
