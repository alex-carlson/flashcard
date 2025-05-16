<script>
    import { onMount } from "svelte";
    let collections = [];

    function fetchLatestCollections() {
        const url = `${import.meta.env.VITE_API_URL}/collections/latest`;
        return fetch(url, {
            method: "GET",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch latest collections");
                }
                return response.json();
            })
            .catch((error) => {
                console.error("Error fetching latest collections:", error);
            });
    }

    onMount(() => {
        fetchLatestCollections()
            .then((data) => {
                collections = data;
            })
            .catch((error) => {
                console.error("Error fetching latest collections:", error);
            });
    });
</script>

<div>
    <!-- wait for collections to load -->
    {#await fetchLatestCollections() then data}
        {#if data.length > 0}
            <ul>
                {#each data as collection}
                    <li>
                        <a href="#/{collection.author_id}/{collection.category}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; text-decoration: none;">
                            <img src="{collection.items[0].image}" alt="{collection.category}" style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 4 / 3;" />
                            <span style="background-color: rgba(0,0,0,0.7); color: white; padding: 0.5rem 1rem; border-radius: 4px; margin-top: -2.5rem; position: relative; z-index: 1;">
                                {collection.category}
                            </span>
                        </a>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>No latest collections available.</p>
        {/if}
    {:catch error}
        <p>Error loading latest collections: {error.message}</p>
    {/await}
</div>

<style global>
    ul {
        list-style-type: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    li {
        position: relative; /* Enable positioning for child elements */
        overflow: hidden;
        aspect-ratio: 4 / 3; /* Force 3:4 aspect ratio */
    }

    a {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-align: center;
        text-decoration: none;
    }

    a:hover {
        background-color: rgba(0, 0, 0, 0.9);
        transition: background-color 0.3s ease;
        text-decoration: underline;
    }
</style>
