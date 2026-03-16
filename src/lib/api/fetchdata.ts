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

export async function apiFetch(endpoint, method = 'GET', body = null, isFormData = false, requireAuth = true) {
    const authHeaders = await getAuthHeaders(requireAuth);
    const headers: Record<string, string> = { ...authHeaders };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const url = import.meta.env.VITE_API_URL + endpoint;

    console.log('API Request:', {
        endpoint,
        method,
        baseUrl: import.meta.env.VITE_API_URL,
        fullUrl: url,
        hasAuth: !!authHeaders.Authorization,
        env: import.meta.env.MODE
    });

    const response = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
        console.error('API Request failed:', {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            url
        });
        throw new Error(`${method} ${endpoint} failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response:', { endpoint, success: true, dataKeys: Object.keys(result) });
    return result;
}