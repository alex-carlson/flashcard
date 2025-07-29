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
    import LazyLoadImage from "./LazyLoadImage.svelte";
    export let collection = null;
    export let author_id = null;
    export let isPartyMode = false;
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
        FILL_IN_THE_BLANK: "Fill in the Blank",
    };

    let currentMode = Modes.DEFAULT;

    const dispatch = createEventDispatcher();

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

    export function setRevealed(index, value) {
        // get card at index and add the class "disabled"
        console.log(
            "Setting revealed for card at index:",
            index,
            "to value:",
            value,
        );
        if (cards[index]) {
            cards[index].revealed = value;
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

    function areStringsClose(a, b, threshold = 0.8) {
        a = a
            .replace(/\bthe\b/gi, "")
            .trim()
            .toLowerCase();
        b = b
            .replace(/\bthe\b/gi, "")
            .trim()
            .toLowerCase();

        if (!a || !b) return false;

        const lenA = a.length;
        const lenB = b.length;
        const matrix = [];

        // Initialize the matrix
        for (let i = 0; i <= lenB; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= lenA; j++) {
            matrix[0][j] = j;
        }

        // Fill in the matrix
        for (let i = 1; i <= lenB; i++) {
            for (let j = 1; j <= lenA; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1, // deletion
                    );
                }
            }
        }

        const distance = matrix[lenB][lenA];
        const maxLen = Math.max(lenA, lenB);
        const similarity = 1 - distance / maxLen;

        return similarity >= threshold;
    }

    function completeQuiz() {
        // show an alert with the number of correct answers
        const correctAnswers = cards.filter(
            (card) => card.revealed && card.userAnswer === card.answer,
        ).length;

        const percentage = Math.round((correctAnswers / cards.length) * 100);

        const myGrade = toLetterGrade(percentage);

        // alert with grade and percentage
        alert(
            `You answered ${correctAnswers} out of ${cards.length} questions correctly.\nYour grade is ${myGrade} (${percentage}%).`,
        );
    }

    function toLetterGrade(score) {
        if (score >= 85) return "A";
        if (score >= 80) return "A-";
        if (score >= 70) return "B";
        if (score >= 65) return "B-";
        if (score >= 60) return "C+";
        if (score >= 55) return "C";
        if (score >= 50) return "D";
        return "F";
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

		<QuizHeader
			collectionName={$quiz.collection.name}
			author={$quiz.collection.author}
			authorSlug={$quiz.collection.author_slug}
			thumbnail={$quiz.collection.thumbnail}
			description={$quiz.collection.description}
		/>

		{#if !isPartyMode}
			<select class="my-3" name="mode" id="mode" on:change={(e) => setMode(e.target.value)}>
				{#each [['FILL_IN_THE_BLANK', 'Fill in the Blank'], ['TRUE_FALSE', '50/50'], ['MULTIPLE_CHOICE', 'Multiple Choice'], ['FLASH_CARDS', 'Flashcard']] as [mode, label]}
					<option value={mode} selected={mode === $quiz.currentMode}>
						{label}
					</option>
				{/each}
			</select>
		{/if}

		<div class={'flashcards ' + ($quiz.isGrid ? 'grid' : 'vertical')}>
			{#if $quiz.hasInitialized}
				{#each $quiz.cards as item, i (item)}
					<Card
						item={$quiz.cards[i]}
						{i}
						cards={$quiz.cards}
						currentMode={$quiz.currentMode}
						shuffleTrigger={$quiz.shuffleTrigger}
						{onCardLoad}
						{toggleReveal}
						updateCards={() => {}}
						on:correctAnswer={() => onCorrectAnswer({ index: i, answer: $quiz.cards[i].answer })}
						on:giveUp={(e) => setRevealed(e.detail.index, true)}
					/>
				{/each}
			{/if}
		</div>

        <div class={"flashcards padding " + (isGrid ? "grid" : "vertical")}>
            {#each cards as item, i}
                {#if !item.hidden}
                    <div
                        class="card {item.revealed ? 'revealed' : ''}"
                        role="button"
                        tabindex="0"
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
                            <!-- make a text input with debounce -->
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
                                                    completeQuiz();
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
</div>
