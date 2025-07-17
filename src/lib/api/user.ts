export async function fetchUser(author_id) {
    const url = `${import.meta.env.VITE_API_URL}/users/${author_id}`;
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

export async function fetchUserBySlug(slug) {
    const url = `${import.meta.env.VITE_API_URL}/users/username/${slug}`;
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch user by username");
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Error fetching user by username:", error);
            return null;  // optionally return null on error
        });
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
    console.log("Fetching users from:", url);
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

export async function completeQuiz(user_id, quiz_id, percentage, token) {
    // post completed-quiz with user_id and quiz_id, sending auth token
    const url = `${import.meta.env.VITE_API_URL}/users/completed-quiz`;
    console.log("Completing quiz for user:", user_id, "Quiz ID:", quiz_id);
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id, quiz_id, percentage }),
    })
        .then((response) => {
            console.log(response);
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
    console.log("Deleting quiz score for user:", user_id, "Quiz ID:", quiz_id);
    return fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id, quiz_id }),
    })
        .then((response) => {
            console.log(response);
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