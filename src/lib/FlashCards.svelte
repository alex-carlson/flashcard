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
    export let collection = null;
    export let author_id = null;
    let author = null;
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
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/collections/user/${author_id}/${collection}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }

            const data = await response.json();

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
        // can reset if either any card has a scale of something other than 1, or if any card has been hidden
        canReset = cards.some((card) => card.scale !== 1 || card.hidden);
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

    function selectOption(e, item) {
        const value = e.target.value; // Get the selected value

        if (value === "Hide") {
            item.hidden = !item.hidden; // Toggle the hidden state
        } else if (value === "Reset") {
            item.scale = 1; // Reset the scale
        }

        updateCards(); // Trigger reactivity to update the UI
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

<div class="container">
    <div class="toolbar">
        <button on:click={shuffleCards}>
            <Fa icon={faShuffle} />
        </button>
        <button on:click={toggleCards}>
            <Fa icon={areAnyCardsRevealed() ? faEyeSlash : faEye} />
        </button>
        {#if canReset}
            <button on:click={resetCards}>
                <Fa icon={faRotateBack} />
            </button>
        {/if}
        {#if isFullscreen}
            <button on:click={() => scaleImage(-0.25)}>
                <Fa icon={faMinus} />
            </button>
            <button on:click={() => scaleImage(0.25)}>
                <Fa icon={faPlus} />
            </button>
        {:else}
            <button on:click={toggleGrid}>
                <Fa icon={isGrid ? faList : faTableCells} />
            </button>
        {/if}
        <button on:click={isFullscreen ? exitFullscreen : goFullscreen}>
            <Fa icon={isFullscreen ? faCompress : faExpand} />
        </button>
    </div>

    {#if cards.length > 0}
        <div class="headline padding">
            <h1>{collection}</h1>
            <p>
                by <a href={`#/${author_id}`}>{author}</a>
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

        <div class={"flashcards padding " + (isGrid ? "grid" : "vertical")}>
            {#each cards as item, i}
                {#if !item.hidden}
                    <div
                        class="card {item.revealed ? 'revealed' : ''}"
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
                            class="img-fluid select-none position-relative zoomable"
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
                            <span
                                class={item.revealed ? "revealed" : "hidden"}
                                style="transform: scale(1);">{item.answer}</span
                            >
                        {/if}

                        <div class="card-options">
                            <select
                                name="card-options"
                                id="cardOptions"
                                on:change={(e) => selectOption(e, item)}
                            >
                                <option value="...">...</option>
                                <option value="Hide"> Hide </option>
                                <option value="Reset">Reset Scale</option>
                            </select>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>
