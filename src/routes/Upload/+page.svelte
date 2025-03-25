<script>
    import Collections from "../../lib/Collections.svelte";
    import FileUpload from "../../lib/FileUpload.svelte";
    import { onMount } from "svelte";
    import Fa from "svelte-fa";
    import {
        faPenToSquare,
        faSquareMinus,
        faFloppyDisk,
        faBan,
    } from "@fortawesome/free-solid-svg-icons";
    let token = localStorage.getItem("token");
    let username = localStorage.getItem("username");
    let category = "";
    let items = [];
    let errorMessage,
        successMessage = "";
    let collections = [];
    let editableItemId = null;
    let localItem = { id: 1, file: null, answer: "" };
    let isRenaming = true;

    // Fetch collections from the server on load
    async function fetchCollections() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/${username}/all-collections`,
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

            collections = await response.json();
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    async function fetchCollectionData(detail) {
        isRenaming = false;
        const [username, collection] = detail.split("/");
        const url = `${import.meta.env.VITE_API_URL}/collections/${username}/${collection}`;
        console.log("Fetching collection data from:", url);
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Error fetching collection data");
            }

            const collectionData = await response.json();

            console.log("Collection data:", collectionData);

            category = collectionData.category;

            if (!collectionData.items || !Array.isArray(collectionData.items)) {
                throw new Error(
                    "Invalid collection data: items missing or not an array",
                );
            }

            items = collectionData.items;
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    async function createCollection() {
        let url =
            import.meta.env.VITE_API_URL + "/collections/createCollection";
        const data = {
            category,
            author: username,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("Error creating collection:", error);
            errorMessage = "Create failed. Please try again.";
        }
    }

    async function renameCollection() {
        isRenaming = false;
        //rename collection on server
        let url = import.meta.env.VITE_API_URL + "/renameCollection";

        console.log("Renaming to: ", category);

        const data = {
            category,
            author: username,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to rename collection");
            }

            console.log("Collection renamed successfully");
        } catch (error) {
            console.error("Error renaming collection:", error);
            errorMessage = "Rename failed. Please try again.";
        }
    }

    function handleCollectionSelection(event) {
        fetchCollectionData(event.detail);
    }

    onMount(() => {
        fetchCollections();
    });

    // remove item on server based on item id
    async function removeItem(itemAnswer) {
        let url = import.meta.env.VITE_API_URL + "/items/remove";
        const data = {
            category,
            itemAnswer,
        };

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

                    // remove the item from the items array
                    items = items.filter((item) => item.answer !== itemAnswer);
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
        let url = import.meta.env.VITE_API_URL + "/items/edit";
        const data = {
            collection: category,
            id: itemId,
            answer: items.find((item) => item.id === itemId).answer,
        };

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
                            `Edit failed with error: ${response.statusText}`,
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } catch (error) {
            console.error("Error editing item:", error);
            errorMessage = "Edit failed. Please try again.";
        }
    }

    function onEditClick(itemId) {
        editableItemId = itemId;
        //move the data to the localItem and scroll down to form
        localItem = { ...items.find((item) => item.id === itemId) };
    }

    function saveEdit() {
        try {
            // Update the item in the items array
            items = items.map((item) =>
                item.id === editableItemId ? { ...item, ...localItem } : item,
            );
            editableItemId = null; // Reset editable item ID
            editItem(localItem.id);
        } catch (error) {
            console.error("Error saving item:", error);
            errorMessage = "Save failed. Please try again.";
        }
    }

    function cancelEdit() {
        editableItemId = null;
        localItem = null;
    }

    function toggleRenaming() {
        isRenaming = !isRenaming;
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

    function confirmDelete() {
        //show popup to confirm delete
        if (confirm("Are you sure you want to proceed?")) {
            deleteCollection();
            alert("Collection Deleted! 💨");
        }
    }

    async function deleteCollection() {
        let url =
            import.meta.env.VITE_API_URL +
            `/collections/${username}/${category}`;
        const data = {
            category,
            username,
        };

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Delete failed: ${response.statusText}`,
                        );
                    }

                    // remove the item from the items array
                    collections = collections.filter(
                        (collection) => collection.category !== category,
                    );
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } catch (error) {
            console.error("Error removing item:", error);
            errorMessage = "Remove failed. Please try again.";
        }
    }

    async function uploadData() {
        const data = {
            category,
            author: username,
            item: {
                name: localItem.answer,
                image: null,
            },
            base64Image: localItem.file,
            folder: `${username}/${category}`,
        };

        let url = import.meta.env.VITE_API_URL + "/items/upload";

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

                    //append the new item to the items array
                    items = [
                        ...items,
                        {
                            id: items.length + 1,
                            answer: localItem.answer,
                            image: localItem.file,
                        },
                    ];

                    items = [...items];
                    // clear file and answer
                    localItem = { id: 1, file: null, answer: "" };
                    // empty form data
                    document.querySelector("form").reset();
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
        {#if isRenaming}
            <input
                type="text"
                bind:value={category}
                placeholder="Enter a category"
            />
            <button on:click={createCollection}>Save</button>
        {:else}
            <h2>{category}</h2>
            <button on:click={toggleRenaming}>Rename</button>
        {/if}

        {#each items as item, index}
            <div class="item">
                {#if editableItemId === item.id}
                    <img src={localItem.image} alt="Preview" />
                    <input
                        type="text"
                        bind:value={localItem.answer}
                        placeholder="Enter an answer"
                    />
                    <button on:click={saveEdit}
                        ><Fa icon={faFloppyDisk} /></button
                    >
                    <button class="cancel" on:click={cancelEdit}
                        ><Fa icon={faBan} /></button
                    >
                {:else}
                    <img src={item.image} alt="Preview" />
                    <span>{item.answer}</span>
                    <!-- <button class="edit" on:click={() => onEditClick(item.id)}>
                        <Fa icon={faPenToSquare} />
                    </button> -->
                    <button
                        class="remove"
                        on:click={() => removeItem(item.answer)}
                    >
                        <Fa icon={faSquareMinus} />
                    </button>
                {/if}
            </div>
        {/each}

        {#if category}
            <hr />

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
                <button class="warning" on:click={confirmDelete}
                    >Delete Collection</button
                >
            </form>
        {/if}
        {#if errorMessage}
            <p style="color: red">{errorMessage}</p>
        {/if}
        {#if successMessage}
            <p style="color: green">{successMessage}</p>
        {/if}
    {/if}
    <div class="container" style="display: none;">
        <form action="">
            <input type="file" name="file" id="file" />
            <input type="text" name="answer" id="answer" />
            <button type="submit">Upload</button>
        </form>
    </div>
</div>

<style>
    .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        /* vertical align elements inside of container */
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        background-color: #f9f9f9;
        border-radius: 5px;
        margin-top: 40px;
        color: #303030;
        padding: 2rem;
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
        padding: 1rem;
        box-sizing: border-box;
    }

    /* make every other item gray */
    .container .item:nth-child(even) {
        background-color: #f0f0f0;
    }

    .container hr {
        border: none;
        border-top: 1px solid #ccc;
        margin: 1rem 0;
    }

    .container .item span {
        /* fill extra space */
        flex-grow: 1;
        font-size: 1.5rem;
    }

    .container .item img {
        /* make img width 20% of parent */
        width: 20%;
    }

    .container .item input[type="text"] {
        /* fill extra space */
        flex-grow: 1;
        font-size: 1.5rem;
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

    .container .item button.cancel {
        background-color: #373737;
        color: #dedede;
    }

    .container form {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .container form input[type="file"] {
        background-color: #bbbbbb;
        height: 120px;
    }

    .container button.warning {
        background-color: #bd1010;
        color: #dedede;
    }
</style>
