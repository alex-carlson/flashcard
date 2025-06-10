<script>
    import { createEventDispatcher, onMount } from "svelte";
    import LazyLoadImage from "./LazyLoadImage.svelte";
    import Options from "./Options.svelte";
    import ProfilePicture from "./ProfilePicture.svelte";
    import { Modes } from "./constants";
    import YoutubeAudioPlayer from "./YoutubeAudioPlayer.svelte";
    import { areStringsClose } from "./utils";

    export let item;
    export let i;
    export let cards; // <-- Add this line
    export let currentMode;
    export let isPartyMode;
    export let shuffleTrigger;
    export let onCardLoad;
    export let toggleReveal;
    export let selectOption;
    export let updateCards;
    export let onCompleteQuiz;

    const dispatch = createEventDispatcher();

    function handleInput(e) {
        clearTimeout(item._debounceTimeout);
        item._debounceTimeout = setTimeout(() => {
            if (areStringsClose(item.userAnswer, item.answer, 0.9)) {
                item.revealed = true;
                item.userAnswer = item.answer;
                e.target.value = item.answer;
                e.target.disabled = true;
                e.target.style.display = "none";
                e.target.style.backgroundColor = "#d4edda";

                dispatch("correctAnswer", { index: i });

                const inputs = document.querySelectorAll(".flashcards input");
                for (let j = i + 1; j < inputs.length; j++) {
                    if (!inputs[j].disabled) {
                        inputs[j].scrollIntoView({
                            behavior: "smooth",
                            block: "end",
                            inline: "nearest",
                        });
                        setTimeout(() => {
                            inputs[j].focus({ preventScroll: true });
                        }, 80);
                        break;
                    }
                }
            }
        }, 100);
    }
</script>

{#if !item.hidden}
    <div
        class="card {item.revealed ? 'revealed' : ''} {item.incorrect
            ? 'incorrect'
            : ''}"
        role="button"
        tabindex="-1"
        on:keydown={(e) =>
            currentMode === Modes.DEFAULT &&
            e.key === "Enter" &&
            toggleReveal(i)}
        on:click={() => currentMode === Modes.DEFAULT && toggleReveal(i)}
    >
        {#if item.type === "audio"}
            <div class="padding">
                <YoutubeAudioPlayer id={item.id} videoId={item.audio} />
            </div>
        {:else if item.type === "image"}
            <LazyLoadImage
                imageUrl={item.imageUrl}
                on:load={() => onCardLoad(i)}
                on:error={() => {
                    item.hidden = true;
                    updateCards();
                }}
            />
        {:else if item.type === "text"}
            <h2>{item.question}</h2>
        {/if}

        {#if currentMode === "MATCHING"}
            <span class="matching-answer">
                {item.answer}
            </span>
        {/if}

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
                style="transform: scale(1);"
            >
                {item.answer}
            </span>
            <input
                type="text"
                placeholder="Type your answer here..."
                bind:value={item.userAnswer}
                on:input={handleInput}
            />
        {:else}
            <span
                class={item.revealed ? "revealed" : "hidden"}
                style="transform: scale(1);"
            >
                {item.answer}
            </span>
        {/if}

        {#if !isPartyMode}
            <div class="card-options">
                <select
                    name="card-options"
                    id="cardOptions"
                    on:change={(e) => selectOption(e, item)}
                >
                    <option value="...">...</option>
                    <option value="Hide">Hide</option>
                    <option value="Reveal">Reveal</option>
                    <option value="Reset">Reset Scale</option>
                </select>
            </div>
        {/if}
    </div>
{/if}
