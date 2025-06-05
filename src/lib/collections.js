export async function fetchCollections() {
    console.log("Fetching collections from API");
    const url = `${import.meta.env.VITE_API_URL}/collections`;
    return fetch(url, {
        method: "GET",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching collections:", error);
        });
}

export function fetchLatestCollections() {
    const url = `${import.meta.env.VITE_API_URL}/collections/latest`;
    return fetch(url, {
        method: "GET",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch latest collections");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching latest collections:", error);
        });
}


export function fetchCollectionById(author_id, collection_id) {
    const url = `${import.meta.env.VITE_API_URL}/collections/user/${author_id}/${collection_id}`;
    return fetch(url, {
        method: "GET",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching collection:", error);
        });
}