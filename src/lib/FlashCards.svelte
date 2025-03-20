<script>
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import fetchImageFromGridFS from "./ImageFetcher.svelte";

    let collectionName = "";
    let collectionAuthor = "";
    let cards = [];

    // get collection id from local storage
    let selectedCollection = localStorage.getItem("selectedCollection");

    // function to fetch collection from id
    async function fetchCollection() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collection/${selectedCollection}`,
                {
                    method: "GET",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }

            let responseJson = await response.json();

            collectionName = responseJson.category;
            collectionAuthor = responseJson.author;

            // loop through items and fetch images
            let images = [];
            for (let item of responseJson.items) {
                const url = await getImageUrl(item.id);
                images.push(url);
            }

            cards = responseJson.items.map((item, index) => {
                return {
                    id: item.id,
                    image: images[index],
                    answer: item.answer,
                };
            });

            console.log(cards);

        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    async function getImageUrl(imageId) {
        const token = localStorage.getItem("token");
        console.log(`Fetching image with ID: ${imageId} and token: ${token}`);

        try {
            const imageUrl = await fetchImageFromGridFS(imageId, token);
            return imageUrl;
        } catch (error) {
            console.error("Error fetching image:", error);
            return "";
        }
    }

    //onmount, fetch collection
    onMount(() => {
        fetchCollection();
    });

    //subscribe to changes in local storage for selected collection
    window.addEventListener("storage", (event) => {
        if (event.key === "selectedCollection") {
            selectedCollection = event.newValue;
            console.log("selectedCollection:", selectedCollection);
            fetchCollection();
        }
    });

    let revealed = writable([]);
    let imageLoaded = writable([]);

    function toggleReveal(index) {
        revealed.update((r) => {
            r[index] = !r[index];
            return [...r];
        });
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function shuffleCards() {
        // shuffle cards array
    }

    function resetCards() {
    }
</script>

<!-- loop through cards -->

{#if cards.length > 0}

<h2>{collectionName} by: {collectionAuthor}</h2>

    <div class="flashcards">
        {#each cards as item, i}
            <button
                type="button"
                class="card"
                on:click={() => toggleReveal(i)}
                on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
            >
                <div class="card-front">
                    <div class="image-wrapper">
                        <!-- embed image at url + item.image -->
                         <img
                            src={item.image}
                            class="flashcard-image"
                            alt="flashcard image"
                         />
                    </div>
                </div>
                {#if $revealed[i]}
                    <div class="card-back">{item.answer}</div>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<div class="controls">
    <!-- shuffle cards button -->
    <button type="button" on:click={shuffleCards}>Shuffle Cards</button>
    <!-- reset cards button -->
    <button type="button" on:click={resetCards}>Reset Cards</button>
</div>

<style>
    .flashcards {
        display: flex;
        flex-wrap: wrap;
        gap: 40px;
        justify-content: center;
    }

    .flashcards button {
        box-shadow: 0 10px 15px 5px rgba(0, 0, 0, 0.1);
        margin: 10px;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .card {
        width: 300px;
        max-width: 100vw;
        cursor: pointer;
        font-weight: 800;
        text-align: center;
        position: relative;
    }

    .card-front {
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        font-size: 1.2em;
        background: white;
    }

    .card-back {
        margin-top: 10px;
        padding: 10px;
        border-radius: 8px;
        background: #242424;
        color: white;
        font-size: 2.4em;
        /* absolute positioned, center the back of the card */
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .flashcard-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
        border-radius: 8px;
        user-select: none;
    }

    .controls {
        position: fixed;
        bottom: 15px;
        left: 0px;
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 10px;
    }

    .image-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.2);
        border-top: 4px solid black;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        position: absolute;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
