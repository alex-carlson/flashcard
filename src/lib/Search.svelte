<script>
    import { onMount, createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let collections = [];

    onMount(async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections`,
                {
                    method: "GET",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }

            const data = await response.json();
            collections = data;
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    });

    // Utility function to generate a slug
    function generateSlug(category, author) {
        return `${author}/${category}`
            .toLowerCase()
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/[^a-z0-9-/]/g, ""); // Remove invalid characters    
    }

    // pass the selected collection to the parent component
    function handleChange(event) {
        dispatch("collectionSelected", { collection: event.target.value });
        // navigate to the selected collection
        window.location.href = `#/${event.target.value}`;
    }
</script>

<div>
    <!-- create select pulling from database of collections -->
    <select on:change={handleChange}>
        <option value="">Select a collection</option>
        {#each collections as collection}
            <option value={generateSlug(collection.category, collection.author)}>{collection.category} by: {collection.author}</option>
        {/each}
    </select>
</div>

<style>

    select {
        padding: 0.5rem;
        font-size: 1rem;
        width: 100%;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin: 5px;
    }

    a {
        text-decoration: none;
        color: blue;
    }

    a:hover {
        text-decoration: underline;
    }
</style>
