<script>
    import Fa from "svelte-fa";
    import {
        faShuffle,
        faEyeSlash,
        faEye,
        faTableCells,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";

    let slug;
    export let author = "";
    export let collection = null;
    let cards = [];

    // Utility function to generate a slug in the format "author/category"
    function generateSlug(author, category) {
        return `${author}/${category}`
            .toLowerCase()
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/[^a-z0-9-/]/g, ""); // Remove invalid characters
    }

    // function to fetch collection from id
    async function fetchCollection() {
        console.log("Fetching collection:", slug);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collection/${author}/${collection}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }

            const data = await response.json();

            console.log("Collection data:", data);

            collection = data.category;
            author = data.author;

            cards = data.items.map((card) => ({
                ...card,
                imageUrl: card.image,
                revealed: false,
                loaded: false,
                hidden: false,
            }));
        } catch (error) {
            console.error("Error fetching collection:", error);
        }
    }

    function lazyLoadImages() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const cardIndex = cards.findIndex(
                            (card) => card.imageUrl === img.dataset.src,
                        );

                        if (cardIndex === -1) {
                            return;
                        }

                        if (cards[cardIndex].loaded) {
                            return;
                        }

                        if (!img.dataset.src) {
                            return;
                        }

                        // set img.src to img data-src
                        img.src = img.dataset.src;

                        // remove dataset src
                        img.removeAttribute("data-src");

                        cards[cardIndex].loaded = true;

                        observer.unobserve(img);
                    }
                });
            },
            {
                root: null,
                rootMargin: "0px 0px 50px 0px",
                threshold: 0.1,
            },
        );

        const images = document.querySelectorAll(".flashcard-image");
        images.forEach((img) => {
            observer.observe(img);
        });
    }

    $: {
        if (cards.length > 0) {
            // lazyLoadImages();
        }
    }

    function updateCards() {
        cards = [...cards];
    }

    function onCardLoad(index) {
        cards[index].loaded = true;
        updateCards();
    }

    function toggleReveal(index) {
        cards[index].revealed = !cards[index].revealed;
    }

    function shuffleCards() {
        // shuffle cards array
        cards = cards.sort(() => Math.random() - 0.5);
        updateCards();
    }

    function toggleCards() {
        const areAnyRevealed = areAnyCardsRevealed();
        // reset cards array
        cards = cards.map((card) => {
            card.revealed = !areAnyRevealed;
            return card;
        });
        //reload cards
        cards = [...cards];
    }

    function areAnyCardsRevealed() {
        return cards.some((card) => card.revealed);
    }

    function toggleGrid() {
        const grid = document.querySelector(".flashcards");
        grid.classList.toggle("grid");
        const hasGrid = grid.classList.contains("grid");
    }

    onMount(() => {
        slug = generateSlug(author, collection);
        console.log("Slug:", slug);
        fetchCollection().then(() => {
            // lazyLoadImages();
        });
    });
</script>

{#if cards.length > 0}
    <div class="headline">
        <h1>
            {collection}
        </h1>
        <p>by: <a href={`#/${author}`}>{author}</a></p>
    </div>

    <div class="flashcards">
        {#each cards as item, i}
            <button
                type="button"
                class="card"
                on:click={(e) => {
                    e.preventDefault();
                    toggleReveal(i);
                }}
                on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
            >
                <div class="card-front">
                    <div class="image-wrapper">
                        <img
                            class="flashcard-image"
                            alt="flashcard"
                            src={item.imageUrl}
                            data-src={item.imageUrl}
                            on:load={() => {
                                onCardLoad(i);
                            }}
                            on:error={() => {
                                console.error(
                                    "Failed to load image for card:",
                                    item.imageUrl,
                                );
                            }}
                        />
                        {#if !item.loaded}
                            <div class="loading-spinner"></div>
                        {/if}
                    </div>
                </div>
                {#if item.revealed}
                    <div class="card-back">
                        <span>
                            {item.answer}
                        </span>
                    </div>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<div class="controls">
    <!-- shuffle cards button -->
    <button type="button" on:click={shuffleCards}
        ><Fa icon={faShuffle} /></button
    >
    {#if areAnyCardsRevealed()}
        <button type="button" on:click={toggleCards}
            ><Fa icon={faEyeSlash} /></button
        >
    {:else}
        <button type="button" on:click={toggleCards}><Fa icon={faEye} /></button
        >
    {/if}
    <button type="button" on:click={toggleGrid}
        ><Fa icon={faTableCells} /></button
    >
</div>

<div class="flashcards grid" style="display: none;">
    <button class="card">
        <div class="card-front">
            <div class="image-wrapper">
                <img class="flashcard-image" alt="flashcard" />
            </div>
        </div>
        <div class="card-back">Answer</div>
    </button>
</div>

<style global>
    .container {
        max-width: 800px;
        margin: 10px auto;
        padding: 0 10px;
    }
    .headline {
        margin-bottom: 40px;
        font-weight: 800;
    }

    .headline h1 {
        font-size: 2.4em;
        margin-bottom: 0;
    }
    .flashcards {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }

    .flashcards.grid {
        flex-direction: row;
        width: 1020px;
        gap: 5px;
        /* center horizontally on page */
        margin: 0 auto;
    }

    .flashcards.grid .card {
        width: 200px;
        height: 200px;
        margin: 0;
    }

    .flashcards button {
        margin: 10px;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        transition: transform 0.2s;
        overflow: hidden;
    }

    .card {
        width: 300px;
        max-width: 100vw;
        height: auto;
        cursor: pointer;
        font-weight: 800;
        text-align: center;
        position: relative;
    }

    .card-front {
        padding: 5px;
        font-size: 1.2em;
        background: white;
        height: 100%;
        width: 100%;
    }

    .card-back {
        margin-top: 10px;
        padding: 10px;
        background: #242424;
        color: white;
        font-size: 1.2rem;
        /* put answer on the bottom of the card */
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        opacity: 0.75;
    }

    .flashcard-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        width: auto;
        height: auto;
        border-radius: 8px;
        user-select: none;
        pointer-events: none;
    }

    .controls {
        position: fixed;
        bottom: 4rem;
        left: 0px;
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 10px;
    }

    .controls button {
        border: solid 1px white;
    }

    .image-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
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
