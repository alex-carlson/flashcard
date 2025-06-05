<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let collection = [];
    export let sortOption = "name";
    export let sortOrder = "asc"; // Default to ascending order
    export let itemsPerPage = 10; // Default items per page
    export let sortedAndFilteredCollection = [];
    let filterText = "";
    let itemsPerPageOptions = [10, 20, 50]; // Options for items per page

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
        dispatch("sortAndFilterChange", sortedAndFilteredCollection);
    }
</script>

<details class="sort-and-filter">
    <summary>Sort/Filter</summary>
    <div class="padding align-left">
        <div class="third">
            <label for="itemsPerPage">Items per page:</label>
            <select id="itemsPerPage" bind:value={itemsPerPage}>
                {#each itemsPerPageOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </div>
        <div class="item third">
            <label for="sort">Sort by:</label>
            <select id="sort" bind:value={sortOption}>
                <option value="name">Alphabetical</option>
                <option value="date">Creation Date</option>
                <option value="size">Size</option>
            </select>
        </div>
        <div class="item third">
            <label for="order">Order:</label>
            <select id="order" bind:value={sortOrder}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
        </div>
    </div>

    <div class="filter-options padding">
        <label for="filter">Filter by:</label>
        <input
            type="text"
            id="filter"
            bind:value={filterText}
            placeholder="Type to filter..."
        />
    </div>
</details>
