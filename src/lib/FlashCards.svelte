<script>
    import Fa from "svelte-fa";
    import {
        faShuffle,
        faEyeSlash,
        faEye,
        faTableCells,
        faMagnifyingGlassMinus,
        faMagnifyingGlassPlus,
        faList,
        faExpand,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    import { handleTouchStart, handleTouchMove, scrollZoom } from "./utils.js";
    import Pagination from "./Pagination.svelte";
    export let author = "";
    export let collection = null;
    let cards = [];
    let isGrid = false;

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
                scale: 1,
            }));
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

    function toggleGrid() {
        const grid = document.querySelector(".flashcards");
        grid.classList.toggle("grid");
        isGrid = !isGrid;

        if (!isGrid) {
            const cards = document.querySelectorAll(".card");
            const answers = document.querySelectorAll(".card span");
            cards.forEach((card) => {
                card.style.width = "auto";
            });
            answers.forEach((answer) => {
                answer.style.fontSize = "32px";
            });
        }
    }

    function goFullscreen() {
        const grid = document.querySelector(".flashcards");
        if (grid.requestFullscreen) {
            grid.requestFullscreen();
        } else if (grid.webkitRequestFullscreen) {
            grid.webkitRequestFullscreen();
        } else if (grid.msRequestFullscreen) {
            grid.msRequestFullscreen();
        }
    }

    function scaleCards(event) {
        const scaleValue = parseFloat(event.target.value); // Extract numeric value
        const grid = document.querySelector(".flashcards");
        const cards = document.querySelectorAll(".card");
        const answers = document.querySelectorAll(".card span");
        cards.forEach((card) => {
            if (isGrid) {
                card.style.width = `${300 * scaleValue}px`;
            } else {
                // set with auto
                card.style.width = "auto";
            }
        });
        answers.forEach((answer) => {
            if (isGrid) {
                answer.style.fontSize = `${32 * scaleValue}px`;
            } else {
                // set with auto
                answer.style.fontSize = "32px";
            }
        });
        grid.style.setProperty("--card-size", `${300 * scaleValue}px`);
    }

    onMount(() => {
        fetchCollection();
    });
</script>

<div class="container">
    <div class="toolbar">
        {#if isGrid}
            <div class="row">
                <Fa icon={faMagnifyingGlassMinus} />
                <input
                    on:input={scaleCards}
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.025"
                    value="1"
                />
                <Fa icon={faMagnifyingGlassPlus} />
            </div>
        {/if}
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
            {#if isGrid}
                <button type="button" on:click={toggleGrid}
                    ><Fa icon={faTableCells} /></button
                >
            {:else}
                <button type="button" on:click={toggleGrid}
                    ><Fa icon={faList} /></button
                >
            {/if}
            <button type="button" on:click={goFullscreen}
                ><Fa icon={faExpand} /></button
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
                <div
                    class="card"
                    role="button"
                    tabindex="0"
                    on:click={(e) => {
                        e.preventDefault();
                        toggleReveal(i);
                    }}
                    on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
                >
                    <img
                        class="flashcard-image zoomable"
                        alt="flashcard"
                        src={item.imageUrl}
                        data-src={item.imageUrl}
                        style={`transform: scale(${item.scale})`}
                        on:load={() => {
                            onCardLoad(i);
                        }}
                        on:error={() => {
                            console.error(
                                "Failed to load image for card:",
                                item.imageUrl,
                            );
                        }}
                        on:touchstart={(e) => {
                            e.preventDefault();
                            // handleTouchStart passing event and this image element
                            handleTouchStart(e, item);
                        }}
                        on:touchmove={(e) => {
                            e.preventDefault();
                            handleTouchMove(e, item);
                        }}
                        on:scroll={(e) => {
                            e.preventDefault();
                            console.log("scrolling");
                            scrollZoom(e, item);
                        }}
                    />
                    {#if !item.loaded}
                        <div class="loading-spinner"></div>
                    {/if}
                    <span style="opacity: {item.revealed ? 1 : 0}">
                        {item.answer}
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<div class="flashcards grid" style="display: none;">
    <div class="card"></div>
</div>
<Pagination {cards} />

<style global>
    .flashcards {
        height: calc(100vh - 140px);
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 15px;
    }

    .card {
        height: calc(100vh - 140px);
        overflow: hidden;
        font-weight: 800;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        scroll-snap-align: start;
    }

    .grid {
        /* render naturally, without flex */
        display: grid;
        grid-template-columns: repeat(
            auto-fit,
            minmax(var(--card-size, 300px), 1fr)
        );
        align-items: center;
        justify-content: center; /* Centers the grid if there are fewer columns */
        gap: 0px;
        scroll-snap-type: none;
        scroll-behavior: auto;
    }

    .grid .card {
        width: 100%; /* Makes sure the card fills the grid cell */
        height: auto;
        overflow: visible;
    }

    .card span {
        padding: 0.4em;
        background: #000;
        color: white;
        width: 100%;
        display: block;
        box-sizing: border-box;
    }

    .flashcard-image {
        max-width: 100%;
        max-height: 100%;
        /* user-select: none; */
        /* pointer-events: none; */
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
        background: rgba(0, 0, 0, 0.1);
        border-radius: 15px;
        padding: 1em 0.4em;
        font-size: 25px;
        gap: 20px;
        width: auto;
        flex-direction: column;
        box-sizing: border-box;
    }

    .zoomable {
        transition: transform 0.2s ease-out;
        touch-action: manipulation;
    }

    :fullscreen {
        overflow-x: hidden;
    }

    /* styles for .card when in fullscreen */
    :fullscreen .card {
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        position: relative;
    }

    :fullscreen .card span {
        padding: 0.4em;
        background: black;
        color: white;
        width: 100%;
        display: block;
        box-sizing: border-box;
        height: 20vh;
        font-size: clamp(1rem, 10vw, 5rem);
        /* center text vertically */
        display: flex;
        align-items: center;
        justify-content: center;

        position: absolute;
        bottom: 0;
        left: 0;
    }

    :fullscreen .card img {
        height: 60vw;
    }

    ::backdrop {
        background-color: #760000;
    }
</style>
