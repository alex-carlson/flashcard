<script>
    import Collections from "../../lib/Collections.svelte";
    import FileUpload from "../../lib/FileUpload.svelte";
    import fetchImageFromGridFS from "../../lib/ImageFetcher.svelte";
    let token = localStorage.getItem("token");
    let username = localStorage.getItem("username") || "Anonymous";
    let category = "";
    let items = [];
    let errorMessage = "";
    let successMessage = "";
    let collections = [];
    let localItem = {id: 1, file: null, answer: ""};

    // Fetch collections from the server on load
    async function fetchCollections() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }

            const data = await response.json();
            collections = data; // Store collections in the local variable
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    async function fetchCollectionData(id) {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collection/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Error fetching collection data");
            }

            const collectionData = await response.json();

            category = collectionData.category;

            if (!collectionData.items || !Array.isArray(collectionData.items)) {
                throw new Error(
                    "Invalid collection data: items missing or not an array",
                );
            }

            // Fetch images from GridFS using their IDs
            const updatedItems = await Promise.all(
                collectionData.items.map(async (item, index) => {
                    let image = await fetchImageFromGridFS(item.id);

                    return {
                        id: item.id,
                        file: null,
                        preview: image, // Set fetched image URL
                        answer: item.answer || "",
                    };
                }),
            );

            items = [...updatedItems]; // Ensure reactivity

            console.log("Updated items:", items);
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    function handleCollectionSelection(event) {
        const collectionId = event.detail;
        fetchCollectionData(collectionId);
    }

    // Fetch collections when the page loads
    fetchCollections();

    // remove item on server based on item id
    async function removeItem(itemId) {
        console.log("Removing item:", itemId);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/remove`, 
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: itemId, collection: category }),
                })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Remove failed: ${response.statusText}`,
                        );
                    }

                    // remove item from local items array
                    items = items.filter((item) => item.id !== itemId);
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } catch (error) {
            console.error("Error removing item:", error);
            errorMessage = "Remove failed. Please try again.";
        }
    }

    // on resizeImage event, set the localItem.file to the resized image
    function handleFileChange(event) {
        // convert image blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(event.detail.resizedImage);
        reader.onload = () => {
            localItem.file = reader.result;
        };
    }

    async function uploadData() {

        const data = {
            category,
            author: username,
            item: localItem
        }

        console.log("Uploading data:", data);

        let url = import.meta.env.VITE_API_URL + "/upload";

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Upload failed: ${response.statusText}`,
                        );
                    }

                    successMessage = "Upload successful!";
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } catch (error) {
            console.error("Error uploading data:", error);
            errorMessage = "Upload failed. Please try again.";
        }
    }
</script>

<div class="container">
    {#if !token}
        <p><a href="/login">Log in</a> to upload data.</p>
    {:else}
     {#if collections.length > 0}
        <Collections
            {collections}
            on:selectCollection={handleCollectionSelection}
        />
    {/if}
        <input
            type="text"
            bind:value={category}
            placeholder="Enter a category"
        />

        {#each items as item, index}
            <div class="item">
                <img
                    src={item.preview}
                    alt="Preview"
                    style="max-width: 100px; max-height: 100px; margin-top: 10px;"
                />
                <span>{item.answer}</span>
                <button
                    class="remove"
                    on:click={() => removeItem(item.id)}>X</button
                >
            </div>
        {/each}

        <!-- on submit form, call UploadFile -->
        <form on:submit|preventDefault={uploadData}>
            <FileUpload on:resizeImage={handleFileChange} />
            {#if localItem.file}
                <img
                    src={localItem.file}
                    alt="Preview"
                    style="max-width: 100px; max-height: 100px; margin-top: 10px;"
                />
            {/if}
            <input
                type="text"
                bind:value={localItem.answer}
                placeholder="Enter an answer"
            />
            <button type="button" on:click={uploadData}>Add item</button>
        </form>

        {#if errorMessage}
            <p style="color: red">{errorMessage}</p>
        {/if}
        {#if successMessage}
            <p style="color: green">{successMessage}</p>
        {/if}
    {/if}
</div>

<style>
    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 1rem;
        /* vertical align elements inside of container */
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        background-color: #f9f9f9;
        border-radius: 5px;
        margin-top: 40px;
        color: #303030;
    }

    .container input,
    .container button {
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #dedede;
        color: #373737;
        height: 40px;
    }
    .container .item {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        width: 100%;
        justify-content: center;
        justify-items: center;
    }

    .container .remove {
        background-color: #ff0000;
        color: #fff;
        border: none;
        border-radius: 5px;
        padding: 0.5rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
    }

    .container .item input[type="file"] {
        max-width: 200px;
    }
</style>
