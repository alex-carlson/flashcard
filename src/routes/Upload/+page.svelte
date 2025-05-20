<script>
    import { user, profile } from '$stores/user';
    import { getSession } from '../../lib/supabaseClient';
    import Collections from "../../lib/Collections.svelte";
    import FileUpload from "../../lib/FileUpload.svelte";
    import { onMount } from "svelte";
    import { v4 as uuidv4 } from "uuid";
    import Fa from "svelte-fa";
    import {
        faPenToSquare,
        faTrashCan,
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

    // fetch collections on mount
    onMount(async () => {
        const { data: sessionData, error: sessionError } = await getSession();
        if (sessionError || !sessionData?.session) {
            return;
        }
        fetchCollections();
    });

    async function getAuthHeaders() {
        const { data: sessionData, error: sessionError } = await getSession();
        if (sessionError || !sessionData?.session) {
            throw new Error('User session not found');
        }
        return {
            Authorization: `Bearer ${sessionData.session.access_token}`,
        };
    }

    async function apiFetch(endpoint, method = "GET", body = null, isFormData = false) {
        const headers = await getAuthHeaders();
        if (!isFormData) headers["Content-Type"] = "application/json";
        const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            method,
            headers,
            body: isFormData ? body : body ? JSON.stringify(body) : null,
        });

        if (!response.ok) {
            throw new Error(`${method} ${endpoint} failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Fetch collections
    async function fetchCollections() {
        try {
            const url = `/collections/user/${$user.id}`;
            collections = await apiFetch(url);
            collections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    // Fetch collection details
    async function fetchCollectionData(id) {
        console.log("Fetching collection data for ID:", id);
        try {
            const data = await apiFetch(`/collections/id/${id}`);
            category = data.category;
            items = Array.isArray(data.items) ? data.items : [];
            isPublic = !data.private;
            isRenaming = false;
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    // Create new collection
    async function createCollection() {
        try {
            const username = $profile.username;
            const data = {
                category: tempCategory,
                author_id: $user.id,
                author: username,
            };
            console.log("Creating collection with data:", data);
            const created = await apiFetch("/collections/createCollection", "POST", data);
            collections = [...collections, created];
            category = tempCategory;
        } catch (error) {
            console.error("Error creating collection:", error);
            errorMessage = "Create failed. Please try again.";
        }
    }

    // Rename collection
    async function renameCollection() {
        isRenaming = false;
        try {
            await apiFetch("/collections/renameCollection", "POST", {
                oldCategory: category,
                newCategory: tempCategory,
            });
            category = tempCategory;
        } catch (error) {
            console.error("Error renaming collection:", error);
            errorMessage = "Rename failed. Please try again.";
        }
    }

    // Remove item
    async function removeItem(itemId) {
        try {
            await apiFetch("/items/remove", "POST", {
                category,
                itemId,
            });
            items = items.filter((item) => item.id !== itemId);
        } catch (error) {
            console.error("Error removing item:", error);
            errorMessage = "Remove failed. Please try again.";
        }
    }
    
    async function saveEdit(){
        try {
            const item = items.find((item) => item.id === editableItemId);
            const itemTextFieldValue = document.getElementById("editedAnswer").value;
            await apiFetch("/items/edit", "POST", {
                collection: category,
                id: editableItemId,
                author_id: $user.id,
                answer: itemTextFieldValue,
            });
            editableItemId = null;
        } catch (error) {
            console.error("Error editing item:", error);
            errorMessage = "Edit failed. Please try again.";
            // clear error message after 10 seconds
            setTimeout(() => {
                errorMessage = ""; // Clear the error message after 10 seconds
            }, 10000);
        }
    }

    // Reorder items
    async function reorderItems() {
        try {
            const itemAnswers = items.map((item) => item.answer);
            await apiFetch("/items/reorder", "POST", { category, itemAnswers });
            isReordering = false;
        } catch (error) {
            console.error("Error reordering items:", error);
            errorMessage = "Reorder failed. Please try again.";
        }
    }

    // Delete collection
    async function deleteCollection() {
        try {
            const username = $profile.username;
            const data = {
                collection: category,
                author_id: $user.id,
                username: username,
            };
            console.log("Deleting collection:", data);
            await apiFetch(`/collections/${username}/${category}`, "DELETE", data);
            collections = collections.filter((c) => c.category !== category);
            document.location.reload();
        } catch (error) {
            console.error("Error deleting collection:", error);
            errorMessage = "Delete failed. Please try again.";
        }
    }

    // show confirm delete popup
    function confirmDelete() {
        if (confirm("Are you sure you want to delete this collection?")) {
            deleteCollection();
        }
    }

    // Upload data
    async function uploadData() {
        console.log("Profile is ", profile);
        const username = $profile.username;
        const author_id = $user.id;
        const formData = new FormData();
        formData.append("uuid", uuidv4());
        formData.append("file", localItem.file);
        formData.append("folder", `${username}/${category}`);
        formData.append("answer", localItem.answer);
        formData.append("category", category);
        formData.append("author", username);
        formData.append("author_id", author_id);

        try {
            const result = await apiFetch("/items/upload", "POST", formData, true);
            showSuccessMessage("Upload successful!");
            const preview = document.querySelector(".preview");
            if (preview) preview.src = null;

            localItem.answer = "";
            document.getElementById("answer").value = "";
            items = result[0]?.items || [];
            localItem.file = null;
            preview.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error uploading data:", error);
            showErrorMessage("Upload failed. Please try again.");
        }
    }

    // Set visibility
    async function setVisible(event) {
        const data = {
            category,
            author: $profile.username,
            author_id: $user.id,
            visible: event.target.checked,
        };

        try {
            await apiFetch("/collections/setVisible", "POST", data);
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

    function ReOrder(prevIndex, newIndex) {
        console.log("Reordering items");
        const item = items[prevIndex];
        items.splice(prevIndex, 1);
        items.splice(newIndex, 0, item);
        // update items to rerender
        items = [...items];
    }

    function toggleRenaming() {
        isRenaming = !isRenaming;
        if (isRenaming) {
            tempCategory = category;
        }
    }

    document.title = "Upload Data";
</script>

<div class="container form padding uploader">
    {#if !user}
        <p><a href="/login">Log in</a> to upload data.</p>
    {:else}
        {#if collections.length > 0}
            <Collections
                {collections}
                on:selectCollection={(e) => fetchCollectionData(e.detail)}
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
            {#if items.length > 1}
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
        {/if}
        <div class="list uploads">
            <ul class="items-list">
                {#each items as item, index}
                <li
                    class={isReordering ? "item reorder" : "item"}
                    draggable={isReordering}
                >
                    {#if editableItemId === item.id}
                        <img src={item.image} alt="Preview" />
                        <input
                            id="editedAnswer"
                            type="text"
                            bind:value={item.answer}
                            placeholder="Enter an answer"
                        />
                        <div class="vertical">
                            <button class="success" on:click={saveEdit}
                                ><Fa icon={faFloppyDisk} /></button
                            >
                            <button class="danger" on:click={editableItemId = null}
                                ><Fa icon={faBan} /></button
                            >
                        </div>
                    {:else}
                    <img src={item.image} alt="Preview" />
                    <span>{item.answer}</span>
                    {#if isReordering}
                        <div class="reorder">
                            <button on:click={() => ReOrder(index, index - 1)}>
                                <Fa icon={faChevronUp} />
                            </button>
                            <button on:click={() => ReOrder(index, index + 1)}>
                                <Fa icon={faChevronDown} />
                            </button>
                        </div>
                    {:else}
                    <div class="vertical">
                        <button
                        class="edit secondary"
                        on:click={() => editableItemId = item.id}
                        >
                        <Fa icon={faPenToSquare} />
                        </button>
                        <button
                        class="remove danger"
                        on:click={() => removeItem(item.id)}
                        >
                        <Fa icon={faTrashCan} />
                        </button>
                    </div>
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
                <FileUpload on:uploadImage={(event) => localItem.file = event.detail} />
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
                <button class="danger" style="margin-top: 44px" on:click={confirmDelete}
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