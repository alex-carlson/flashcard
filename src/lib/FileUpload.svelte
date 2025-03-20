<script>
    import Resizer from "react-image-file-resizer"; 
    import { createEventDispatcher } from "svelte";
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
        reader.onload = e => {
            myImg = e.target.result
        };

        //wait for resize image and then return the image
        resizeImage(image).then((resizedImage) => {
            dispatch("resizeImage", { resizedImage });
        });
    };

    let resizeImage = (file) => {
        // convert file to 
     return new Promise((resolve, reject) => {
       resize( file, 400, 400, "JPEG", 60, 0, uri => resolve(uri), "blob" );
      });
    };

    // https://levelup.gitconnected.com/resize-your-images-client-side-with-svelte-js-1d33044b945a
</script>

<input type="file" on:change={(e)=>convertFileToImage(e)} bind:this={myFile}/>
