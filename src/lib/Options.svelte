<script>
    export let cards;
    export let currentCardIndex;
    export let numberOfOptions = 2;
    export let shuffleTrigger;

    let drawnCards = null; // Initialize as null to indicate loading state

    function randomCardIndex(excludeIndices = []) {
        let randomCard;
        do {
            randomCard = Math.floor(Math.random() * cards.length);
        } while (excludeIndices.includes(randomCard));
        return randomCard;
    }

    async function drawCards() {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

        // Start with the current card
        let currentCard = {
            ...cards[currentCardIndex],
            isCorrect: true,
            clicked: false,
        };

        // Generate random cards
        let randomCards = [];
        let usedIndices = [currentCardIndex]; // Keep track of used indices to avoid duplicates

        while (randomCards.length < numberOfOptions - 1) {
            let randomCardIndexValue = randomCardIndex(usedIndices);
            usedIndices.push(randomCardIndexValue);

            randomCards.push({
                ...cards[randomCardIndexValue],
                isCorrect: false,
                clicked: false,
            });
        }

        // Combine current card with random cards and shuffle
        let myCards = [currentCard, ...randomCards].sort(
            () => Math.random() - 0.5,
        );
        drawnCards = myCards; // Update drawnCards after drawing
    }

    // Draw cards initially
    drawCards();

    function handleClick(card) {
        card.clicked = true; // Mark the card as clicked
        // Reassign drawnCards to trigger reactivity
        drawnCards = [...drawnCards];
    }

    $: if (shuffleTrigger) {
        console.log("shuffling...");
        drawCards();
    }
</script>

<div class="options">
    {#if drawnCards}
        <!-- loop through drawncards -->
        {#each drawnCards as card}
            <button
                class={"card " +
                    (card.clicked ? (card.isCorrect ? "green" : "red") : "")}
                on:click={() => handleClick(card)}
            >
                {card.answer}
            </button>
        {/each}
    {:else}
        <!-- Loading state -->
        <p>Loading cards...</p>
    {/if}
</div>

<style global>
    .options {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 50%);
        margin: 0 auto;
        gap: 10px;
        padding: 20px;
        box-sizing: border-box;
    }

    button {
        width: 100%;
        font-size: 20px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease;
        box-sizing: border-box;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
    }

    .green {
        background-color: green;
        color: white;
    }

    .red {
        background-color: red;
        color: white;
    }
</style>
