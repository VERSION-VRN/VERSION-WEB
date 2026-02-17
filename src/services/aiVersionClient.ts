
const API_URL = "http://localhost:8000"; // Ajustar si es necesario, o usar variable de entorno

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
            const response = await fetch(`${API_URL}/ai/script/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": `Bearer ${token}` // Si se implementa auth en el futuro
                },
                body: JSON.stringify({ topic, tone, is_mega: isMega }),
            });
            return await response.json();
        } catch (error: any) {
            console.error("Error starting script generation:", error);
            return { success: false, error: error.message };
        }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
        try {
            const response = await fetch(`${API_URL}/status/${taskId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Error fetching task status:", error);
            return null;
        }
    },

    async generateSeo(keyword: string): Promise<SeoResponse> {
        try {
            const response = await fetch(`${API_URL}/ai/seo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ keyword }),
            });
            return await response.json();
        } catch (error: any) {
            console.error("Error generating SEO:", error);
            return { success: false, error: error.message };
        }
    },

    async removeBackground(imageBase64: string) {
        try {
            const response = await fetch(`${API_URL}/remove-background-base64`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageBase64 }),
            });
            return await response.json();
        } catch (error: any) {
            return { success: false, error: error.message || 'Connection Error' };
        }
    },

    async analyzeThumbnail(description: string) {
        try {
            // Using a generic ask endpoint or a specific one. 
            // We will add strict endpoint support next.
            const response = await fetch(`${API_URL}/ai/seo`, { // Placeholder: using SEO endpoint structure for now or generic ask if available
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: `Analyze this thumbnail description: ${description}` }), // Hacky reuse until we add specific endpoint
            });
            return await response.json();
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
