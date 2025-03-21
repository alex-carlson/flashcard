<script>
    import { fetchImageFromGridFS } from "./ImageFetcher";
    import Search from "./Search.svelte";
    import Fa from "svelte-fa";
    import { faShuffle, faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { selectedCollection } from "../stores/collectionStore";

    let collectionName = "";
    let collectionAuthor = "";
    let cards = [];
    let collection = null;
    const dispatch = createEventDispatcher();

    // function to fetch collection from id
    async function fetchCollection() {
        console.log("fetching collection");
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collection/${collection}`,
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

            cards = responseJson.items.map((item, index) => {
                return {
                    imageId: item.id,
                    image: "",
                    answer: item.answer,
                    flipped: false,
                    loaded: false
                };
            });

            for (let card of cards) {
                if (card.imageId) {
                    card.image = await fetchImageFromGridFS(card.imageId);
                } else {
                    console.warn("Card does not have an imageId:", card);
                }
            }

            // whenever a card promise finishes, reload the cards
            cards = [...cards];

        } catch (error) {
            console.error("Error fetching collection:", error);
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

    function collectedSelected(event){
        console.log("collection selected", event.detail.collection);
        collection = event.detail.collection;
        fetchCollection();
    }
</script>

<div class="container">
    <Search on:collectionSelected={collectedSelected} />
</div>

{#if cards.length > 0}
    <div class="headline">
        <h1>{collectionName}</h1> <p>by: {collectionAuthor}</p>
    </div>

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
                         <img
                            src={`${item.image}`}
                            class="flashcard-image"
                            alt={item.answer}
                            on:load={() => {
                                onCardLoad(i);
                            }}
                            on:error={() => {
                                console.error("Failed to load image for card:", item);
                                cards = [...cards];
                            }}
                            style="display: {item.loaded ? 'block' : 'none'}"
                         />
                        {#if !item.loaded}
                            <div class="loading-spinner"></div>
                        {/if}
                    </div>
                </div>
                {#if item.revealed}
                    <div class="card-back">{item.answer}</div>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<div class="controls">
    <!-- shuffle cards button -->
    <button type="button" on:click={shuffleCards}><Fa icon={faShuffle}/></button>
    {#if areAnyCardsRevealed()}
        <button type="button" on:click={toggleCards}><Fa icon={faEyeSlash} /></button>
    {:else}
        <button type="button" on:click={toggleCards}><Fa icon={faEye} /></button>
    {/if}
</div>

<style>

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
        gap: 10px;
        justify-content: center;
    }

    .flashcards button {
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
