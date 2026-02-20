/**
 * api.ts — Utilidades centralizadas de API para VERSION Web
 * Reemplaza los helpers duplicados en cada page.tsx
 */

export const getApiUrl = (path: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return `${base}${path}`;
};

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

export const getHeaders = (json = true): Record<string, string> => {
    const headers: Record<string, string> = {
        'bypass-tunnel-reminder': 'true',
        'X-API-Key': process.env.NEXT_PUBLIC_API_SECRET_KEY || 'wolfmessi10',
    };
    if (json) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const apiFetch = async <T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const res = await fetch(getApiUrl(path), {
        ...options,
        headers: {
            ...getHeaders(options.body ? true : false),
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || err.detail || `HTTP ${res.status}`);
    }
    return res.json();
};
