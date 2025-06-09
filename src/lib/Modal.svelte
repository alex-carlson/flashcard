<script>
    export let show = false;
    export let title = "";
    export let message = "";
    export let onClose = () => {};
    export let buttons = [
        {
            text: "Close",
            action: () => onClose(),
            class: "bg-gray-300 text-black",
        },
    ];

    function handleBackgroundClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
</script>

{#if show}
    <div
        class="modal fade show d-block"
        tabindex="-1"
        on:click={handleBackgroundClick}
    >
        <div class="modal-dialog white padding">
            <div class="modal-content" on:click|stopPropagation>
                <div class="modal-header">
                    <h2 class="modal-title">{title}</h2>
                </div>
                <div class="modal-body">
                    <p>{message}</p>
                </div>
                <div class="modal-footer">
                    {#each buttons as btn}
                        <button
                            type="button"
                            class={btn.class ? btn.class : "btn btn-secondary"}
                            on:click={btn.action}
                        >
                            {btn.text}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}
