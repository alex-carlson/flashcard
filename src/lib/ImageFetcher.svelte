<script>

    async function fetchImageFromGridFS(imageId, token) {
        console.log(`Fetching image with ID: ${imageId}`);

        const apiUrl = `${import.meta.env.VITE_API_URL}/image/${imageId}`;
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const response = await fetch(apiUrl, { headers });

            if (!response.ok) {
                const errorMessage = `Failed to fetch image (Status: ${response.status} - ${response.statusText})`;
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Assuming the API returns the image URL in the response body as JSON
            const data = await response.json();

            console.log("Fetched image:", data.imageUrl);

            return data.imageUrl || ""; // Return the image URL or an empty string if not found
        } catch (error) {
            console.error("Error fetching image:", error.message || error);
            return ""; // Return empty string on error
        }
    }

    // Export the function to be used in other components
    export { fetchImageFromGridFS };
</script>