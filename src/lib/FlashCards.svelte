<script>
    import { sheetData, bestMatch } from "./sheetStore";
    import { writable } from "svelte/store";

    let revealed = writable([]);
    let imageLoaded = writable([]);

    $: if ($sheetData.length > 0 && revealed.length !== $sheetData.length) {
        revealed.set(Array($sheetData.length).fill(false));
    }

    function toggleReveal(index) {
        revealed.update((r) => {
            r[index] = !r[index];
            return [...r];
        });
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function shuffleCards() {
        sheetData.update((data) => {
            return data.sort(() => Math.random() - 0.5);
        });
    }

    function resetCards() {
        revealed.set(Array($sheetData.length).fill(false));
    }
</script>

<!-- if best match is empty, show h2 as "Pick a category!" -->

{#if $bestMatch === ""}
    <h1>Pick a category!</h1>
{:else}
    <h2>Flashcards for: {$bestMatch}</h2>
{/if}

{#if $sheetData.length > 0 && $bestMatch !== ""}
    <div class="flashcards">
        {#each $sheetData as row, i}
            <button
                type="button"
                class="card"
                on:click={() => toggleReveal(i)}
                on:keydown={(e) => e.key === "Enter" && toggleReveal(i)}
                aria-expanded={$revealed[i]}
            >
                <div class="card-front">
                    {#if isValidUrl(row[0])}
                        <div class="image-wrapper">
                            {#if !imageLoaded[i]}
                                <div class="loading-spinner"></div>
                            {/if}
                            <img
                                src={row[0]}
                                alt=""
                                class="flashcard-image"
                                on:load={() => (imageLoaded[i] = true)}
                                style="display: {imageLoaded[i]
                                    ? 'block'
                                    : 'none'};"
                            />
                        </div>
                    {:else}
                        {row[0]}
                    {/if}
                </div>
                {#if $revealed[i]}
                    <div class="card-back">{row[1]}</div>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<div class="controls">
    <!-- shuffle cards button -->
    <button type="button" on:click={shuffleCards}>Shuffle Cards</button>
    <!-- reset cards button -->
    <button type="button" on:click={resetCards}>Reset Cards</button>
</div>

<style>
    .flashcards {
        display: flex;
        flex-wrap: wrap;
        gap: 40px;
        justify-content: center;
    }

    .flashcards button {
        box-shadow: 0 10px 15px 5px rgba(0, 0, 0, 0.1);
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
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
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
