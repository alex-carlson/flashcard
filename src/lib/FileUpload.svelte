<script>
    import Resizer from "react-image-file-resizer";
    import { createEventDispatcher } from "svelte";
    import Fa from "svelte-fa";
    import { faClipboard } from "@fortawesome/free-solid-svg-icons";
    // We'll call this function later to resize images
    const resize = Resizer.imageFileResizer;
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

        //wait for resize image and then return the image
        resizeImage(image).then((resizedImage) => {
            dispatch("resizeImage", { resizedImage });
        });
    };

    let resizeImage = (file) => {
        // convert file to
        return new Promise((resolve, reject) => {
            resize(
                file,
                600,
                600,
                "JPEG",
                60,
                0,
                (uri) => resolve(uri),
                "blob",
            );
        });
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

                    // Wait for resized image and then return the image
                    resizeImage(file).then((resizedImage) => {
                        dispatch("resizeImage", { resizedImage });
                    });
                }
            }
        }
    };

    const getClipboard = async () => {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type === "image/png") {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], "image.png", { type });
                    handleImage(file);
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
    >
        <p>Drop your image or click here</p>
        <img class="preview" src="" alt="" />
    </div>
</div>
<input
    style="display: none"
    type="file"
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
