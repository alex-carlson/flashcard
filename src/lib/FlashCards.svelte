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
        faFlag,
        faRotateBack,
    } from "@fortawesome/free-solid-svg-icons";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    import Options from "./Options.svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
    import { fetchCollectionById } from "./collections";
    import { completeQuiz } from "$lib/user";
    import { user } from "$stores/user";
    import Modal from "./Modal.svelte";
    import ProfilePicture from "./ProfilePicture.svelte";
    import { areStringsClose } from "$lib/utils";
    import { getScoreMessage } from "./quizScore";
    export let collection = null;
    export let author_id = null;
    export let isPartyMode = false;
    let author = null;
    let collectionId = null;
    let cards = [];
    let isGrid = false;
    let isFullscreen = false;
    let canReset = false;
    let shuffleTrigger = 0;
    let isComplete = false;
    let showModal = false;

    // create enum modes for default, true/false, and multiple choice
    const Modes = {
        FILL_IN_THE_BLANK: "Fill in the Blank",
        FLASH_CARDS: "Flash Cards",
        TRUE_FALSE: "True / False",
        MULTIPLE_CHOICE: "Multiple Choice",
    };

    let currentMode = "FILL_IN_THE_BLANK";

    const dispatch = createEventDispatcher();

    // function to fetch collection from id
    async function fetchCollection() {
        try {
            const data = await fetchCollectionById(author_id, collection);

            author = data.author;
            collectionId = data.id;

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
                userAnswer: "",
                answer: card.answer || "", // ensure answer is defined
            }));
            // if isPartyMode, set mode to FILL_IN_THE_BLANK
            if (isPartyMode) {
                currentMode = "FILL_IN_THE_BLANK";
            }
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

    export function setRevealed(index, value, playerId = null) {
        // get card at index and add the class "disabled"
        console.log(
            "Setting revealed for card at index:",
            index,
            "to value:",
            value,
        );
        if (cards[index]) {
            cards[index].revealed = value;
            if (playerId) {
                cards[index].answerer = playerId; // store who answered the card
            }
            updateCards();
        }
    }

    function toggleReveal(index) {
        cards[index].revealed = !cards[index].revealed;
    }

    function shuffleCards() {
        // Fisher-Yates shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        // If needed to trigger reactivity (e.g., in a Svelte or React app)
        cards = [...cards]; // create a new array reference
        shuffleTrigger += 1;
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
        } else if (value === "Reveal") {
            item.revealed = true; // Reveal the answer
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

    function onCompleteQuiz() {
        // show an alert with the number of correct answers
        const correctAnswers = cards.filter(
            (card) => card.revealed && card.userAnswer === card.answer,
        ).length;

        const percentage = Math.round((correctAnswers / cards.length) * 100);

        if ($user) {
            console.log("Completing quiz with content:", {
                userId: $user.id,
                collectionId,
                token: $user.token,
            });
            completeQuiz($user.id, collectionId, percentage, $user.token);
        }

        showModal = true;
        isComplete = true;
    }

    onMount(() => {
        fetchCollection();
    });
</script>

<div class="container">
    {#if !isPartyMode}
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
    {/if}

    {#if cards.length > 0}
        <div class="headline padding">
            <h1>{collection}</h1>
            <p>
                by <a href={`#/${author_id}`}>{author}</a>
            </p>
            {#if !isPartyMode}
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
            {/if}
        </div>

        <div class={"flashcards padding " + (isGrid ? "grid" : "vertical")}>
            {#each cards as item, i}
                {#if !item.hidden}
                    <div
                        class="card {item.revealed
                            ? 'revealed'
                            : ''} {item.incorrect ? 'incorrect' : ''}"
                        role="button"
                        tabindex="-1"
                        on:keydown={(e) =>
                            currentMode === Modes.DEFAULT &&
                            e.key === "Enter" &&
                            toggleReveal(i)}
                        on:click={() =>
                            currentMode === Modes.DEFAULT && toggleReveal(i)}
                    >
                        <LazyLoadImage
                            imageUrl={item.imageUrl}
                            on:load={() => onCardLoad(i)}
                            on:error={() => {
                                item.hidden = true;
                                updateCards();
                            }}
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
                        {:else if currentMode === "FILL_IN_THE_BLANK"}
                            {#if item.answerer}
                                <ProfilePicture
                                    userId={item.answerer}
                                    size={32}
                                    class="answerer"
                                />
                            {/if}
                            <span
                                class={item.revealed ? "revealed" : "hidden"}
                                style="transform: scale(1);">{item.answer}</span
                            >
                            <input
                                type="text"
                                placeholder="Type your answer here..."
                                bind:value={item.userAnswer}
                                on:input={(e) => {
                                    clearTimeout(item._debounceTimeout);
                                    item._debounceTimeout = setTimeout(() => {
                                        if (
                                            areStringsClose(
                                                item.userAnswer,
                                                item.answer,
                                                0.9,
                                            )
                                        ) {
                                            item.revealed = true;
                                            item.userAnswer = item.answer; // set user answer to correct answer
                                            e.target.value = item.answer; // update input value
                                            // lock the input
                                            e.target.disabled = true;
                                            // hide the input
                                            e.target.style.display = "none";
                                            e.target.style.backgroundColor =
                                                "#d4edda"; // light green background

                                            dispatch("correctAnswer", {
                                                index: i,
                                            });

                                            // get all inputs in .flashcards, and select input[index+1]
                                            const inputs =
                                                document.querySelectorAll(
                                                    ".flashcards input",
                                                );
                                            let foundNext = false;
                                            for (
                                                let j = i + 1;
                                                j < inputs.length;
                                                j++
                                            ) {
                                                if (!inputs[j].disabled) {
                                                    // Scroll so the input is at the bottom of the view (accounting for keyboard on mobile)
                                                    inputs[j].scrollIntoView({
                                                        behavior: "smooth",
                                                        block: "end",
                                                        inline: "nearest",
                                                    });
                                                    setTimeout(() => {
                                                        inputs[j].focus({
                                                            preventScroll: true,
                                                        });
                                                    }, 200);
                                                    foundNext = true;
                                                    break;
                                                }
                                            }
                                            // If no more enabled inputs, call completeQuiz
                                            if (!foundNext) {
                                                setTimeout(() => {
                                                    onCompleteQuiz();
                                                }, 300);
                                            }
                                        }
                                    }, 100); // debounce delay in ms
                                }}
                            />
                        {:else}
                            <span
                                class={item.revealed ? "revealed" : "hidden"}
                                style="transform: scale(1);">{item.answer}</span
                            >
                        {/if}

                        {#if !isPartyMode}
                            <div class="card-options">
                                <select
                                    name="card-options"
                                    id="cardOptions"
                                    on:change={(e) => selectOption(e, item)}
                                >
                                    <option value="...">...</option>
                                    <option value="Hide"> Hide </option>
                                    <option value="Reveal"> Reveal </option>
                                    <option value="Reset">Reset Scale</option>
                                </select>
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    {/if}

    <div class="padding">
        <button class="give-up" on:click={onCompleteQuiz}>
            <span>Give Up <Fa icon={faFlag} style="margin-left: 0.5rem" /></span
            >
        </button>
    </div>

    <Modal
        bind:show={showModal}
        title="Quiz Completed"
        message={getScoreMessage(
            Math.round(
                (cards.filter(
                    (card) => card.revealed && card.userAnswer === card.answer,
                ).length /
                    cards.length) *
                    100,
            ),
        )}
        onClose={() => {
            showModal = false;
            // reveal all cards
            cards = cards.map((card) => {
                if (card.userAnswer !== card.answer) {
                    card.incorrect = true;
                }
                card.revealed = true;
                return card;
            });
        }}
        buttons={[
            {
                text: "Close",
                action: () => {
                    showModal = false;
                    // reveal all cards
                    cards = cards.map((card) => {
                        if (card.userAnswer !== card.answer) {
                            card.incorrect = true;
                        }
                        card.revealed = true;
                        return card;
                    });
                },
                class: "bg-gray-300 text-black",
            },
            {
                text: "Leaderboards",
                action: () => {
                    window.location.hash = "#/leaderboard";
                },
                class: "bg-blue-500 text-white",
            },
        ]}
    />
</div>
