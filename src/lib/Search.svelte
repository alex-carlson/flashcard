<script>
    let searchTerm = "";
    let searchResults = [];

    async function search(event) {
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

            // save data to collections
            searchResults = data;
            console.log("Search Results:", searchResults);
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
                            <img
                                src={result.items[0].image}
                                alt={result.category}
                                style="max-width: 50px; max-height: 50px; margin-right: 10px;"
                            />
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

    /* Media query for screens narrower than 300px */
    @media (max-width: 335px) {
        .searchInputContainer {
            flex-direction: column; /* Stack input and button vertically */
            gap: 0.25rem; /* Reduce spacing between input and button */
        }

        .searchInputContainer input,
        .searchInputContainer button {
            width: 100%; /* Make both input and button take up the full width */
        }
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
