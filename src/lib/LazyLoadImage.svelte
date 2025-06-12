<script>
    import { onMount } from "svelte";
    export let imageUrl = "";
    export let tempSize = ""; // e.g. "200px" or "100%"

    let loaded = false;

    function handleLoad() {
        loaded = true;
    }

    function handleError() {
        console.error("Error loading image");
    }
</script>

<div
    class="lazy-load"
    style={tempSize ? `width: ${tempSize}; height: ${tempSize};` : ""}
>
    {#if imageUrl}
        <img
            src={imageUrl}
            alt="Lazy Loaded Image"
            loading="lazy"
            class:loaded
            on:load={handleLoad}
            on:error={handleError}
            style={loaded ? "" : `width: ${tempSize}; height: ${tempSize};`}
        />
    {/if}
</div>

<style>
    .lazy-load {
        overflow: hidden;
        position: relative;
        display: inline-block;
        /* fallback sizing can also be done here */
        width: var(--temp-size, auto);
        height: var(--temp-size, auto);
    }

    .lazy-load img {
        display: block;
        transition: opacity 0.3s ease-in-out;
        opacity: 0;
        object-fit: cover;
    }

    .lazy-load img.loaded {
        opacity: 1;
    }
</style>
