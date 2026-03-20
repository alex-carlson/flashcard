export async function fetchUser(author_id) {
    const baseUrl = import.meta.env.VITE_API_URL;
    const url = `${baseUrl}/users/${author_id}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

export async function fetchUserBySlug(slug) {
    const baseUrl = import.meta.env.VITE_API_URL;
    const url = `${baseUrl}/users/username/${slug}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch user by username: ${response.status} ${response.statusText} - URL: ${url}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching user by username:", {
            error: error.message,
            slug,
            url,
            baseUrl
        });
        return null;
    }
}

export async function fetchUserCollections(author_id) {
    return fetch(`${import.meta.env.VITE_API_URL}/collections/user/all/${author_id}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch collections");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching collections:", error);
            return [];  // Return empty array on error
        });
}

export async function fetchUsers() {
    const url = `${import.meta.env.VITE_API_URL}/users/all`;
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching users:", error);
            return [];  // Return empty array on error
        });
}

export async function fetchCollaborators(collection_id) {
    const url = `${import.meta.env.VITE_API_URL}/users/collaborators/${collection_id}`

    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch collaborators");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching collaborators:", error);
            return [];
        })
}

export async function completeQuiz(user_id, quiz_id, percentage, token) {
    // post completed-quiz with user_id and quiz_id, sending auth token
    const url = `${import.meta.env.VITE_API_URL}/users/completed-quiz`;
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id, quiz_id, percentage }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to complete quiz");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error completing quiz:", error);
            return null;  // optionally return null on error
        });
}

export async function deleteQuizScore(user_id, quiz_id, token) {
    const url = `${import.meta.env.VITE_API_URL}/users/delete-quiz-score`;
    return fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id, quiz_id }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to delete quiz score");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error deleting quiz score:", error);
            return null;
        });
}