
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

interface ChatResponse {
    success: boolean;
    response?: string;
    error?: string;
}

interface TaskStatus {
    status: string;
    progress: number;
    message: string;
    result?: { script: string };
}

export interface MediaFile {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video';
    size?: number;
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

    async chat(message: string): Promise<ChatResponse> {
        try {
            const response = await fetch(`${getApiUrl()}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ message }),
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            console.error("Chat error:", error);
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
    },

    // --- Media Pool Endpoints ---

    async uploadMedia(file: File): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${getApiUrl()}/media/upload`, {
                method: "POST",
                headers: getAuthHeader(), // Do not set Content-Type to allow browser to boundary FormData
                body: formData,
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            console.error("Error uploading media:", error);
            return { success: false, error: error.message };
        }
    },

    async listMedia(): Promise<{ success: boolean; files?: MediaFile[]; error?: string }> {
        try {
            const response = await fetch(`${getApiUrl()}/media/list`, {
                headers: getAuthHeader()
            });
            handleUnauthorized(response.status);
            if (!response.ok) throw new Error("Failed to list media");
            return await response.json();
        } catch (error: any) {
            console.error("Error listing media:", error);
            return { success: false, error: error.message };
        }
    },

    async deleteMedia(fileId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await fetch(`${getApiUrl()}/media/${fileId}`, {
                method: "DELETE",
                headers: getAuthHeader()
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error: any) {
            console.error("Error deleting media:", error);
            return { success: false, error: error.message };
        }
    }
};
