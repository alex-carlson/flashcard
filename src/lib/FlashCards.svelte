<script>
    import Fa from "svelte-fa";
    import {
        faShuffle,
        faEyeSlash,
        faEye,
        faTableCells,
        faMagnifyingGlassMinus,
        faMagnifyingGlassPlus,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    import { slugify } from "./utils.js";

    let slug;
    export let author = "";
    export let collection = null;
    let cards = [];

    // function to fetch collection from id
    async function fetchCollection() {
        console.log("Fetching collection:", collection + " by " + author);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/${author}/${collection}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }

            const data = await response.json();

            collection = data.category;
            author = data.author;

            // if items length is 0, or is undefined, return
            if (!data.items || data.items.length === 0) {
                return;
            }

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

    function scaleCards(event) {
        const scaleValue = parseFloat(event.target.value); // Extract numeric value
        const cards = document.querySelectorAll(".card");
        cards.forEach((card) => {
            card.style.width = `${300 * scaleValue}px`;
        });
    }

    onMount(() => {
        slug = slugify(author + "-" + collection);
        console.log("Slug:", slug);
        fetchCollection().then(() => {
            // lazyLoadImages();
        });
    });
</script>

<div class="container">
    <div class="toolbar">
        <div class="row">
            <Fa icon={faMagnifyingGlassMinus} />
            <input
                on:input={scaleCards}
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value="1"
            />
            <Fa icon={faMagnifyingGlassPlus} />
        </div>
        <div class="row">
            <!-- shuffle cards button -->
            <button type="button" on:click={shuffleCards}
                ><Fa icon={faShuffle} /></button
            >
            {#if areAnyCardsRevealed()}
                <button type="button" on:click={toggleCards}
                    ><Fa icon={faEyeSlash} /></button
                >
            {:else}
                <button type="button" on:click={toggleCards}
                    ><Fa icon={faEye} /></button
                >
            {/if}
            <button type="button" on:click={toggleGrid}
                ><Fa icon={faTableCells} /></button
            >
        </div>
    </div>

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

    <div class="controls"></div>

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
</div>

<style global>
    .container {
        background: transparent;
        color: rgba(246, 233, 50, 0.87);
        box-sizing: border-box;
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
        font-size: 1.2em;
        height: 100%;
        width: 100%;
    }

    .card-back {
        margin-top: 10px;
        padding: 10px;
        background: #000;
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

    .row {
        display: flex;
        justify-content: center;
        gap: 20px;
        width: 100%;
    }

    .row button {
        border: solid 1px white;
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
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

    .toolbar {
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        background: #4e0000;
        width: 100%;
        padding: 1em 0.4em;
        font-size: 25px;
        border-radius: 15px;
        gap: 20px;
        max-width: 600px;
        flex-direction: column;
        box-sizing: border-box;
    }
</style>
