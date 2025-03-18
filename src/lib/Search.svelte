<script>
    import { onMount } from "svelte";
    import { sheetData, bestMatch } from "../lib/sheetStore";
    import { writable } from "svelte/store";

    const SHEET_ID = import.meta.env.VITE_PUBLIC_SHEET_ID;
    const API_KEY = import.meta.env.VITE_PUBLIC_API_KEY;

    let searchTerm = "";
    let sheetNames = writable([]);
    let sortedMatches = writable([]);
    let selectedSheet = "";

    async function fetchSheetNames() {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`,
            );
            const data = await response.json();
            if (data.sheets) {
                sheetNames.set(
                    data.sheets.map((sheet) => sheet.properties.title),
                );
            }
        } catch (error) {
            console.error("Error fetching sheet names:", error);
        }
    }

    function findMatches(term, names) {
        if (names.length === 0) return [];

        const matches = names.map((name) => {
            const similarity = getSimilarity(
                term.toLowerCase(),
                name.toLowerCase(),
            );
            return { name, similarity };
        });

        return matches.filter((match) => match.similarity > 0);
    }

    function getSimilarity(a, b) {
        let matches = 0;
        const minLength = Math.min(a.length, b.length);

        for (let i = 0; i < minLength; i++) {
            if (a[i] === b[i]) matches++;
        }

        return matches / Math.max(a.length, b.length);
    }

    async function searchSheet() {
        let names;
        sheetNames.subscribe((value) => (names = value))();
        const matches = findMatches(searchTerm, names);

        if (matches.length > 0) {
            // Sort matches by similarity in descending order
            const sorted = matches.sort((a, b) => b.similarity - a.similarity);
            sortedMatches.set(sorted);
        } else {
            sheetData.set([]);
            bestMatch.set("No match found");
            sortedMatches.set([]);
        }
    }

    async function fetchSheetData(sheetName) {
        try {
            const range = `${sheetName}!A1:B100`;
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`,
            );
            const data = await response.json();
            if (data.values) {
                sheetData.set(data.values);
                bestMatch.set(sheetName);
            } else {
                sheetData.set([]);
            }
        } catch (error) {
            console.error("Error fetching sheet data:", error);
        }
    }

    function handleSheetClick(sheetName) {
        fetchSheetData(sheetName);
    }

    function handleDropdownSelect(event) {
        selectedSheet = event.target.value;
        if (selectedSheet) {
            fetchSheetData(selectedSheet);
        }
    }

    onMount(fetchSheetNames);
</script>

<div>
    <!-- Search Bar -->
    <!-- <input
        type="text"
        bind:value={searchTerm}
        placeholder="Enter search term..."
    />
    <button on:click={searchSheet}>Search</button> -->

    <!-- Dropdown for all sheets -->
    <select on:change={handleDropdownSelect}>
        <option value="">Select a sheet...</option>
        {#each $sheetNames as name}
            <option value={name}>{name}</option>
        {/each}
    </select>

    <!-- Search Results -->
    {#if $sortedMatches.length > 0}
        <ul>
            {#each $sortedMatches as { name, similarity }}
                <li>
                    <a
                        href="#"
                        on:click={(e) => {
                            e.preventDefault();
                            handleSheetClick(name);
                        }}
                    >
                        {name} (Similarity: {similarity.toFixed(2)})
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    input,
    button,
    select {
        margin: 10px;
    }

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
