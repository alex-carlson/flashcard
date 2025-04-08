<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    let fileInput; // This will be the DOM element <input type="file">
    let myImg;
    let imgElement;

    const convertFileToImage = (e) => {
        let image = e.target.files[0];

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/svg+xml",
                "image/webp",
            ].includes(image.type)
        ) {
            alert("Only images are allowed (jpeg, png, gif, svg, webp)");
            return;
        }

        let reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = (e) => {
            myImg = e.target.result;
        };

        dispatch("uploadImage", image);
    };

    const handlePaste = async (e) => {
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];
            if (item.type.startsWith("image")) {
                const fileObject = item.getAsFile();
                if (fileObject) {
                    let reader = new FileReader();
                    reader.readAsDataURL(fileObject);
                    reader.onload = (e) => {
                        myImg = e.target.result;
                    };

                    dispatch("uploadImage", fileObject);
                }
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            convertFileToImage({ target: { files: [file] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    window.addEventListener("paste", handlePaste);
</script>

<div class="drop-zone">
    <div
        class="drop-zone__prompt"
        role="button"
        tabindex="0"
        on:click={() => fileInput?.click()}
        on:keydown={(e) => {
            if (e.key === "Enter") {
                fileInput?.click();
            }
        }}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
    >
        <p class={"text " + (myImg ? "filled" : "empty")}>
            Drop your image or click here
        </p>
        <img bind:this={imgElement} class="preview" src={myImg} alt="" />
    </div>
</div>

<!-- This is the actual file input element to trigger -->
<input
    style="display: none"
    type="file"
    accept="image/*"
    bind:this={fileInput}
    on:change={convertFileToImage}
/>

<style>
    .drop-zone {
        min-height: 200px;
        border: 4px dashed #797979;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
        font-size: 2em;
        position: relative;
        cursor: pointer;
        margin: 5px 0px 20px 0px;
    }

    .drop-zone img {
        max-width: 100%;
        max-height: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .drop-zone .filled {
        display: none;
    }

    .drop-zone .empty {
        display: block;
    }
</style>
