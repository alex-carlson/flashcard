import { apiFetch } from "$lib/api/fetchdata";

// Type definitions
export interface CollectionItem {
    id: string;
    image?: string;
    answer?: string;
    question?: string;
    [key: string]: any;
}

export interface Collection {
    id: string;
    author: string;
    author_id: string;
    author_uuid?: string;
    category: string;
    created_at: string;
    items: CollectionItem[];
    private?: boolean;
    thumbnail?: boolean;
    [key: string]: any;
}

// Fetch all collections
export async function fetchCollections(): Promise<Collection[] | undefined> {
    console.log("Fetching collections from API");
    const url = `${import.meta.env.VITE_API_URL}/collections`;
    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch collections");
        return await response.json();
    } catch (error) {
        console.error("Error fetching collections:", error);
        return undefined;
    }
}

export async function fetchUserCollections(uid): Promise<Collection[] | undefined> {
    const url = `/collections/user/${uid}`;

    try {
        const data = await apiFetch(url);
        return data;
    } catch (error) {
        console.error("Error fetching user collections:", error);
        return undefined;
    }
}


// Fetch latest collections
export async function fetchLatestCollections(): Promise<Collection[] | undefined> {
    const url = `${import.meta.env.VITE_API_URL}/collections/latest`;
    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch latest collections");
        return await response.json();
    } catch (error) {
        console.error("Error fetching latest collections:", error);
        return undefined;
    }
}

// Fetch random collections
export async function fetchRandomCollections(limit = 10): Promise<Collection[] | undefined> {
    console.log("Fetching random collections from API");
    const url = `${import.meta.env.VITE_API_URL}/collections/random/${limit}`;
    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch random collections");
        return await response.json();
    } catch (error) {
        console.error("Error fetching random collections:", error);
        return undefined;
    }
}

// Fetch a collection by author and collection id
export async function fetchCollectionById(author_id: string, collection_id: string): Promise<Collection | undefined> {
    console.log(`Fetching collection ${collection_id} by author ${author_id}`);
    const url = `${import.meta.env.VITE_API_URL}/collections/user/${author_id}/${collection_id}`;
    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch collection");
        return await response.json();
    } catch (error) {
        console.error("Error fetching collection:", error);
        return undefined;
    }
}

export async function createCollection(collection: Collection): Promise<Collection | undefined> {
    const url = `${import.meta.env.VITE_API_URL}/collections/createCollection`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(collection)
        });
        if (!response.ok) throw new Error("Failed to create collection");
        return await response.json();
    } catch (error) {
        console.error("Error creating collection:", error);
        return undefined;
    }
}