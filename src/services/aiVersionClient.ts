
const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('backend_url') || "http://localhost:8000";
    }
    return "http://localhost:8000";
};

const getAuthHeader = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        return token ? { "Authorization": `Bearer ${token}` } : {};
    }
    return {};
};

const handleUnauthorized = (status: number) => {
    if (status === 401 && typeof window !== 'undefined') {
        console.warn("Unauthorized access detected. Cleaning up local session.");
        localStorage.removeItem('token');
        localStorage.removeItem('user_profile');
        window.location.href = '/login';
    }
};

interface ScriptGenerationResponse {
    success: boolean;
    task_id?: string;
    message?: string;
    error?: string;
}

interface SeoResponse {
    success: boolean;
    result?: string;
    error?: string;
}

interface TaskStatus {
    status: string;
    progress: number;
    message: string;
    result?: { script: string };
}

export const aiVersionClient = {
    async startScriptGeneration(topic: string, tone: string, isMega: boolean): Promise<ScriptGenerationResponse> {
        try {
            const response = await fetch(`${getApiUrl()}/ai/script/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ topic, tone, is_mega: isMega }),
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            console.error("Error starting script generation:", error);
            return { success: false, error: error.message };
        }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
        try {
            const response = await fetch(`${getApiUrl()}/status/${taskId}`, {
                headers: getAuthHeader()
            });
            handleUnauthorized(response.status);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Error fetching task status:", error);
            return null;
        }
    },

    async generateSeo(keyword: string): Promise<SeoResponse> {
        try {
            const response = await fetch(`${getApiUrl()}/ai/seo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ keyword }),
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            console.error("Error generating SEO:", error);
            return { success: false, error: error.message };
        }
    },

    async removeBackground(imageBase64: string) {
        try {
            const response = await fetch(`${getApiUrl()}/remove-background-base64`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ image: imageBase64 }),
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            return { success: false, error: error.message || 'Connection Error' };
        }
    },

    async analyzeThumbnail(description: string) {
        try {
            const response = await fetch(`${getApiUrl()}/ai/seo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ keyword: `Analyze this thumbnail description: ${description}` }),
            });
            return await response.json();
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
