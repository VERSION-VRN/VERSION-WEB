/**
 * api.ts — Utilidades centralizadas de API para VERSION Web
 * Reemplaza los helpers duplicados en cada page.tsx
 */

export const getApiUrl = (path: string): string => {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();
    return `${base}${path}`;
};

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

export const getHeaders = (json = true): Record<string, string> => {
    const headers: Record<string, string> = {
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'X-API-Key': process.env.NEXT_PUBLIC_API_SECRET_KEY || 'wolfmessi10',
    };
    if (json) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const apiFetch = async <T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = getApiUrl(path.startsWith('/') ? path : `/${path}`);
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                ...getHeaders(options.body ? true : false),
                ...(options.headers || {}),
            },
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `Error HTTP ${res.status}` }));
            throw new Error(err.error || err.detail || err.message || `Error ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await res.json();
        }
        return {} as T;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "No se pudo conectar con el servidor.";
        console.error(`❌ API Error [${url}]:`, error);
        throw new Error(errorMessage);
    }
};
