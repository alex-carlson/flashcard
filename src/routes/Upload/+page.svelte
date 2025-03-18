<script>
    import Collections from "../../lib/Collections.svelte";
    let token = localStorage.getItem("token");
    let username = localStorage.getItem("username") || "Anonymous";
    let category = "";
    let items = [{ id: 1, file: null, preview: null, answer: "" }];
    let errorMessage = "";
    let successMessage = "";

    let collections = [];
    let selectedCollectionId = "";

    // Fetch collections from the server on load
    async function fetchCollections() {
        try {
            const response = await fetch("http://localhost:5000/collections", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }

            const data = await response.json();
            collections = data; // Store collections in the local variable
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    }

    async function fetchImageFromGridFS(imageId) {
        try {
            const response = await fetch(
                `http://localhost:5000/image/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                console.log("Error fetching image:", response.statusText);
                throw new Error(`Error fetching image ${imageId}`);
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob); // Convert blob to a local URL
        } catch (error) {
            console.error("Error loading image:", error);
            return ""; // Return empty if there's an error
        }
    }

    async function fetchCollectionData(id) {
        try {
            const response = await fetch(
                `http://localhost:5000/collection/${id}`,
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
            console.log("Fetched collection data:", collectionData);

            category = collectionData.category;

            if (!collectionData.items || !Array.isArray(collectionData.items)) {
                throw new Error(
                    "Invalid collection data: items missing or not an array",
                );
            }

            // Fetch images from GridFS using their IDs
            const updatedItems = await Promise.all(
                collectionData.items.map(async (item, index) => {
                    let imageUrl = "";
                    if (item._id) {
                        imageUrl = await fetchImageFromGridFS(item._id);
                    }

                    return {
                        id: index + 1,
                        file: null,
                        preview: imageUrl, // Set fetched image URL
                        answer: item.text || "",
                    };
                }),
            );

            items = [...updatedItems]; // Ensure reactivity

            console.log("Updated items:", items);
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    // When a collection is selected, fetch its data
    function handleCollectionSelection(event) {
        const collectionId = event.detail;
        selectedCollectionId = collectionId;
        fetchCollectionData(collectionId);
    }

    // Fetch collections when the page loads
    fetchCollections();

    function addItem() {
        items = [
            ...items,
            { id: items.length + 1, file: null, preview: null, answer: "" },
        ];
    }

    function handleFileChange(event, index) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                items[index].preview = reader.result;
                items[index].file = reader.result.split(",")[1];
                items = [...items]; // Trigger reactivity
            };
            reader.readAsDataURL(file);
        }
    }

    async function uploadData() {
        const formData = new FormData();

        formData.append("category", category);
        formData.append("author", username);

        items.forEach((item) => {
            if (item.file) {
                formData.append("items", item.file);
                formData.append("answers", item.answer);
            }
        });

        formData.append("jsonFile", JSON.stringify(formData));

        const data = {
            category,
            author: username,
            items: items.map((item) => ({
                imageData: item.file,
                answer: item.answer,
            })),
        };

        console.log(data);

        try {
            const response = await fetch("http://localhost:5000/upload", {
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

    async function processItems(items) {
        return Promise.all(
            items.map(async (item) => {
                if (!item.imageData) return null;

                const imageBuffer = base64ToBuffer(item.imageData);
                const compressedBuffer = await sharp(imageBuffer)
                    .resize(400)
                    .jpeg({ quality: 50 })
                    .toBuffer();

                const fileId = await saveImageToDB(
                    compressedBuffer,
                    item.answer,
                );
                return { imageUrl: fileId, text: item.answer };
            }),
        ).then((results) => results.filter(Boolean)); // Remove null values
    }
</script>

<div class="container">
    {#if !token}
        <p><a href="/login">Log in</a> to upload data.</p>
    {:else}
        <Collections
            {collections}
            on:selectCollection={handleCollectionSelection}
        />

        <input
            type="text"
            bind:value={category}
            placeholder="Enter a category"
        />

        {#each items as item, index}
            <div class="item">
                <input
                    type="file"
                    accept="image/*"
                    on:change={(e) => handleFileChange(e, index)}
                />

                {#if item.preview}
                    <img
                        src={item.preview}
                        alt="Preview"
                        style="max-width: 100px; max-height: 100px; margin-top: 10px;"
                    />
                {/if}

                <input
                    type="text"
                    bind:value={item.answer}
                    on:change={(e) => (items[index].answer = e.target.value)}
                    placeholder="Enter answer"
                />
                <button
                    on:click={() =>
                        (items = items.filter((_, i) => i !== index))}>X</button
                >
            </div>
        {/each}

        <button on:click={addItem}>Add Another Item</button>
        <button on:click={uploadData}>Upload</button>

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
        background-color: #666666;
        color: #000;
        height: 40px;
    }
    .container .item {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        width: 100%;
    }

    .container .item input[type="file"] {
        max-width: 200px;
    }
</style>
