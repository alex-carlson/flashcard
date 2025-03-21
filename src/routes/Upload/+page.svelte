<script>
    import Collections from "../../lib/Collections.svelte";
    import FileUpload from "../../lib/FileUpload.svelte";
    import { fetchImageFromGridFS } from "../../lib/ImageFetcher";
    import { selectedCollection } from "../../stores/collectionStore";
    import { onDestroy } from "svelte";
    let token = localStorage.getItem("token");
    let username = localStorage.getItem("username") || "Anonymous";
    let category = "";
    let items = [];
    let errorMessage = "";
    let successMessage = "";
    let collections = [];
    let collectionId;
    let collection = null;
    let localItem = {id: 1, file: null, answer: ""};
    // import font awesome icon fa-pen-to-square
    import Fa from "svelte-fa";
    import {faPenToSquare, faSquareMinus} from "@fortawesome/free-solid-svg-icons";

    // Subscribe to the store
    const unsubscribe = selectedCollection.subscribe((value) => {
        collection = value;
        if (collection) {
            console.log("Selected collection:", collection);
            fetchCollectionData(collection.id); // Fetch data for the selected collection
        }
    });

    // Cleanup the subscription when the component is destroyed
    onDestroy(() => {
        unsubscribe();
    });

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
        collectionId = event.detail;
        fetchCollectionData(collectionId);
    }

    // Fetch collections when the page loads
    fetchCollections();

    // remove item on server based on item id
    async function removeItem(itemId) {
        let url = import.meta.env.VITE_API_URL + "/remove";
        const data = {
            collection: category,
            id: itemId,
        }

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
                            `Remove failed: ${response.statusText}`,
                        );
                    }

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

    async function editItem(itemId) {
        let url = import.meta.env.VITE_API_URL + "/edit";
        const data = {
            collection: category,
            id: itemId,
            answer: items.find((item) => item.id === itemId).answer,
        }

        try {
            const respone = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then((response) => {
                if(!response.ok){
                    throw new Error(`Edit failed with error: ${response.statusText}`);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
        }
        catch (error) {
            console.error("Error editing item:", error);
            errorMessage = "Edit failed. Please try again.";
        }
    }

    function onEditClick(itemId){
        //move the data to the localItem and scroll down to form
        localItem = items.find((item) => item.id === itemId);
        const form = document.querySelector("form");
        // load image into file input
        const fileInput = form.querySelector("input[type='file']");
        fileInput.files = localItem.file;
        form.scrollIntoView({behavior: "smooth"});
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

        //clear form
        localItem = {id: 1, file: null, answer: ""};
        //refresh items
        fetchCollectionData(collectionId);
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
                />
                <span>{item.answer}</span>
                <button 
                    class="edit"
                    on:click={() => onEditClick(item.id)}
                    >
                    <Fa icon={faPenToSquare} />
                </button>
                <button
                    class="remove"
                    on:click={() => removeItem(item.id)}>
                    <Fa icon={faSquareMinus} />
                </button
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
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    /* make every other item gray */
    .container .item:nth-child(even) {
        background-color: #f0f0f0;
    }

    .container .item span {
        /* fill extra space */
        flex-grow: 1;
        font-size: 1.5rem;
    }

    .container .item img {
        width: 120px;
    }

    .container .item .remove {
        /* transparent background */
        background-color: transparent;
        color: #b73232;
        font-size: 2.5rem;
    }
    
    .container .item button {
        border: none;
        border-radius: 5px;
        padding: 0.5rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;        
    }

    .container .item input[type="file"] {
        max-width: 200px;
    }
</style>
