export async function fetchImageFromGridFS(imageId) {
    if(!imageId) {
        console.error("Error: imageId is missing.");
        throw new Error("imageId is missing.");
    }

    const apiUrl = `${import.meta.env.VITE_API_URL}/image/${imageId}`;

    return apiUrl;

    console.log("Fetching image from:", apiUrl);

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorMessage = `Failed to fetch image (Status: ${response.status} - ${response.statusText})`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.imageUrl) {
            console.error("Error: API response does not contain imageUrl.");
            throw new Error("Invalid API response: imageUrl is missing.");
        }

        console.log("Fetched image:", data.imageUrl);
        return data.imageUrl;
    } catch (error) {
        console.error("Error fetching image:", error.message || error);
        throw error;
    }
}