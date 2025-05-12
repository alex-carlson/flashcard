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

    <div class="sort-and-filter">
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

    <!-- List collection items paginated -->
    <div class="paginatedList">
        {#each paginatedCollections as collection}
            <div
                class="collectionItem"
                style="background-image: url({collection.items[0]
                    .image}); background-size: cover; background-position: center;"
            >
                <a href="#/{collection.author}/{collection.category}">
                    <p>{collection.category} by: {collection.author}</p>
                    <!-- if sort option is date, show created_at. if sort option is size, show [items.length]-->
                    {#if sortOption === "date"}
                        <p>
                            Created: {formatTimestamp(collection.created_at)}
                        </p>
                    {:else if sortOption === "size"}
                        <p>{collection.items.length} Cards</p>
                    {/if}
                </a>
            </div>
        {/each}
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

<style global>
    .itemsPerPageSelector {
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-direction: row;
    }

    .paginatedList {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
        padding: 1rem;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .collectionItem {
        display: flex;
        flex-direction: column;
        background: #f0f0f0;
        border-radius: 15px;
        position: relative;
        overflow: hidden;
        height: 120px;
    }

    .collectionItem a {
        text-decoration: none;
        color: white;
        background: rgba(0, 0, 0, 0.7);
        position: absolute;
        bottom: 0;
        width: 100%;
        text-align: center;
        padding: 0.5rem;
    }

    .paginationControls {
        margin-top: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }

    .paginationControls button {
        padding: 0.5rem 1rem;
        border: none;
        background-color: var(--color-primary, #007bff);
        color: white;
        border-radius: 4px;
        cursor: pointer;
    }

    .paginationControls button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .sort-and-filter {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
        .sort-and-filter {
            flex-direction: column;
            gap: 1rem;
        }

        .itemsPerPageSelector {
            width: 100%;
            flex-direction: column;
        }
    }
</style>
