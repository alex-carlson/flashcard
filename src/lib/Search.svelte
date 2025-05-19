<script>
    let searchTerm = "";
    let searchResults = [];
    // import fontawesome search icon
    import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
    import Fa from "svelte-fa";

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
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    }
</script>

<div class="searchForm">
    <div class="text-field inline">
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
            <Fa icon={faMagnifyingGlass} />
        </button>
    </div>

    {#if searchResults.length > 0}
        <div class="searchResults">
            <ul>
                {#each searchResults as result}
                    <li>
                        <a href="#/{result.author_id}/{result.category}">
                            {#if result.items.length > 0}
                            <img
                                src={result.items[0].image}
                                alt={result.category}
                                style="max-width: 50px; max-height: 50px; margin-right: 10px;"
                            />
                            {/if}
                            {result.category} by: {result.author}
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>