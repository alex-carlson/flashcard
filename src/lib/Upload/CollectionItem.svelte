<script>
    import { createEventDispatcher } from "svelte";
    import { Fa } from "svelte-fa";
    import {
        faPenToSquare,
        faTrashCan,
        faFloppyDisk,
        faBan,
        faChevronUp,
        faChevronDown,
    } from "@fortawesome/free-solid-svg-icons";
    export let item;
    export let index;
    export let editableItemId;
    export let isReordering;
    const dispatch = createEventDispatcher();

    function removeItemHandler() {
        dispatch("removeItem", item.id);
    }

    function reorderItemHandler(newIndex) {
        dispatch("reorderItem", { itemId: item.id, newIndex });
    }

    function saveEditHandler() {
        editableItemId = null;
        dispatch("saveEdit", item);
    }
</script>

<li class={isReordering ? "item reorder" : "item"} draggable={isReordering}>
    {#if editableItemId === item.id}
        {#if item.question != null}
            <input
                id="editedQuestion"
                type="text"
                bind:value={item.question}
                placeholder="Enter a question"
            />
        {:else if item.audio != null}
            <input
                id="editedAudio"
                type="text"
                bind:value={item.audio}
                placeholder="Enter an audio URL"
            />
        {:else}
            <img src={item.image} alt="" />
        {/if}
        <input
            id="editedAnswer"
            type="text"
            bind:value={item.answer}
            placeholder="Enter an answer"
        />
        <div class="vertical">
            <button class="success" on:click={saveEditHandler}
                ><Fa icon={faFloppyDisk} /></button
            >
            <button class="danger" on:click={(editableItemId = null)}
                ><Fa icon={faBan} /></button
            >
        </div>
    {:else}
        {#if item.question != null}
            <span class="question">{item.question}</span>
        {:else if item.audio != null}
            <iframe
                title="YouTube audio player"
                class="audio"
                width="120"
                height="120"
                src={`https://www.youtube.com/embed/${item.audio}`}
                frameborder="0"
            ></iframe>
        {:else}
            <img class="preview" src={item.file || item.image} alt="Preview" />
        {/if}
        <span>{item.answer}</span>
        {#if isReordering}
            <div class="reorder">
                <button on:click={() => reorderItemHandler(index, index - 1)}>
                    <Fa icon={faChevronUp} />
                </button>
                <button on:click={() => reorderItemHandler(index, index + 1)}>
                    <Fa icon={faChevronDown} />
                </button>
            </div>
        {:else}
            <div class="vertical">
                <button
                    class="edit secondary"
                    on:click={() => (editableItemId = item.id)}
                >
                    <Fa icon={faPenToSquare} />
                </button>
                <button
                    class="remove danger"
                    on:click={() => removeItemHandler(item.id)}
                >
                    <Fa icon={faTrashCan} />
                </button>
            </div>
        {/if}
    {/if}
</li>
