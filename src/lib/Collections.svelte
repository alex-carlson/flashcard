<script>
    import { onMount, createEventDispatcher } from "svelte";
    let collections = [];
    let selectedCollection = "";
    import {sanitize} from "../lib/utils.js";

    const dispatch = createEventDispatcher();

    // Fetch collections when the component mounts
    onMount(async () => {
        const username = localStorage.getItem("username");
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/${username}/collections`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                },
            );

            const contentType = res.headers.get("Content-Type");

            if (
                res.ok &&
                contentType &&
                contentType.includes("application/json")
            ) {
                collections = await res.json();
            } else {
                const responseText = await res.text(); // Get raw text if it's not JSON
                console.error(
                    "Failed to fetch collections. Response is not JSON.",
                    responseText,
                );
            }
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    });

    function selectCollection(collectionId) {
        // Dispatch collection ID to parent
        dispatch("selectCollection", collectionId);
    }
</script>

<div>
    <label for="collections">Choose a collection:</label>
    <select on:change={(e) => selectCollection(e.target.value)}
        >
        <option value="">Select a collection</option>
        {#each collections as collection}
            <option value={collection.author + "/" + collection.category} on:click={selectCollection(collection.author + "/" + collection.category)}>{collection.category}</option>
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
