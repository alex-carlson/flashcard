<script>
    import Resizer from "react-image-file-resizer";
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    // The uncompressed version of the uploaded images, they are bound to the form input element below
    let myFile;
    let myImg;

    let convertFileToImage = (e) => {
        let image = e.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = (e) => {
            myImg = e.target.result;
            // get image preview and set src
            let preview = document.querySelector(".preview");
            preview.src = myImg;
        };

        // make sure file type is either jpeg, png, gif, svg, or webp
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
        } else {
            dispatch("uploadImage", e.target.files[0]);
        }
    };

    const handlePaste = async (e) => {
        // Check if clipboard data contains an image
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];
            if (item.type.startsWith("image")) {
                const file = item.getAsFile();
                if (file) {
                    // Handle the image file from the clipboard
                    let reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        myImg = e.target.result;
                    };

                    dispatch("uploadImage", { file });
                }
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault(); // Prevent default action (e.g., opening the file)

        // Make sure the dropped content is actually a file
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0]; // Use the first file (if multiple files are dropped)
            handleImage(file);
        } else {
            // If no files are detected, check for image content in the drop
            const items = e.dataTransfer.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file" && item.type.startsWith("image")) {
                    const file = item.getAsFile();
                    handleImage(file);
                    break;
                }
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow dropping
    };

    // Listen for the paste event to support Ctrl+P pasting
    window.addEventListener("paste", handlePaste);

    // https://levelup.gitconnected.com/resize-your-images-client-side-with-svelte-js-1d33044b945a
</script>

<div class="drop-zone">
    <div
        class="drop-zone__prompt"
        role="button"
        tabindex="0"
        on:drop={(e) => handleDrop(e)}
        on:dragover={(e) => handleDragOver(e)}
        on:click={() => myFile.click()}
        on:keydown={(e) => {
            if (e.key === "Enter") {
                myFile.click();
            }
        }}
    >
        <p>Drop your image or click here</p>
        <img class="preview" src="" alt="" />
    </div>
</div>
<input
    style="display: none"
    type="file"
    accept="image/*"
    on:change={(e) => convertFileToImage(e)}
    bind:this={myFile}
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
    }

    .drop-zone img {
        max-width: 100%;
        max-height: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>
