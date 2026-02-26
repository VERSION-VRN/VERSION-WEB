'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ToastType } from '@/components/Toast';
import { apiFetch, getApiUrl } from '@/lib/api';
import { useTask, TaskResult } from '@/hooks/useTask';

export interface Voice {
    name: string;
    id: string;
}

export interface Prompt {
    name: string;
    prompt: string;
}

export interface Metadata {
    idiomas: string[];
    voices: Record<string, Voice[]>;
    prompts: Record<string, Prompt[]>;
    subtitle_styles: string[];
    subtitle_colors: string[];
    subtitle_positions: string[];
    success: boolean;
}

interface EditorState {
    currentStep: number;
    metadata: Metadata | null;
    formData: {
        url: string;
        titulo: string;
        miniatura: string;
        backgroundVideo: File | null;
        backgroundVideoPath: string;
        music: File | null;
        musicPath: string;
        musicVolume: number;
    };
    selectedIdioma: string;
    selectedVoice: string;
    selectedPrompt: string;
    selectedSubtitleStyle: string;
    selectedSubtitleColor: string;
    selectedSubtitlePosition: string;
    targetLength: 'short' | 'medium' | 'long';
    isProcessing: boolean;
    progress: number;
    statusMessage: string;
    uploadingBg: boolean;
    uploadProgress: number;
    currentTaskId: string | null;
    isAwaitingScript: boolean;
    editedScript: string;
    resultData: { video_path: string, script_path?: string } | null;
    isLoadingConfig: boolean;
    configError: string;
}

interface EditorContextType extends EditorState {
    setCurrentStep: (step: number | ((prev: number) => number)) => void;
    setMetadata: (metadata: Metadata | null) => void;
    setFormData: (data: Partial<EditorState['formData']>) => void;
    setSelectedIdioma: (idioma: string) => void;
    setSelectedVoice: (voice: string) => void;
    setSelectedPrompt: (prompt: string) => void;
    setSelectedSubtitleStyle: (style: string) => void;
    setSelectedSubtitleColor: (color: string) => void;
    setSelectedSubtitlePosition: (position: string) => void;
    setTargetLength: (length: EditorState['targetLength']) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setProgress: (progress: number) => void;
    setStatusMessage: (message: string) => void;
    setUploadingBg: (uploading: boolean) => void;
    setUploadProgress: (progress: number) => void;
    setCurrentTaskId: (id: string | null) => void;
    setIsAwaitingScript: (isAwaiting: boolean) => void;
    setEditedScript: (script: string) => void;
    setResultData: (data: EditorState['resultData']) => void;

