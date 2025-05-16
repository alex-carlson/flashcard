<script>
    import SortAndFilter from "../../lib/SortAndFilter.svelte";
    import { onMount } from "svelte";

    let collections = []; // Original collections array
    let filteredCollections = []; // Array for sorted/filtered collections
    let page = 0;
    let sortOption = "name"; // Default sort option
    let itemsPerPage = 10; // Default items per page
    let itemsPerPageOptions = [10, 20, 50]; // Options for items per page

    // Fetch all collections
    async function fetchCollections() {
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
            console.log("Fetched collections:", collections);
            filteredCollections = data; // Initialize filteredCollections
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    function nextPage() {
        if ((page + 1) * itemsPerPage < filteredCollections.length) {
            page++;
        }
    }

    function prevPage() {
        if (page > 0) {
            page--;
        }
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }

    // Reactive statement for paginated collections
    $: paginatedCollections = filteredCollections.slice(
        page * itemsPerPage,
        (page + 1) * itemsPerPage,
    );

    // Reset page to 0 when itemsPerPage changes
    $: {
        page = 0;
    }

    onMount(() => {
        fetchCollections();
    });
</script>

<div class="container white">
    <h1>Explore</h1>

    <div class="sort-and-filter padding">
        <!-- Items per page selector -->
        <div class="itemsPerPageSelector">
            <label for="itemsPerPage">Items per page:</label>
            <select id="itemsPerPage" bind:value={itemsPerPage}>
                {#each itemsPerPageOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </div>
        <SortAndFilter
            collection={collections}
            bind:sortOption
            on:sortAndFilterChange={(event) => {
                filteredCollections = event.detail; // Update filteredCollections
                page = 0; // Reset to the first page after sorting/filtering
            }}
        />
    </div>

    <div class="list">
        <ul>
            {#each paginatedCollections as collection}
                <li>
                    <a href="#/{collection.author_id}/{collection.category}">
                        <img src={collection.items[0].image} alt="">
                        <p>{collection.category}
                            {#if sortOption === "date"}
                             {formatTimestamp(collection.created_at)}
                            {:else if sortOption === "size"}
                             [{collection.items.length}]
                            {/if}
                        </p>
                    </a>
                </li>
            {/each}
        </ul>
    </div>

    <!-- Pagination controls -->
    <div class="paginationControls">
        <button on:click={prevPage} disabled={page === 0}>Previous</button>
        <span>
            Page {page + 1} of {Math.ceil(
                filteredCollections.length / itemsPerPage,
            )}
        </span>
        <button
            on:click={nextPage}
            disabled={(page + 1) * itemsPerPage >= filteredCollections.length}
        >
            Next
        </button>
    </div>
</div>