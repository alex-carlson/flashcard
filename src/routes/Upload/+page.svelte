<script>
    import { user } from '$stores/user';
    import { getSession } from '../../lib/supabaseClient';
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
        faChevronUp,
        faChevronDown,
    } from "@fortawesome/free-solid-svg-icons";
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
    let isReordering = false;

    // Fetch collections from the server on load
    async function fetchCollections() {
        try {
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
            const url = `${import.meta.env.VITE_API_URL}/collections/user/${$user.id}`;
            const response = await fetch(url, {
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
            // sort collections by created_at date (timestamp timezone)
            collections.sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    async function fetchCollectionData(id) {
        const { data: sessionData, error: sessionError } = await getSession();
        if (sessionError || !sessionData.session) {
            throw new Error('User session not found');
        }
        const token = sessionData.session.access_token;
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
        let url = import.meta.env.VITE_API_URL + "/collections/createCollection";
        const data = {
            category: tempCategory,
            author_id: $user.id,
            author: $user.user_metadata.display_name,
        };

        try {
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
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
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
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

    function handleDragStart(event, index) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", index); // Store the index of the dragged item
        // set aria grabbed to true
        event.target.setAttribute("aria-grabbed", "true");
    }

    function handleDragOver(event) {
        event.preventDefault(); // Allow dropping
        event.dataTransfer.dropEffect = "move";
    }

    function handleDrop(event, dropIndex) {
        event.preventDefault();
        const dragIndex = parseInt(
            event.dataTransfer.getData("text/plain"),
            10,
        );

        if (dragIndex === dropIndex) return; // No-op if dropped on same item

        const draggedItem = items[dragIndex];

        items.splice(dragIndex, 1); // Remove dragged
        items.splice(dropIndex, 0, draggedItem); // Insert at new index

        // set aria-grabbed to false
        event.target.setAttribute("aria-grabbed", "false");

        items = [...items]; // Trigger reactivity
    }

    function MoveUp(index) {
        if (index > 0) {
            const temp = items[index];
            items[index] = items[index - 1];
            items[index - 1] = temp;
        }
    }

    function MoveDown(index) {
        if (index < items.length - 1) {
            const temp = items[index];
            items[index] = items[index + 1];
            items[index + 1] = temp;
        }
    }

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
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
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

    // reorder items and call items/upload on the server with the new collection

    async function reorderItems() {
        let url = import.meta.env.VITE_API_URL + "/items/reorder";
        // get all item answers
        const itemAnswers = items.map((item) => item.answer);
        try {
            // post to url with data
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ category, itemAnswers }),
            });

            // log the response

            if (!response.ok) {
                throw new Error(
                    `Reorder failed: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();
        } catch {
            console.error("Error reordering items:", error);
            errorMessage = "Reorder failed. Please try again.";
        }
        isReordering = false;
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
        const username = $user.user_metadata.display_name;
        const formData = new FormData();
        formData.append("uuid", uuidv4());
        formData.append("file", localItem.file);
        formData.append("folder", `${username}/${category}`);
        formData.append("answer", localItem.answer);
        formData.append("category", category);
        formData.append("author", username);

        let url = import.meta.env.VITE_API_URL + "/items/upload";

        try {
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
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

            showSuccessMessage("Upload successful!");
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
            preview.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error uploading data:", error);
            showErrorMessage("Upload failed. Please try again.");
        }
    }

    async function setVisible(event) {
        const username = $user.user_metadata.display_name;
        const data = {
            category,
            author: username,
            visible: event.target.checked,
        };
        
        let url = import.meta.env.VITE_API_URL + "/collections/setVisible";
        
        try {
            const { data: sessionData, error: sessionError } = await getSession();
            if (sessionError || !sessionData.session) {
                throw new Error('User session not found');
            }
            const token = sessionData.session.access_token;
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

    function showSuccessMessage(message) {
        successMessage = message;
        setTimeout(() => {
            successMessage = ""; // Clear the success message after 10 seconds
        }, 10000);
    }

    function showErrorMessage(message) {
        errorMessage = message;
        setTimeout(() => {
            errorMessage = ""; // Clear the error message after 10 seconds
        }, 10000);
    }

    document.title = "Upload Data";
</script>

<div class="container form padding">
    {#if !user}
        <p><a href="/login">Log in</a> to upload data.</p>
    {:else}
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
            <h2>{category}</h2>
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
            {#if !isReordering}
                <button
                    class="secondary"
                    on:click={() => (isReordering = true)}>Reorder</button
                >
            {:else}
                <button class="secondary" on:click={reorderItems}
                    >Done</button
                >
            {/if}
        {/if}
        <div class="list uploads">
            <ul class="items-list">
                {#each items as item, index}
                <li
                    class={isReordering ? "item reorder" : "item"}
                    draggable={isReordering}
                    aria-grabbed="false"
                    on:dragstart={(e) => handleDragStart(e, index)}
                    on:dragover={handleDragOver}
                    on:drop={(e) => handleDrop(e, index)}
                >
                    {#if editableItemId === item.id}
                    <img src={localItem.image} alt="Preview" />
                    <input
                        type="text"
                        bind:value={localItem.answer}
                        placeholder="Enter an answer"
                    />
                    <button class="success" on:click={saveEdit}
                        ><Fa icon={faFloppyDisk} /></button
                    >
                    <button on:click={cancelEdit}
                        ><Fa icon={faBan} /></button
                    >
                    {:else}
                    <img src={item.image} alt="Preview" />
                    <span>{item.answer}</span>
                    {#if isReordering}
                        <div class="reorder">
                        <button on:click={() => MoveUp(index)}>
                            <Fa icon={faChevronUp} />
                        </button>
                        <button on:click={() => MoveDown(index)}>
                            <Fa icon={faChevronDown} />
                        </button>
                        </div>
                    {:else}
                        <button
                        class="edit secondary"
                        on:click={() => onEditClick(item.id)}
                        >
                        <Fa icon={faPenToSquare} />
                        </button>
                        <button
                        class="remove danger"
                        on:click={() => removeItem(item.id)}
                        >
                        <Fa icon={faSquareMinus} />
                        </button>
                    {/if}
                    {/if}
                </li>
                {/each}
            </ul>
        </div>


        {#if errorMessage}
            <p style="color: red">{errorMessage}</p>
        {/if}
        {#if successMessage}
            <p style="color: green">{successMessage}</p>
        {/if}

        {#if category}
            <!-- on submit form, call UploadFile -->
            <form class="form">
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
                <button class="danger" on:click={confirmDelete}
                    >Delete Collection</button
                >
            </form>
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