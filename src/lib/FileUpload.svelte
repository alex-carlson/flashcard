<script>
    import Resizer from "react-image-file-resizer"; 
    // We'll call this function later to resize images
    const resize = Resizer.imageFileResizer; 
    // The uncompressed version of the uploaded images, they are bound to the form input element below
    let rawImgs;    

    let resizeImage = (file) => {
     return new Promise((resolve, reject) => {
       resize( file, 500, 500, "JPEG", 100, 0, uri => resolve(uri), "blob" );
      });
    };

    // https://levelup.gitconnected.com/resize-your-images-client-side-with-svelte-js-1d33044b945a
</script>

<input type="file" bind:files={rawImgs} />
<button on:click={onSubmit}>Submit</button>