    // Logic Methods
    handleUploadBackground: (file: File) => Promise<void>;
    handleUploadMusic: (file: File) => Promise<void>;
    handleSubmit: (userEmail: string, isAdmin: boolean, credits: number) => Promise<void>;
    handleCancel: () => Promise<void>;
    handleConfirmScript: () => Promise<void>;
    handleNewVideo: () => void;
    saveDraft: (overrideParams?: any, userEmail?: string) => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children, initialTaskId, showToast }: {
    children: ReactNode,
    initialTaskId: string | null,
    showToast: (message: string, type?: ToastType) => void
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [formData, setFormDataInternal] = useState<EditorState['formData']>({
        url: '',
        titulo: '',
        miniatura: '',
        backgroundVideo: null,
        backgroundVideoPath: '',
        music: null,
        musicPath: '',
        musicVolume: 0.15
    });
    const [selectedIdioma, setSelectedIdioma] = useState('Español');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [selectedSubtitleStyle, setSelectedSubtitleStyle] = useState('Clásico');
    const [selectedSubtitleColor, setSelectedSubtitleColor] = useState('Blanco');
    const [selectedSubtitlePosition, setSelectedSubtitlePosition] = useState('Abajo');
    const [targetLength, setTargetLength] = useState<EditorState['targetLength']>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [uploadingBg, setUploadingBg] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(initialTaskId);
    const [isAwaitingScript, setIsAwaitingScript] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [resultData, setResultData] = useState<EditorState['resultData']>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [configError, setConfigError] = useState('');

    const setFormData = (data: Partial<EditorState['formData']>) => {
        setFormDataInternal(prev => ({ ...prev, ...data }));
    };

    // Carga inicial de metadatos (voces, idiomas, estilos)
    useEffect(() => {
        const loadMetadata = async () => {
            setIsLoadingConfig(true);
            try {
                const data = await apiFetch<Metadata>('/metadata');
                if (data.success) {
                    setMetadata(data);
                    // Selección inicial inteligente
                    const defaultLang = "Español";
                    const initialLang = data.idiomas.includes(defaultLang) ? defaultLang : data.idiomas[0];
                    setSelectedIdioma(initialLang);
                    if (data.voices?.[initialLang]) setSelectedVoice(data.voices[initialLang][0].id);
                    if (data.prompts?.[initialLang]) setSelectedPrompt(data.prompts[initialLang][0].name);
                } else {
                    setConfigError('Error al obtener la configuración del servidor.');
                }
            } catch (err) {
                console.error("[EditorContext] Metadata fetch error:", err);
                setConfigError('Fallo de conexión con el backend para cargar configuración.');
            } finally {
                setIsLoadingConfig(false);
            }
        };

        if (!metadata) {
            loadMetadata();
        }
    }, [metadata]);

    // Efecto de sincronización con componentes externos (EliteAssistant)
    useEffect(() => {
        const event = new CustomEvent('VERSION_EDITOR_UPDATE', {
            detail: {
                titulo: formData.titulo,
                step: currentStep,
                status: statusMessage,
                isProcessing
            }
        });
        window.dispatchEvent(event);
    }, [formData.titulo, currentStep, statusMessage, isProcessing]);

    const saveDraft = async (overrideParams?: any, userEmail?: string) => {
        const id = overrideParams?.request_id || initialTaskId || currentTaskId;
        if (!id || !userEmail) return;

        try {
            await apiFetch('/save-draft', {
                method: 'POST',
                body: JSON.stringify({
                    request_id: id,
                    user_id: userEmail,
                    params: overrideParams || {
                        url: formData.url,
                        titulo: formData.titulo,
                        miniatura: formData.miniatura,
                        idioma: selectedIdioma,
                        voz: selectedVoice,
                        prompt_name: selectedPrompt,
                        background_video_path: formData.backgroundVideoPath,
                        bg_music: formData.musicPath,
                        bg_music_vol: formData.musicVolume,
                        subtitle_style: selectedSubtitleStyle,
                        subtitle_color: selectedSubtitleColor,
                        subtitle_position: selectedSubtitlePosition,
                        target_length: targetLength,
                    }
                })
            });
        } catch (e) {
            console.warn('[EditorContext] Error guardando borrador:', e);
        }
    };

    const handleUploadBackground = async (file: File) => {
        setUploadingBg(true);
        setUploadProgress(0);
        setStatusMessage('Iniciando carga...');

        const CHUNK_SIZE = 2 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const chunkFormData = new FormData();
                chunkFormData.append('file_id', fileId);
                chunkFormData.append('chunk_index', i.toString());
                chunkFormData.append('total_chunks', totalChunks.toString());
                chunkFormData.append('file', chunk);

                let retries = 3;
                let success = false;
                while (retries > 0 && !success) {
                    try {
                        await apiFetch('/upload-chunk', {
                            method: 'POST',
                            body: chunkFormData
                        });
                        success = true;
                    } catch (e) {
                        retries--;
                        if (retries === 0) throw e;
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
                const percent = Math.round(((i + 1) / totalChunks) * 100);
                setUploadProgress(percent);
                setStatusMessage(`Subiendo: ${percent}%`);
            }

            setStatusMessage('Ensamblando...');
            const formDataAssemble = new FormData();
            formDataAssemble.append('file_id', fileId);
            formDataAssemble.append('filename', file.name);

            const data = await apiFetch<any>('/assemble-file', {
                method: 'POST',
                body: formDataAssemble
            });
            if (data.success) {
                setFormData({ backgroundVideo: file, backgroundVideoPath: data.path });
                setStatusMessage('');
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (err) {
            showToast('Error al subir el video: ' + (err instanceof Error ? err.message : 'Error desconocido'), 'error');
            setStatusMessage('');
        } finally {
            setUploadingBg(false);
            setUploadProgress(0);
        }
    };

    const handleUploadMusic = async (file: File) => {
        try {
            setUploadingBg(true);
            setStatusMessage('Subiendo música...');
            const fileId = Math.random().toString(36).substring(7);
            const chunkSize = 1024 * 1024;
            const totalChunks = Math.ceil(file.size / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
                const formDataChunk = new FormData();
                formDataChunk.append('file', chunk);
                formDataChunk.append('file_id', fileId);
                formDataChunk.append('chunk_index', i.toString());
                formDataChunk.append('total_chunks', totalChunks.toString());

                await apiFetch('/upload-chunk', {
                    method: 'POST',
                    body: formDataChunk
                });
                setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            const formDataAssemble = new FormData();
            formDataAssemble.append('file_id', fileId);
            formDataAssemble.append('filename', file.name);

            const data = await apiFetch<any>('/assemble-file', {
                method: 'POST',
                body: formDataAssemble
            });
            if (data.success) {
                setFormData({ music: file, musicPath: data.path });
                showToast('Música subida correctamente', 'success');
            }
        } catch (err) {
            showToast('Error al subir música: ' + (err instanceof Error ? err.message : 'Error desconocido'), 'error');
        } finally {
            setUploadingBg(false);
            setUploadProgress(0);
            setStatusMessage('');
        }
    };


    const {
        status: taskStatus,
        progress: taskProgress,
        message: taskMessage,
        result: taskResult,
        script_content: taskScriptContent,
        isActive: isTaskActive,
        startPolling,
        stopPolling,
        reset: resetTask
    } = useTask(currentTaskId, {
        onCompleted: (result) => {
            setIsProcessing(false);
            const vp = result.video_rel_path || result.video_path?.split(/[\\/]/).pop();
            const sp = result.script_rel_path || (vp ? vp.replace('.mp4', '_GUION.txt') : '');
            setResultData({
                video_path: getApiUrl(`/downloads/${encodeURI(vp || '')}`),
                script_path: getApiUrl(`/downloads/${encodeURI(sp)}`)
            });
            // Re-fetch credits could be triggered here or in parent
        },
        onError: (err) => {
            setIsProcessing(false);
            showToast(err, 'error');
        },
        onAwaitingReview: (content) => {
            setIsProcessing(false);
            setEditedScript(content);
            setIsAwaitingScript(true);
        }
    });

    // Sincronizar estados locales con los del hook para retrocompatibilidad con los subcomponentes
    useEffect(() => {
        setProgress(taskProgress);
        setStatusMessage(taskMessage);
    }, [taskProgress, taskMessage]);

    const handleSubmit = async (userEmail: string, isAdmin: boolean, credits: number) => {
        const currentCost = 0; // Herramienta gratuita para usuarios registrados
        if (!isAdmin && credits < currentCost) return showToast(`Créditos insuficientes (${currentCost} tokens requeridos).`, 'error');
        if (!formData.backgroundVideoPath || !formData.url || !formData.titulo || !selectedVoice || !selectedPrompt)
            return showToast('Completa todos los campos obligatorios.', 'warning');

        setIsProcessing(true);
        setProgress(0);
        setStatusMessage('Iniciando...');
        setResultData(null);

        try {
            const requestId = currentTaskId || crypto.randomUUID();
            const data = await apiFetch<any>('/process', {
                method: 'POST',
                body: JSON.stringify({
                    url: formData.url, idioma: selectedIdioma, voz: selectedVoice,
                    prompt_name: selectedPrompt, titulo: formData.titulo,
                    miniatura: formData.miniatura || formData.titulo, add_subtitles: true,
                    background_video: formData.backgroundVideoPath, request_id: requestId,
                    user_id: userEmail, subtitle_style: selectedSubtitleStyle,
                    subtitle_color: selectedSubtitleColor, subtitle_position: selectedSubtitlePosition,
                    pause_at_script: true,
                    target_length: targetLength,
                    bg_music: formData.musicPath || null,
                    bg_music_vol: formData.musicVolume
                })
            });
            if (!data.success) {
                setIsProcessing(false);
                return showToast('Error: ' + (data.detail || data.message), 'error');
            }
            setCurrentTaskId(data.task_id);
            // El hook useTask detectará el cambio de currentTaskId y empezará el polling automáticamente
        } catch {
            setIsProcessing(false);
            showToast('Error de conexión con el servidor.', 'error');
        }
    };

    const handleConfirmScript = async () => {
        if (!currentTaskId) return;
        setIsProcessing(true);
        setIsAwaitingScript(false);
        setStatusMessage('Finalizando video...');
        try {
            const data = await apiFetch<any>(`/confirm-script/${currentTaskId}`, {
                method: 'POST',
                body: JSON.stringify({ script_content: editedScript })
            });
            if (data.success) {
                startPolling(); // Reiniciar polling tras confirmación
            } else {
                setIsProcessing(false);
                showToast('Error al confirmar: ' + data.error, 'error');
            }
        } catch {
            setIsProcessing(false);
            showToast('Error de conexión.', 'error');
        }
    };

    const handleCancel = async () => {
        if (!currentTaskId) return;
        try {
            setStatusMessage('Cancelando...');
            await apiFetch(`/cancel/${currentTaskId}`, { method: 'POST' });
        } catch {
            showToast("No se pudo cancelar.", "error");
        }
    };

    const handleNewVideo = () => {
        setResultData(null);
        setCurrentStep(1);
        setCurrentTaskId(null);
        setFormData({
            url: '', titulo: '', miniatura: '',
            backgroundVideo: null, backgroundVideoPath: '',
            music: null, musicPath: '', musicVolume: 0.15
        });
        setEditedScript('');
        setIsAwaitingScript(false);
        setProgress(0);
        setStatusMessage('');
    };

    const value: EditorContextType = {
        currentStep, setCurrentStep,
        metadata, setMetadata,
        formData, setFormData,
        selectedIdioma, setSelectedIdioma,
        selectedVoice, setSelectedVoice,
        selectedPrompt, setSelectedPrompt,
        selectedSubtitleStyle, setSelectedSubtitleStyle,
        selectedSubtitleColor, setSelectedSubtitleColor,
        selectedSubtitlePosition, setSelectedSubtitlePosition,
        targetLength, setTargetLength,
        isProcessing, setIsProcessing,
        progress, setProgress,
        statusMessage, setStatusMessage,
        uploadingBg, setUploadingBg,
        uploadProgress, setUploadProgress,
        currentTaskId, setCurrentTaskId,
        isAwaitingScript, setIsAwaitingScript,
        editedScript, setEditedScript,
        resultData, setResultData,
        isLoadingConfig, configError,

        handleUploadBackground,
        handleUploadMusic,
        handleSubmit,
        handleCancel,
        handleConfirmScript,
        handleNewVideo,
        saveDraft
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) throw new Error('useEditor must be used within an EditorProvider');
    return context;
}
