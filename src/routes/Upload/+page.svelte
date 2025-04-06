<script>
    import Collections from "../../lib/Collections.svelte";
    import FileUpload from "../../lib/FileUpload.svelte";
    import { onMount } from "svelte";
    import { v4 as uuidv4 } from "uuid";
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
    let tempCategory = "";
    let items = [];
    let errorMessage,
        successMessage = "";
    let isPublic = false;
    let collections = [];
    let editableItemId = null;
    let localItem = { id: 1, file: null, answer: "" };
    let isRenaming = false;

    // Fetch collections from the server on load
    async function fetchCollections() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/user/${username}`,
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

    async function fetchCollectionData(id) {
        isRenaming = false;
        const url = `${import.meta.env.VITE_API_URL}/collections/id/${id}`;
        console.log("Fetching collection data from:", url);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

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

            items = collectionData.items;

            console.log("Collection data is private:", collectionData.private);

            isPublic = collectionData.private ? false : true;
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    async function createCollection() {
        let url =
            import.meta.env.VITE_API_URL + "/collections/createCollection";
        const data = {
            category: tempCategory,
            username,
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

            const val = response.json().then((val) => {
                console.log(val);
                collections = [...collections, val];
                category = tempCategory;
            });
        } catch (error) {
            console.error("Error creating collection:", error);
            errorMessage = "Create failed. Please try again.";
        }
    }

    async function renameCollection() {
        isRenaming = false;
        //rename collection on server
        let url =
            import.meta.env.VITE_API_URL + "/collections/renameCollection";

        console.log("Renaming to: ", category);

        const data = {
            oldCategory: category,
            newCategory: tempCategory,
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

            category = tempCategory;
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
    async function removeItem(itemId) {
        console.log("Removing item:", itemId);
        let url = import.meta.env.VITE_API_URL + "/items/remove";
        const data = {
            category,
            itemId,
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
        localItem = null; // Reset local item
    }

    function cancelEdit() {
        editableItemId = null;
        localItem.answer = "";
    }

    function toggleRenaming() {
        isRenaming = !isRenaming;
    }

    function handleFileChange(event) {
        console.log("File changed:", event.detail);
        localItem.file = event.detail;
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

                    document.location.reload();
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
        const formData = new FormData();
        formData.append("uuid", uuidv4());
        formData.append("file", localItem.file);
        formData.append("folder", `${username}/${category}`);
        formData.append("answer", localItem.answer);
        formData.append("category", category);
        formData.append("author", username);

        let url = import.meta.env.VITE_API_URL + "/items/upload";

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(
                    `Upload failed: ${response.status} ${response.statusText}`,
                );
            }

            successMessage = "Upload successful!";
            const preview = document.querySelector(".preview");
            preview.src = null;
            // clear answer field
            localItem.answer = "";
            const answerInput = document.getElementById("answer");
            answerInput.value = "";

            // get image from response
            const data = await response.json();
            const returnedItems = data[0].items;
            items = returnedItems;
            localItem.file = null; // Reset local item file
            localItem.answer = ""; // Reset local item answer
        } catch (error) {
            console.error("Error uploading data:", error);
            errorMessage = "Upload failed. Please try again.";
        }
    }

    async function setVisible(event) {
        const data = {
            category,
            author: username,
            visible: event.target.checked,
        };

        let url = import.meta.env.VITE_API_URL + "/collections/setVisible";

        try {
            const respone = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("Error setting visibility:", error);
            errorMessage = "Visibility change failed. Please try again.";
        }
    }
    document.title = "Upload Data";
</script>

<div class="container form">
    {#if !token}
        <p><a href="/login">Log in</a> to upload data.</p>
    {:else}
        <div class="container">
            {#if collections.length > 0}
                <Collections
                    {collections}
                    on:selectCollection={handleCollectionSelection}
                />
            {/if}
            {#if category === ""}
                <input
                    type="text"
                    bind:value={tempCategory}
                    placeholder="Category Name"
                />
                <button on:click={createCollection}>Create</button>
            {:else if isRenaming}
                <input
                    type="text"
                    id="categoryName"
                    bind:value={tempCategory}
                    placeholder="Enter a category"
                />
                <button class="secondary" on:click={renameCollection}
                    >Save</button
                >
                <button class="warning" on:click={toggleRenaming}>Cancel</button
                >
            {:else}
                <div class="row">
                    <h2>{isPublic ? "Public" : "Private"}</h2>
                    <label class="switch">
                        <input
                            type="checkbox"
                            bind:checked={isPublic}
                            on:change={setVisible}
                        />
                        <span class="slider round"></span>
                    </label>
                </div>
                <button class="secondary" on:click={toggleRenaming}
                    >Rename</button
                >
            {/if}
        </div>

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
                    <button
                        class="edit secondary"
                        on:click={() => onEditClick(item.id)}
                    >
                        <Fa icon={faPenToSquare} />
                    </button>
                    <button
                        class="remove warning"
                        on:click={() => removeItem(item.id)}
                    >
                        <Fa icon={faSquareMinus} />
                    </button>
                {/if}
            </div>
        {/each}

        {#if category}
            <!-- on submit form, call UploadFile -->
            <form>
                <FileUpload on:uploadImage={handleFileChange} />
                {#if localItem.file}
                    <img
                        src={localItem.file}
                        alt="Preview"
                        style="display: none;"
                    />
                {/if}
                <input
                    id="answer"
                    type="text"
                    bind:value={localItem.answer}
                    placeholder="Enter an answer"
                    class="answer"
                />
                <button type="button" class="" on:click={uploadData}
                    >Add item</button
                >
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
    .container .container {
        padding: 0 1rem;
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

    .container .item span {
        /* fill extra space */
        flex-grow: 1;
        font-size: 1.5rem;
        width: 100%;
    }

    .container .item img {
        /* make img width 20% of parent */
        width: 20%;
    }

    .container .item input[type="text"] {
        /* fill extra space */
        flex-grow: 1;
        font-size: 0.7rem;
        width: 100%;
        box-sizing: border-box;
        height: 42px;
        padding: 0;
    }

    .container .item .remove {
        background-color: #bd1010;
        color: #dedede;
    }

    .container .item button {
        padding: 0.5rem;
        cursor: pointer;
        width: 42px;
        height: 42px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .container form {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 2rem;
    }

    .container button.warning {
        background-color: #bd1010;
        color: #dedede;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: 0.4s;
        transition: 0.4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: 0.4s;
        transition: 0.4s;
    }

    input:checked + .slider {
        background-color: #2196f3;
    }

    input:focus + .slider {
        box-shadow: 0 0 1px #2196f3;
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }

    /* Rounded sliders */
    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }
</style>
