<script>
    import { onMount } from "svelte";
    let collections = [];
    let page = 0;
    const itemsPerPage = 10;

    // fetch all collections
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
            console.log("Collections:", collections);
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    function nextPage() {
        if ((page + 1) * itemsPerPage < collections.length) {
            page++;
        }
    }

    function prevPage() {
        if (page > 0) {
            page--;
        }
    }

    $: paginatedCollections = collections.slice(
        page * itemsPerPage,
        (page + 1) * itemsPerPage,
    );

    onMount(() => {
        fetchCollections();
    });
</script>

<div class="container white">
    <h1>Explore</h1>
    <p>Explore the latest quizzems created by our community!</p>

    <!-- list collection items paginated -->
    <div class="paginatedList">
        {#each paginatedCollections as collection}
            <div class="collectionItem">
                <a href="#/{collection.author}/{collection.category}">
                    <p>{collection.category} by: {collection.author}</p>
                    <!-- get image from collections.items[0].image -->
                    <img
                        src={collection.items[0].image}
                        alt={collection.items[0].title}
                        width="100%"
                        height="auto"
                    />
                </a>
            </div>
        {/each}
    </div>

    <!-- Pagination controls -->
    <div class="paginationControls">
        <button on:click={prevPage} disabled={page === 0}>Previous</button>
        <span
            >Page {page + 1} of {Math.ceil(
                collections.length / itemsPerPage,
            )}</span
        >
        <button
            on:click={nextPage}
            disabled={(page + 1) * itemsPerPage >= collections.length}
        >
            Next
        </button>
    </div>
</div>

<style global>
    .paginatedList {
        display: flex;
        flex-wrap: wrap;
        /* center items */
        justify-content: center;
        align-items: center;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(200px, 2fr));
    }

    .collectionItem {
        padding: 1rem;
        box-sizing: border-box;
        margin: 0;
        border: solid 2px #ccc;
        border-radius: 8px;
    }

    .collectionItem a {
        text-decoration: none;
        color: inherit;
    }

    .collectionItem img {
        border-radius: 8px;
        margin-top: 0.5rem;
        max-width: 200px;
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
</style>
