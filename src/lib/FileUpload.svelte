<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    let fileInput; // Reference to the <input type="file"> element
    let myImg;
    let imgElement = null; // Reference to the <img> element

    const convertFileToImage = (e) => {
        const image = e.target.files[0];

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/svg+xml",
                "image/webp",
            ].includes(image?.type)
        ) {
            alert("Only images are allowed (jpeg, png, gif, svg, webp)");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(image);

        reader.onload = (e) => {
            myImg = e.target.result;
            dispatch("uploadImage", image); // Only dispatch after image is loaded
            fileInput.value = ""; // Reset input inside the onload
        };
    };

    const handlePaste = async (e) => {
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];
            if (item.type.startsWith("image")) {
                const fileObject = item.getAsFile();
                if (fileObject) {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileObject);
                    reader.onload = (e) => {
                        myImg = e.target.result;
                        dispatch("uploadImage", fileObject);
                    };
                }
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        //prevent open image as file in new tab
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            convertFileToImage({ target: { files: [file] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy"; // Show copy cursor
    };

    window.addEventListener("paste", handlePaste);
</script>

<div
    class="drop-zone"
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
    <div class="drop-zone__prompt">
        <p class={"text " + (myImg ? "filled" : "empty")}>
            Drop your image or click here
        </p>
        <img
            bind:this={imgElement}
            class="preview"
            src={myImg}
            alt=""
            key={myImg}
        />
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
