<script>
    import Fa from "svelte-fa";
    import {
        faShuffle,
        faEyeSlash,
        faEye,
        faTableCells,
        faList,
        faExpand,
        faCompress,
        faPlus,
        faMinus,
        faEllipsisVertical,
        faRotateBack,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    import Options from "./Options.svelte";
    export let collection;
    export let author;
    let cards = [];
    let isGrid = false;
    let isFullscreen = false;
    let canReset = false;
    let shuffleTrigger = 0;

    // create enum modes for default, true/false, and multiple choice
    const Modes = {
        DEFAULT: "Flash Cards",
        TRUE_FALSE: "True / False",
        MULTIPLE_CHOICE: "Multiple Choice",
    };

    let currentMode = Modes.DEFAULT;

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
        // can reset if either any card has a scale of something other than 1, or if any card has been hidden
        canReset = cards.some((card) => card.scale !== 1 || card.hidden);
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
        cards = [...cards];
        shuffleTrigger += 1; // trigger shuffle
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

    function resetCards() {
        // loop through cards and reset visibility and scale
        cards = cards.map((card) => {
            card.hidden = false;
            card.scale = 1;
            return card;
        });
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

    function SetMode(mode) {
        currentMode = mode;

        // force update cards
        cards = cards.map((card) => {
            card.revealed = false;
            return card;
        });

        cards = [...cards];
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
            {#if canReset}
                <button class="btn btn-primary" on:click={resetCards}>
                    <Fa icon={faRotateBack} />
                </button>
            {/if}
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
            <select
                name="mode"
                id="mode"
                on:change={() => SetMode(event.target.value)}
            >
                {#each Object.keys(Modes) as mode}
                    <option value={mode}>
                        {Modes[mode]}
                    </option>
                {/each}
            </select>
        </div>

        <div
            class={"flashcards " +
                (isGrid
                    ? "grid" //grid with 3 columns
                    : "d-flex flex-row align-items-center vertical")}
        >
            {#each cards as item, i}
                {#if !item.hidden}
                    <div
                        class="card"
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
                        on:click={() => toggleReveal(i)}
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
                            class={"img-fluid select-none position-relative zoomable"}
                        />
                        {#if currentMode === "TRUE_FALSE"}
                            <Options
                                {cards}
                                currentCardIndex={i}
                                numberOfOptions="2"
                                {shuffleTrigger}
                            />
                        {:else if currentMode === "MULTIPLE_CHOICE"}
                            <Options
                                {cards}
                                currentCardIndex={i}
                                numberOfOptions="4"
                                {shuffleTrigger}
                            />
                        {:else}
                            <!-- render span with opacity-0 or opacity-100 depending on if revealed or not -->
                            <span
                                class={"opacity-" +
                                    (item.revealed ? "100" : "0") +
                                    " text-center"}
                                style="transform: scale(1);">{item.answer}</span
                            >
                        {/if}

                        <!-- add a ... button with select dropdown options -->
                        <div class="card-options">
                            <select name="card-options" id="cardOptions">
                                <option value="...">...</option>
                                <option
                                    value="..."
                                    on:click={() => {
                                        item.hidden = !item.hidden;
                                        updateCards();
                                    }}
                                >
                                    Hide
                                </option>
                                <option
                                    value="..."
                                    on:click={() => {
                                        item.scale = 1;
                                        updateCards();
                                    }}
                                >
                                    Reset Scale
                                </option>
                            </select>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<!-- <Pagination {cards} /> -->

<style global>
    .flashcards {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 0;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(
            4,
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
        background-color: rgba(0, 0, 0, 0.1);
        margin-top: 10px;
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

    .card .card-options {
        position: absolute;
        top: 0;
        right: 0;

        select {
            background: transparent;
            border: 0;
            padding: 5px;
            box-sizing: border-box;
            width: 45px;
            height: 45px;
            color: #858585;

            /* hide down arrow */

            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;

            option {
                background: black;
            }
        }
    }

    .grid .card {
        /* height: auto; */
        height: 100%;
        display: inline-table;
    }

    .grid .card span {
        font-size: 12px;
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
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
        overflow-y: auto;
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
