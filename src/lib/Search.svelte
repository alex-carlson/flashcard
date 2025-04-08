<script>
    import { onMount, createEventDispatcher } from "svelte";

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

<div class="searchForm">
    <div class="searchInputContainer">
        <input
            type="text"
            placeholder="Search..."
            bind:value={searchTerm}
            on:input={(event) => {
                searchTerm = event.target.value;
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
            }}
        >
            Search
        </button>
    </div>

    {#if searchResults.length > 0}
        <div class="searchResults">
            <ul>
                {#each searchResults as result}
                    <li>
                        <a href="#/{result.author}/{result.category}">
                            {result.category} by: {result.author}
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    .searchInputContainer {
        display: flex;
        align-items: center; /* Vertically align input and button */
        gap: 0.5rem; /* Add spacing between input and button */
    }

    .searchInputContainer input {
        flex: 1; /* Make the input take up the remaining space */
        min-height: 60px;
        padding: 0.5rem;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .searchInputContainer button {
        min-height: 60px;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .searchInputContainer button:hover {
        background-color: #0056b3;
    }
    .searchForm {
        display: flex;
        flex-direction: column;
    }

    .searchForm > * {
        min-height: 60px;
        padding: 0.5rem;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
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
        margin: 0;
        padding: 2em;
    }

    li:nth-child(even) {
        background-color: #f9f9f9;
    }

    a {
        text-decoration: none;
        color: #007bff;
    }
</style>
