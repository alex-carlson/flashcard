<script>
    export let userId;
    export let isRound = true;
    export let size = 100;
    // export a function to refresh the image
    export let refreshImage = () => {
        const img = document.querySelector('.profile-picture img');
        if (img) {
            img.src = `${baseUrl}/storage/v1/object/public/${bucketName}/${userId}/avatar.jpg?${new Date().getTime()}`;
        }
    };
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const bucketName = 'profilepictures';
    const imageUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${userId}/avatar.jpg`;
</script>

<div class="profile-picture">
    <img
        src={imageUrl}
        alt="Profile Picture"
        class ={isRound ? 'rounded' : ''}
        style="width: {size}px; height: {size}px; object-fit: cover;"
    >
</div>