/**
 * api.ts — Utilidades centralizadas de API para VERSION Web
 * Reemplaza los helpers duplicados en cada page.tsx
 */

export const getApiUrl = (path: string): string => {
    // Prioridad 1: Override local para facilitar cambios de túnel sin re-desplegar
    if (typeof window !== 'undefined') {
        const localOverride = localStorage.getItem('backend_url');
        if (localOverride) return `${localOverride.trim().replace(/\/$/, '')}${path}`;
    }

    // Prioridad 2: Variable de entorno de compilación (Vercel) o default localhost
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim().replace(/\/$/, '');
    return `${base}${path}`;
};

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

export const getHeaders = (json = true): Record<string, string> => {
    const headers: Record<string, string> = {
        'Bypass-Tunnel-Reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'X-Requested-With': 'XMLHttpRequest',
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
    let url = getApiUrl(path.startsWith('/') ? path : `/${path}`);

    // Detectar si el cuerpo es FormData
    const isFormData = options.body instanceof FormData;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        let res: Response;
        try {
            res = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...getHeaders(!isFormData),
                    ...(options.headers || {}),
                },
            });
        } catch (fetchError: any) {
            // Fallback: Si falla el fetch y estamos en localhost, intentar con el backend local directamente
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !url.includes('127.0.0.1')) {
                const localUrl = `http://127.0.0.1:8000${path.startsWith('/') ? path : `/${path}`}`;
                console.warn(`[API] Fallo en túnel (${url}). Intentando fallback a backend local: ${localUrl}`);
                res = await fetch(localUrl, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        ...getHeaders(!isFormData),
                        ...(options.headers || {}),
                    },
                });
                url = localUrl; // Actualizar para el log si falla después
            } else {
                throw fetchError;
            }
        }

        clearTimeout(timeoutId);

        if (!res.ok) {
            let errorDetail: any = `Error ${res.status}`;
            try {
                const errJson = await res.json();
                errorDetail = errJson.detail || errJson.error || errJson.message || errJson;
                if (Array.isArray(errorDetail)) {
                    errorDetail = errorDetail.map((d: any) => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
                } else if (typeof errorDetail === 'object') {
                    errorDetail = JSON.stringify(errorDetail);
                }
            } catch {
                errorDetail = await res.text() || `Error HTTP ${res.status}`;
            }
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    if (currentPath !== '/login' && currentPath !== '/register') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user_profile');
                        window.location.href = '/login';
                    }
                }
            }
            throw new Error(errorDetail);
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await res.json();
        }
        return {} as T;
    } catch (error) {
        let errorMessage: string;
        if (error instanceof DOMException && error.name === 'AbortError') {
            errorMessage = "Tiempo de espera agotado (60s). Verifica si el servidor está procesando una tarea pesada.";
        } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
            errorMessage = "No se pudo conectar con el servidor (Failed to fetch). Probablemente el túnel ha expirado o el backend está apagado. Revisa la consola o configura la URL manualmente.";
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = "Error de conexión desconocido.";
        }
        console.error(`❌ API Error [${url}]:`, error);
        throw new Error(errorMessage);
    }
};
