<script>
    import { params } from "svelte-spa-router";
    import FlashCards from "../../lib/FlashCards.svelte";

    let collectionId = null;
    
    // Function to fetch the collectionId from the server
    async function getCollectionId(author, collectionName) {
        console.log("Fetching collection ID:", author, collectionName);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collectionId/${author}/${collectionName}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection ID");
            }

            const data = await response.json();

            console.log(data);

            // Assuming the server returns a single collection or an array of collections
            if (data && data._id) {
                return data._id; // Return the collectionId
            } else {
                throw new Error("Collection not found");
            }
        } catch (error) {
            console.error("Error fetching collection ID:", error);
            return null;
        }
    }

    // Extract author and collectionName from the route params
    let author, collectionName;

    $: if ($params) {
        author = $params.author;
        collectionName = $params.category;

        console.log(author, collectionName);

        if (author && collectionName) {
            getCollectionId(author, collectionName).then((id) => {
                collectionId = id;
            });
        }
    }
</script>

<div>
    <!-- if collectionId is null, show loading instead -->
    {#if collectionId === null}
        <p>Loading...</p>
    {:else}
        <FlashCards collectionId={collectionId} />
    {/if}
</div>