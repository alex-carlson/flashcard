<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    let fileInput; // Reference to the <input type="file"> element
    let myImg;
    let imgElement = null; // Reference to the <img> element

    const convertFileToImage = (e) => {
        const image = e.target.files[0];

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/svg+xml",
            "image/webp",
        ];

        if (!image || !allowedTypes.includes(image.type)) {
            alert("Only images are allowed (jpeg, png, gif, svg, webp)");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(image);

        reader.onload = (e) => {
            myImg = e.target.result;

            // If a forced extension is provided, convert the File to a new one with the new type
            let imageToDispatch = image;
            dispatch("uploadImage", imageToDispatch);
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
