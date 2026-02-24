import { apiFetch, getApiUrl, getHeaders } from '@/lib/api';

const handleUnauthorized = (status: number) => {
    if ((status === 401 || status === 403) && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
            console.warn("Unauthorized access detected. Cleaning up local session.");
            localStorage.removeItem('token');
            localStorage.removeItem('user_profile');
            window.location.href = '/login';
        }
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
    async startScriptGeneration(topic: string, tone: string, isMega: boolean, userId?: string): Promise<ScriptGenerationResponse> {
        try {
            return await apiFetch('/ai/script/start', {
                method: "POST",
                body: JSON.stringify({ topic, tone, is_mega: isMega, user_id: userId }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error starting script generation:", error);
            return { success: false, error: errorMessage };
        }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
        try {
            return await apiFetch(`/status/${taskId}`);
        } catch (error) {
            console.error("Error fetching task status:", error);
            return null;
        }
    },

    async generateSeo(keyword: string, tone: string = "Viral", audience: string = "General", userId?: string): Promise<SeoResponse> {
        try {
            return await apiFetch('/ai/seo', {
                method: "POST",
                body: JSON.stringify({ keyword, tone, audience, user_id: userId }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error generating SEO:", error);
            return { success: false, error: errorMessage };
        }
    },

    async chat(message: string): Promise<ChatResponse> {
        try {
            return await apiFetch('/ai/chat', {
                method: "POST",
                body: JSON.stringify({ message }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Chat error:", error);
            return { success: false, error: errorMessage };
        }
    },

    async generateHooks(topic: string, scriptContext?: string, userId?: string): Promise<{ success: boolean; result?: string; error?: string }> {
        try {
            return await apiFetch('/ai/hooks', {
                method: "POST",
                body: JSON.stringify({ topic, script_context: scriptContext, user_id: userId }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    },

    async removeBackground(imageBase64: string) {
        try {
            return await apiFetch('/remove-background-base64', {
                method: "POST",
                body: JSON.stringify({ image: imageBase64 }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection Error';
            return { success: false, error: errorMessage };
        }
    },

    async analyzeThumbnail(description: string) {
        try {
            return await apiFetch('/ai/seo', {
                method: "POST",
                body: JSON.stringify({ keyword: `Analyze this thumbnail description: ${description}` }),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    },

    // --- Media Pool Endpoints ---

    async uploadMedia(file: File): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(getApiUrl('/media/upload'), {
                method: "POST",
                headers: getHeaders(false),
                body: formData,
            });
            handleUnauthorized(response.status);
            return await response.json();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error uploading media:", error);
            return { success: false, error: errorMessage };
        }
    },

    async listMedia(): Promise<{ success: boolean; files?: MediaFile[]; error?: string }> {
        try {
            return await apiFetch('/media/list');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error listing media:", error);
            return { success: false, error: errorMessage };
        }
    },

    async deleteMedia(fileId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            return await apiFetch(`/media/${fileId}`, {
                method: "DELETE"
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error deleting media:", error);
            return { success: false, error: errorMessage };
        }
    }
};
