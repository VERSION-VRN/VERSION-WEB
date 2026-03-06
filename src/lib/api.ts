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
        'X-Requested-With': 'XMLHttpRequest', // A veces ayuda con CORS en túneles
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

    // Detectar si el cuerpo es FormData para dejar que el navegador ponga el boundary
    const isFormData = options.body instanceof FormData;

    try {
        // Timeout de 10 segundos para evitar peticiones colgadas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                ...getHeaders(!isFormData), // Solo poner application/json si NO es FormData
                ...(options.headers || {}),
            },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            let errorDetail: any = `Error ${res.status}`;
            try {
                const errJson = await res.json();
                // Manejar errores de validación de FastAPI o formatos {detail: ...} / {error: ...}
                errorDetail = errJson.detail || errJson.error || errJson.message || errJson;

                // Si el detalle es un array (FastAPI validation), extraer mensajes
                if (Array.isArray(errorDetail)) {
                    errorDetail = errorDetail.map(d => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
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
                        console.warn(`[API] Sesión inválida o insuficiente (${res.status}). Limpiando y redirigiendo.`);
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
            errorMessage = "Timeout: El servidor no respondió en 10 segundos. Verifica el túnel o la conexión.";
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = "No se pudo conectar con el servidor.";
        }
        console.error(`❌ API Error [${url}]:`, error);
        throw new Error(errorMessage);
    }
};
