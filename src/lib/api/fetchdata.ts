import { getSession } from "$lib/api/supabaseClient";

async function getAuthHeaders() {
    const session = await getSession();
    if (!session) {
        throw new Error('User session not found');
    }

    return {
        Authorization: `Bearer ${session.access_token}`
    };
}

export async function apiFetch(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = await getAuthHeaders();
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const url = import.meta.env.VITE_API_URL + endpoint;
    const response = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
        throw new Error(`${method} ${endpoint} failed: ${response.statusText}`);
    }

    return response.json();
}