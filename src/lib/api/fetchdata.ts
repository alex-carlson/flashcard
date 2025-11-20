import { getSession } from "$lib/api/supabaseClient";

async function getAuthHeaders(requireAuth = true): Promise<Record<string, string>> {
    const session = await getSession();
    if (!session) {
        if (requireAuth) {
            throw new Error('User session not found');
        }
        return {};
    }

    return {
        Authorization: `Bearer ${session.access_token}`
    };
}

export async function apiFetch(endpoint: string, method: string = 'GET', body: any = null, isFormData: boolean = false, requireAuth: boolean = true) {
    const authHeaders = await getAuthHeaders(requireAuth);
    const headers: Record<string, string> = { ...authHeaders };
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
