<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let collection = [];
    export let sortOption = "name";
    export let sortOrder = "asc"; // Default to ascending order
    export let sortedAndFilteredCollection = [];
    let filterText = "";

    $: {
        // Sort and filter the collection based on user input
        sortedAndFilteredCollection = collection
            .filter((item) =>
                item.category.toLowerCase().includes(filterText.toLowerCase()),
            )
            .sort((a, b) => {
                let comparison = 0;
                if (sortOption === "name") {
                    comparison = a.category.localeCompare(b.category);
                } else if (sortOption === "date") {
                    comparison =
                        new Date(a.created_at) - new Date(b.created_at);
                } else if (sortOption === "size") {
                    comparison = a.items.length - b.items.length;
                }
                return sortOrder === "asc" ? comparison : -comparison;
            });
    }

    // Watch for changes in sortOption, sortOrder, or filterText
    $: if (sortedAndFilteredCollection.length > 0) {
        sendSortAndFilterChange();
    }

    // Send sortAndFilterChange event to parent component
    function sendSortAndFilterChange() {
        console.log(
            "Dispatching sortAndFilterChange event with sorted and filtered collection:",
            sortedAndFilteredCollection,
        );
        dispatch("sortAndFilterChange", sortedAndFilteredCollection);
    }
</script>

<div class="sort-and-filter">
    <div class="sort-options">
        <label for="sort">Sort by:</label>
        <select id="sort" bind:value={sortOption}>
            <option value="name">Alphabetical</option>
            <option value="date">Creation Date</option>
            <option value="size">Size</option>
        </select>
        <label for="order">Order:</label>
        <select id="order" bind:value={sortOrder}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
        </select>
    </div>

    <div class="filter-options">
        <label for="filter">Filter by:</label>
        <input
            type="text"
            id="filter"
            bind:value={filterText}
            placeholder="Type to filter..."
        />
    </div>
</div>

<style>
    .sort-and-filter {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .sort-options,
    .filter-options {
        display: flex;
        align-items: center;
        flex: 1 1 100%;
        margin-bottom: 0.5rem;
        flex-direction: column;
    }

    label {
        margin-right: 0.5rem;
    }

    select,
    input {
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: 100%;
    }

    @media (min-width: 600px) {
        .sort-and-filter {
            flex-wrap: nowrap;
        }

        .sort-options,
        .filter-options {
            flex: 0 1 auto;
            margin-bottom: 0;
            flex-direction: row;
        }

        select,
        input {
            width: auto;
        }
    }
</style>
