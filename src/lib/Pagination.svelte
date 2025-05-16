<script>
    import Fa from "svelte-fa";
    import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
    import { onMount, tick } from "svelte";

    export let cards = []; // Cards array dynamically updated
    let currentIndex = 0;
    let isVisible = false;
    let observer;

    async function scrollToCard(index) {
        await tick(); // Ensure elements exist before querying
        const cardElements = document.querySelectorAll(".card");
        if (cardElements[index]) {
            cardElements[index].scrollIntoView({ behavior: "smooth" });
            currentIndex = index;
        }
    }

    function nextCard() {
        scrollToCard(Math.min(currentIndex + 1, cards.length - 1));
    }

    function prevCard() {
        scrollToCard(Math.max(currentIndex - 1, 0));
    }

    async function setupObserver() {
        await tick(); // Ensure DOM updates before querying elements

        const flashcardsElement = document.querySelector(".flashcards");
        if (!flashcardsElement) return;

        if (observer) observer.disconnect(); // Reset observer to avoid duplicates

        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible = entry.isIntersecting;
                });
            },
            { threshold: 0.5 },
        );

        observer.observe(flashcardsElement);
    }

    // Re-run observer setup when cards change
    $: if (cards.length > 0) {
        setupObserver();
    }

    onMount(setupObserver);
</script>

{#if isVisible}
    <div class="pagination">
        <button on:click={prevCard}><Fa icon={faArrowUp} /></button>
        <button on:click={nextCard}><Fa icon={faArrowDown} /></button>
    </div>
{/if}