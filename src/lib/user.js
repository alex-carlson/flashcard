export async function fetchUser(author_id) {
    const url = `${import.meta.env.VITE_API_URL}/users/${author_id}`;
    console.log("Fetching user from:", url);
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch user");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching user:", error);
            return null;  // optionally return null on error
        });
}

export async function fetchUserCollections(author_id) {
    return fetch(`${import.meta.env.VITE_API_URL}/collections/user/${author_id}/all`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }
            return response.json();
        })
        .then((data) => {
            // Sort collections by created_at descending
            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return data;
        })
        .catch((error) => {
            console.error("Error fetching collections:", error);
            return [];  // Return empty array on error
        });
}

