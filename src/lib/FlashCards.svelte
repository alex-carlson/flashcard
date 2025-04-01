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
        faCompress,
        faPlus,
        faMinus,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    import Pagination from "./Pagination.svelte";
    import { on } from "svelte/events";
    export let collection;
    export let author;
    let collectionData = {};
    let cards = [];
    let isGrid = false;
    let isFullscreen = false;

    // function to fetch collection from id
    async function fetchCollection() {
        console.log("Fetching collection with:", collection);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/user/${author}/${collection}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }

            const data = await response.json();

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
        console.log("Toggling reveal for card:", index);
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
        isGrid = !isGrid;
        console.log("Toggling grid mode:", isGrid);
    }

    function scaleImage(amount) {
        cards = cards.map((card) => {
            card.scale += amount;
            // prevent scale from reaching 0
            if (card.scale < 0.1) {
                card.scale = 0.1;
            }
            return card;
        });
    }

    function resetImageScale() {
        cards = cards.map((card) => {
            card.scale = 1;
            return card;
        });
    }

    function goFullscreen() {
        // exit grid mode
        if (isGrid) {
            toggleGrid();
        }
        isFullscreen = true;
        const grid = document.querySelector(".container");
        if (grid.requestFullscreen) {
            grid.requestFullscreen();
        } else if (grid.webkitRequestFullscreen) {
            grid.webkitRequestFullscreen();
        } else if (grid.msRequestFullscreen) {
            grid.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        isFullscreen = false;
        // set zoom to 1
        resetImageScale();
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
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

<div class="container p-4">
    <div
        class="d-flex flex-column align-items-center bg-light p-4 rounded toolbar"
    >
        <div class="d-flex gap-2">
            <button class="btn btn-primary" on:click={shuffleCards}>
                <Fa icon={faShuffle} />
            </button>
            <button class="btn btn-primary" on:click={toggleCards}>
                <Fa icon={areAnyCardsRevealed() ? faEyeSlash : faEye} />
            </button>
            {#if isFullscreen}
                <button
                    class="btn btn-primary"
                    on:click={() => scaleImage(-0.25)}
                >
                    <Fa icon={faMinus} />
                </button>
                <button
                    class="btn btn-primary"
                    on:click={() => scaleImage(0.25)}
                >
                    <Fa icon={faPlus} />
                </button>
            {:else}
                <button class="btn btn-primary" on:click={toggleGrid}>
                    <Fa icon={isGrid ? faList : faTableCells} />
                </button>
            {/if}
            <button
                class="btn btn-primary"
                on:click={isFullscreen ? exitFullscreen : goFullscreen}
            >
                <Fa icon={isFullscreen ? faCompress : faExpand} />
            </button>
        </div>
    </div>

    {#if cards.length > 0}
        <div class="headline">
            <h1 class="h2 font-weight-bold text-center mt-4">{collection}</h1>
            <p class="text-center text-muted">
                by <a href={`#/${author}`} class="text-primary">{author}</a>
            </p>
        </div>

        <div
            class={"flashcards " +
                (isGrid
                    ? "grid" //grid with 3 columns
                    : "d-flex flex-row align-items-center vertical")}
        >
            {#each cards as item, i}
                <div
                    class="card"
                    role="button"
                    tabindex="0"
                    on:click={() => toggleReveal(i)}
                    on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
                >
                    <img
                        src={item.imageUrl}
                        alt="flashcard"
                        style={`transform: scale(${item.scale})`}
                        on:load={() => onCardLoad(i)}
                        on:error={() => {
                            item.hidden = true;
                            updateCards();
                        }}
                        class="img-fluid select-none position-relative zoomable"
                    />
                    <span
                        class={"position-absolute bottom-0 start-0 w-100 bg-dark text-white p-3 transition-opacity " +
                            (item.revealed ? "opacity-100" : "opacity-0")}
                    >
                        {item.answer}
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- <Pagination {cards} /> -->

<style global>
    .flashcards {
        height: calc(100vh - 140px);
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 0;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(
            3,
            1fr
        ); /* Create 3 columns of equal width */
        gap: 0px; /* Space between cards */
    }

    .card {
        overflow: hidden;
        font-weight: 800;
        text-align: center;
        transition: transform 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        scroll-snap-align: start;
        position: relative;
        cursor: pointer;
    }

    .card span {
        padding: 0.4em;
        background: black;
        color: white;
        width: 100%;
        display: block;
        box-sizing: border-box;
        font-size: clamp(1rem, 10vw, 2rem);
        /* center text vertically */
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card img {
        max-width: 100%;
    }

    .grid .card {
        height: auto;
    }

    .grid .card span {
        font-size: 12px;
    }

    .vertical .card {
        height: calc(100vh - 140px);
    }

    .zoomable {
        transition-timing-function: cubic-bezier(0.64, 0.57, 0.67, 1.53);
        transition: transform 0.2s;
        touch-action: manipulation;
    }

    .opacity-0 {
        opacity: 0;
    }

    .opacity-100 {
        opacity: 1;
    }

    :fullscreen {
        overflow-x: hidden;
    }

    :fullscreen.container {
        padding: 0;
        margin: 0;
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

    /* make it so the toolbar is fixed in full screen mode */
    :fullscreen .toolbar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        padding: 1em 0;
    }

    :fullscreen .toolbar .row {
        gap: 4px;
        /* flex items to fit content */
        flex-wrap: wrap;
    }

    :fullscreen .toolbar button {
        /* make buttons full width */
        width: 100%;
        max-width: 50px;
    }

    :fullscreen .headline {
        display: none;
    }

    :fullscreen .flashcards {
        height: 100vh;
        background: black;
    }

    :fullscreen.container {
        overflow-y: hidden;
    }
    .btn {
        padding: 0.5rem;
    }

    :not(:root):fullscreen::backdrop {
        background: black;
    }
</style>
