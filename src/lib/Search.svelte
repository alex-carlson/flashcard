<script>
    import { onMount, createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let collections = [];
    let searchTerm = "";
    let searchResults = [];

    onMount(async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections`,
                {
                    method: "GET",
                },
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

    // pass the selected collection to the parent component
    function handleChange(event) {
        dispatch("collectionSelected", { collection: event.target.value });
        // navigate to the selected collection
        window.location.href = `#/${event.target.value}`;
    }

    async function search(event) {
        console.log("Searching with term:", event.detail.query);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/search?searchTerm=${event.detail.query}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch search results");
            }

            const data = await response.json();

            console.log("Search results:", data);

            // save data to collections
            searchResults = data;
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    }
</script>

<div>
    <!-- create select pulling from database of collections -->
    <select on:change={handleChange}>
        <option value="">Select a collection</option>
        {#each collections as collection}
            <option value={collection.author + "/" + collection.category}
                >{collection.category} by: {collection.author}</option
            >
        {/each}
    </select>
    <input
        type="text"
        placeholder="Search..."
        bind:value={searchTerm}
        on:input={(event) => {
            searchTerm = event.target.value;
            // if pressed enter, call search
            if (event.key === "Enter") {
                console.log("Searching with term:", searchTerm);
                search({ detail: { query: searchTerm } });
            }
        }}
        on:keydown={(event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                search({ detail: { query: searchTerm } });
            }
        }}
    />
    <button
        on:click={(event) => {
            event.preventDefault();
            const query = event.target.previousElementSibling.value;
            search({ detail: { query } });
        }}>Search</button
    >

    {#if searchResults.length > 0}
        <div class="searchResults">
            <ul>
                {#each searchResults as result}
                    <li>
                        <a href="#/{result.author}/{result.category}"
                            >{result.category} by: {result.author}</a
                        >
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    select {
        padding: 0.5rem;
        font-size: 1rem;
        width: 100%;
    }
    input {
        padding: 0.5rem;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
    }
    button {
        padding: 0.5rem;
        font-size: 1rem;
        width: 100%;
    }

    .searchResults {
        margin-top: 1rem;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin: 0.5rem 0;
    }

    li:nth-child(even) {
        background-color: #f9f9f9;
    }

    a {
        text-decoration: none;
        color: #007bff;
    }
</style>
