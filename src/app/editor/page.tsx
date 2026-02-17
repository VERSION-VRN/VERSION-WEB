'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';
import Toast, { ToastType } from '@/components/Toast';
import { useCredits } from '@/context/CreditsContext';

interface Voice {
    name: string;
    id: string;
}

interface Prompt {
    name: string;
    prompt: string;
}

interface Metadata {
    idiomas: string[];
    voices: Record<string, Voice[]>;
    prompts: Record<string, Prompt[]>;
    subtitle_styles: string[];
    subtitle_colors: string[];
    subtitle_positions: string[];
}

const DEFAULT_SUBTITLE_STYLES = ["Clásico", "Dinámico (Efusivo)", "Moderno", "Impacto", "Limpio (Caja)"];
const DEFAULT_SUBTITLE_COLORS = ["Blanco", "Amarillo", "Rojo", "Azul", "Verde", "Cian", "Magenta", "Naranja", "Gris"];
const DEFAULT_SUBTITLE_POSITIONS = ["Abajo", "Centro", "Arriba"];

// ─── Helpers ───
const isValidYoutubeUrl = (url: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/.test(url);
};

const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
};

const STEP_LABELS = ['Recursos', 'Datos', 'Estilo'];

export default function VideoEditor() {
    const { credits, deductLocal, refreshCredits } = useCredits();
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const [selectedIdioma, setSelectedIdioma] = useState('Español');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [formData, setFormData] = useState({
        url: '',
        titulo: '',
        miniatura: '',
        backgroundVideo: null as File | null,
        backgroundVideoPath: '',
        music: null as File | null,
        musicPath: '',
        musicVolume: 0.15
    });
    const [selectedSubtitleStyle, setSelectedSubtitleStyle] = useState('Clásico');
    const [selectedSubtitleColor, setSelectedSubtitleColor] = useState('Blanco');
    const [selectedSubtitlePosition, setSelectedSubtitlePosition] = useState('Abajo');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [uploadingBg, setUploadingBg] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [configError, setConfigError] = useState('');
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [resultData, setResultData] = useState<{ video_path: string, script_path?: string } | null>(null);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [isAwaitingScript, setIsAwaitingScript] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [isConfirmingScript, setIsConfirmingScript] = useState(false);
    const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium');

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const getApiUrl = (path: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}${path}`;
    };

    const getSecurityHeaders = (isJson = true) => {
        const token = localStorage.getItem('version_user_token');
        const headers: Record<string, string> = {
            'X-API-Key': process.env.NEXT_PUBLIC_API_SECRET_KEY || 'wolfmessi10',
            'bypass-tunnel-reminder': 'true',
            'Bypass-Tunnel-Reminder': 'true',
        };
        if (isJson) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    };

    useEffect(() => {
        const role = localStorage.getItem('version_user_role');
        const userCredits = localStorage.getItem('version_user_credits');

        if (!role) {
            router.push('/login');
            return;
        }

        setIsAdmin(role === 'admin');
        setIsLoadingAuth(false);

        const loadConfig = async () => {
            setIsLoadingConfig(true);
            setConfigError('');
            try {
                const metaRes = await fetch(getApiUrl('/metadata'), {
                    headers: getSecurityHeaders(false)
                });
                if (!metaRes.ok) throw new Error('Error al conectar con el servidor backend');

                const metaData = await metaRes.json();
                if (metaData.success) {
                    setMetadata(metaData);
                    const defaultLang = "Español";
                    const initialLang = metaData.idiomas.includes(defaultLang) ? defaultLang : metaData.idiomas[0];
                    setSelectedIdioma(initialLang);
                    if (metaData.voices[initialLang]) setSelectedVoice(metaData.voices[initialLang][0].id);
                    if (metaData.prompts[initialLang]) setSelectedPrompt(metaData.prompts[initialLang][0].name);
                    if (metaData.subtitle_styles) setSelectedSubtitleStyle(metaData.subtitle_styles[0]);
                    if (metaData.subtitle_colors) setSelectedSubtitleColor(metaData.subtitle_colors[0]);
                    if (metaData.subtitle_positions) setSelectedSubtitlePosition(metaData.subtitle_positions[0]);
                }
            } catch (err: any) {
                console.error('Error de Carga:', err);
                setConfigError('No se pudo conectar con el servidor. ' + err.message);
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, [router]);

    const handleIdiomaChange = (lang: string) => {
        setSelectedIdioma(lang);
        if (metadata) {
            if (metadata.voices[lang]) setSelectedVoice(metadata.voices[lang][0].id);
            if (metadata.prompts[lang]) setSelectedPrompt(metadata.prompts[lang][0].name);
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
                        const res = await fetch(getApiUrl('/upload-chunk'), {
                            method: 'POST',
                            headers: getSecurityHeaders(false),
                            body: chunkFormData
                        });
                        if (res.ok) {
                            success = true;
                        } else {
                            const errorText = await res.text();
                            let errorDetail = 'Server error';
                            try {
                                const errorJson = JSON.parse(errorText);
                                errorDetail = errorJson.detail || errorJson.error || errorText;
                            } catch { errorDetail = errorText || `Error ${res.status}`; }
                            throw new Error(`[Chunk ${i}] ${res.status}: ${errorDetail}`);
                        }
                    } catch (e: any) {
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

            const resAssemble = await fetch(getApiUrl('/assemble-file'), {
                method: 'POST',
                headers: getSecurityHeaders(false),
                body: formDataAssemble
            });
            if (!resAssemble.ok) throw new Error('Error al ensamblar archivo');

            const data = await resAssemble.json();
            if (data.success) {
                setFormData({ ...formData, backgroundVideo: file, backgroundVideoPath: data.path });
                setStatusMessage('');
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (err: any) {
            showToast('Error al subir el video: ' + err.message, 'error');
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
            const chunkSize = 1024 * 1024; // 1MB
            const totalChunks = Math.ceil(file.size / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
                const formDataChunk = new FormData();
                formDataChunk.append('file', chunk);
                formDataChunk.append('file_id', fileId);
                formDataChunk.append('chunk_index', i.toString());
                formDataChunk.append('total_chunks', totalChunks.toString());

                const res = await fetch(getApiUrl('/upload-chunk'), {
                    method: 'POST',
                    headers: getSecurityHeaders(false),
                    body: formDataChunk
                });
                if (!res.ok) throw new Error(`Error en chunk ${i}`);
                setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            const formDataAssemble = new FormData();
            formDataAssemble.append('file_id', fileId);
            formDataAssemble.append('filename', file.name);

            const resAssemble = await fetch(getApiUrl('/assemble-file'), {
                method: 'POST',
                headers: getSecurityHeaders(false),
                body: formDataAssemble
            });
            if (!resAssemble.ok) throw new Error('Error al ensamblar archivo');

            const data = await resAssemble.json();
            if (data.success) {
                setFormData({ ...formData, music: file, musicPath: data.filename });
                showToast('Música subida correctamente', 'success');
            }
        } catch (err: any) {
            showToast('Error al subir música: ' + err.message, 'error');
        } finally {
            setUploadingBg(false);
            setUploadProgress(0);
            setStatusMessage('');
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !formData.backgroundVideoPath) return showToast("Sube un video de fondo.", "warning");
        if (currentStep === 2) {
            if (!formData.url || !isValidYoutubeUrl(formData.url)) {
                return showToast("Ingresa una URL de YouTube válida.", "error");
            }
            if (!formData.titulo) return showToast("Ingresa un título para el proyecto.", "warning");
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    };

    const handlePrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleCancel = async () => {
        if (!currentTaskId) return;
        if (!confirm('¿Cancelar el proceso?')) return;
        try {
            setStatusMessage('Cancelando...');
            await fetch(getApiUrl(`/cancel/${currentTaskId}`), { method: 'POST', headers: getSecurityHeaders(false) });
        } catch { alert("No se pudo cancelar."); }
    };

    const handleConfirmScript = async () => {
        if (!currentTaskId) return;
        setIsConfirmingScript(true);
        setStatusMessage('Confirmando guion...');
        try {
            const res = await fetch(getApiUrl(`/confirm-script/${currentTaskId}`), {
                method: 'POST',
                headers: getSecurityHeaders(),
                body: JSON.stringify({ script: editedScript })
            });
            const data = await res.json();
            if (data.success) {
                setIsAwaitingScript(false);
                setIsProcessing(true);
                const currentCost = targetLength === 'short' ? 5 : targetLength === 'long' ? 20 : 10;
                startStatusPolling(currentTaskId, currentCost);
            } else {
                alert('Error: ' + data.detail);
            }
        } catch { alert('Error de conexión.'); }
        finally { setIsConfirmingScript(false); }
    };

    const startStatusPolling = (taskId: string, cost: number) => {
        const interval = setInterval(async () => {
            try {
                const statusRes = await fetch(getApiUrl(`/status/${taskId}`), { headers: getSecurityHeaders(false) });
                const status = await statusRes.json();
                setProgress(status.progress);
                setStatusMessage(status.message);

                if (['completed', 'failed', 'cancelled', 'awaiting_review'].includes(status.status)) {
                    clearInterval(interval);
                    setIsProcessing(false);
                    if (status.status === 'completed') {
                        if (!isAdmin) {
                            deductLocal(cost);
                        }
                        refreshCredits();
                        const vp = status.result.video_rel_path || status.result.video_path.split(/[\\/]/).pop();
                        const sp = status.result.script_rel_path || vp.replace('.mp4', '_GUION.txt');
                        setResultData({ video_path: getApiUrl(`/downloads/${encodeURI(vp)}`), script_path: getApiUrl(`/downloads/${encodeURI(sp)}`) });
                        setCurrentTaskId(null);
                    } else if (status.status === 'failed') {
                        alert('❌ ' + status.message);
                        setCurrentTaskId(null);
                    } else if (status.status === 'cancelled') {
                        setCurrentTaskId(null);
                    } else if (status.status === 'awaiting_review') {
                        setEditedScript(status.script_content || '');
                        setIsAwaitingScript(true);
                    }
                }
            } catch { clearInterval(interval); setIsProcessing(false); }
        }, 2500);
    };

    const handleSubmit = async () => {
        const currentCost = targetLength === 'short' ? 5 : targetLength === 'long' ? 20 : 10;

        if (!isAdmin && credits < currentCost) return showToast(`Créditos insuficientes (${currentCost} tokens requeridos).`, 'error');
        if (!formData.backgroundVideoPath || !formData.url || !formData.titulo || !selectedVoice || !selectedPrompt)
            return showToast('Completa todos los campos obligatorios.', 'warning');

        setIsProcessing(true);
        setProgress(0);
        setStatusMessage('Iniciando...');
        setResultData(null);

        try {
            const requestId = crypto.randomUUID();
            const userEmail = JSON.parse(localStorage.getItem(`user_${localStorage.getItem('version_user_email')}`) || '{}').email || 'unknown';
            const response = await fetch(getApiUrl('/process'), {
                method: 'POST',
                headers: getSecurityHeaders(),
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
            const data = await response.json();
            if (!data.success) { setIsProcessing(false); return showToast('Error: ' + (data.detail || data.message), 'error'); }
            setCurrentTaskId(data.task_id);
            startStatusPolling(data.task_id, currentCost);
        } catch { setIsProcessing(false); showToast('Error de conexión con el servidor.', 'error'); }
    };

    const handleNewVideo = () => {
        setResultData(null); setCurrentStep(1); setCurrentTaskId(null);
        setFormData({
            url: '', titulo: '', miniatura: '',
            backgroundVideo: null, backgroundVideoPath: '',
            music: null, musicPath: '', musicVolume: 0.15
        });
        setEditedScript(''); setIsAwaitingScript(false); setProgress(0); setStatusMessage('');
    };

    const wordCount = editedScript.trim().split(/\s+/).filter(Boolean).length;

    if (isLoadingAuth) return <div className="min-h-screen bg-black" />;

    // ─── Pill button for option selectors ───
    const OptionPill = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-xl text-left ${selected
                ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(220,38,38,0.1)]'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
                }`}
        >
            {children}
        </button>
    );

    const OptionPillAlt = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-xl text-left ${selected
                ? 'bg-white text-black border border-white shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
                : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="text-sm font-black tracking-tight uppercase hover:text-primary transition-colors">
                        VERSION<span className="text-primary">.ED</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-medium text-zinc-500">Saldo</span>
                            <span className="text-xs font-black text-primary">{isAdmin ? '∞' : credits}</span>
                        </div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
                    </div>
                </div>
            </nav>

            {/* ─── Main ─── */}
            <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">

                {/* ─── Header ─── */}
                <div className="text-center mb-10 animate-fade">
                    <h1 className="text-3xl font-black tracking-tight mb-2">
                        Crear <span className="text-gradient">Video</span>
                    </h1>
                    <p className="text-zinc-600 text-xs font-medium">Genera contenido con IA en minutos</p>
                </div>

                {/* ─── Steps ─── */}
                <div className="flex items-center justify-center gap-1.5 mb-10">
                    {STEP_LABELS.map((label, i) => {
                        const step = i + 1;
                        const isActive = currentStep === step;
                        const isDone = currentStep > step;
                        return (
                            <button
                                key={step}
                                onClick={() => isDone && setCurrentStep(step)}
                                className={`
                                    px-5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 rounded-full
                                    ${isActive ? 'bg-primary text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] scale-105' : ''}
                                    ${isDone ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] cursor-pointer' : ''}
                                    ${!isActive && !isDone ? 'text-zinc-700 cursor-default' : ''}
                                `}
                            >
                                {isDone ? '✓' : `${step}.`} {label}
                            </button>
                        );
                    })}
                </div>

                {/* ─── Result ─── */}
                {resultData ? (
                    <div className="animate-fade-scale text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/15 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                            ✨
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">¡Video Listo!</h2>
                        <p className="text-zinc-500 text-xs font-medium mb-10">Tu contenido ha sido generado exitosamente</p>

                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <a href={resultData.video_path} className="btn-primary !py-4 text-center block" target="_blank" download>
                                Descargar Video
                            </a>
                            <button onClick={() => router.push(`/editor/timeline?video=${encodeURIComponent(resultData.video_path)}&length=${targetLength}&style=${encodeURIComponent(selectedPrompt)}`)}
                                className="btn-outline !py-3 text-center block !border-primary/20 hover:!border-primary/40 w-full">
                                ✂️ Editar en Timeline
                            </button>
                            <a href={resultData.script_path} className="btn-outline !py-3 text-center block !border-white/10" target="_blank" download>
                                Ver Guion
                            </a>
                            <button onClick={handleNewVideo} className="text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-widest mt-6 transition-colors">
                                + Crear Nuevo Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ─── Step 1: Recursos ─── */}
                        {currentStep === 1 && (
                            <div className="animate-fade">
                                <div className="mb-6">
                                    <h2 className="text-lg font-black tracking-tight mb-1">Video de Fondo</h2>
                                    <p className="text-zinc-600 text-xs">Sube el recurso visual base.</p>
                                </div>

                                {!formData.backgroundVideoPath ? (
                                    <div className="relative group">
                                        <input
                                            type="file" accept="video/*"
                                            onChange={(e) => e.target.files?.[0] && handleUploadBackground(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            disabled={uploadingBg}
                                        />
                                        <div className="border-2 border-dashed border-white/[0.06] group-hover:border-primary/30 transition-all rounded-3xl py-20 flex flex-col items-center justify-center gap-4 bg-white/[0.01] group-hover:bg-primary/[0.02]">
                                            {uploadingBg ? (
                                                <>
                                                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs font-bold text-zinc-400">{statusMessage}</span>
                                                    <div className="w-52 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(220,38,38,0.4)]"
                                                            style={{ width: `${uploadProgress}%` }} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl text-zinc-600 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                                        ↑
                                                    </div>
                                                    <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                        Arrastra o selecciona un archivo
                                                    </span>
                                                    <span className="text-[10px] text-zinc-700 bg-white/[0.03] px-3 py-1 rounded-full">MP4, MOV, AVI • Hasta 500MB</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-white/[0.06] bg-white/[0.02] rounded-2xl p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 border border-primary/15 rounded-xl flex items-center justify-center text-primary text-xl">▶</div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[240px]">{formData.backgroundVideo?.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                    <span className="text-[9px] text-green-500/70 font-bold uppercase tracking-wider">Listo</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, backgroundVideoPath: '', backgroundVideo: null })}
                                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-500 transition-all text-sm"
                                        >✕</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── Step 2: Datos ─── */}
                        {currentStep === 2 && (
                            <div className="animate-fade space-y-5">
                                <div className="mb-2">
                                    <h2 className="text-lg font-black tracking-tight mb-1">Datos del Video</h2>
                                    <p className="text-zinc-600 text-xs">Define la fuente y título.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">URL de YouTube</label>
                                    <div className="relative group">
                                        <input type="url" value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className={`input-field pr-12 ${formData.url && !isValidYoutubeUrl(formData.url) ? 'border-red-500/50' : ''}`} />
                                        {formData.url && isValidYoutubeUrl(formData.url) && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-fade">✓</div>
                                        )}
                                    </div>
                                    {formData.url && !isValidYoutubeUrl(formData.url) && (
                                        <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-wider ml-1 animate-fade">URL No Válida</p>
                                    )}
                                </div>

                                {formData.url && isValidYoutubeUrl(formData.url) && (
                                    <div className="animate-fade-scale flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                        <img
                                            src={getYoutubeThumbnail(formData.url) || ''}
                                            alt="Preview"
                                            className="w-24 aspect-video object-cover rounded-lg shadow-lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Detectado</p>
                                            <p className="text-[11px] text-zinc-400 truncate font-medium">{formData.url}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Título del Proyecto</label>
                                    <input type="text" value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Ej: Curiosidades sobre el Espacio"
                                        className="input-field" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                        Texto de Gancho <span className="text-zinc-700">(Opcional)</span>
                                    </label>
                                    <input type="text" value={formData.miniatura}
                                        onChange={(e) => setFormData({ ...formData, miniatura: e.target.value })}
                                        placeholder="Texto breve para la miniatura"
                                        className="input-field" />
                                </div>
                            </div>
                        )}

                        {/* ─── Step 3: Estilo ─── */}
                        {currentStep === 3 && (
                            <div className="animate-fade">
                                <div className="mb-6">
                                    <h2 className="text-lg font-black tracking-tight mb-1">Personalización</h2>
                                    <p className="text-zinc-600 text-xs">Voz, idioma y estilo visual.</p>
                                </div>

                                {isLoadingConfig ? (
                                    <div className="py-20 flex justify-center">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : configError ? (
                                    <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-2xl text-red-400 text-xs font-bold text-center">{configError}</div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Idioma & Voz */}
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Idioma</label>
                                                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                                    {metadata?.idiomas.map(lang => (
                                                        <OptionPill key={lang} selected={selectedIdioma === lang} onClick={() => handleIdiomaChange(lang)}>
                                                            {lang}
                                                        </OptionPill>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Voz IA</label>
                                                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                                    {metadata?.voices[selectedIdioma]?.map(v => (
                                                        <OptionPillAlt key={v.id} selected={selectedVoice === v.id} onClick={() => setSelectedVoice(v.id)}>
                                                            {v.name}
                                                        </OptionPillAlt>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtítulos */}
                                        <div className="border-t border-white/[0.04] pt-6 space-y-5">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Estilo Subtítulos</label>
                                                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                                        {(metadata?.subtitle_styles || DEFAULT_SUBTITLE_STYLES).map(style => (
                                                            <OptionPill key={style} selected={selectedSubtitleStyle === style} onClick={() => setSelectedSubtitleStyle(style)}>
                                                                {style}
                                                            </OptionPill>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Color</label>
                                                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                                        {(metadata?.subtitle_colors || DEFAULT_SUBTITLE_COLORS).map(color => (
                                                            <OptionPillAlt key={color} selected={selectedSubtitleColor === color} onClick={() => setSelectedSubtitleColor(color)}>
                                                                {color}
                                                            </OptionPillAlt>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Posición</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(metadata?.subtitle_positions || DEFAULT_SUBTITLE_POSITIONS).map(pos => (
                                                        <button key={pos} onClick={() => setSelectedSubtitlePosition(pos)}
                                                            className={`py-3 text-[10px] font-bold uppercase tracking-wider transition-all rounded-xl text-center border ${selectedSubtitlePosition === pos
                                                                ? 'bg-primary text-white border-primary rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.15)]'
                                                                : 'bg-white/[0.03] text-zinc-600 border-white/[0.06] hover:border-white/15'
                                                                }`}>
                                                            {pos === "Arriba" ? "↑ Arriba" : pos === "Centro" ? "— Centro" : "↓ Abajo"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Longitud del Guion */}
                                        <div className="border-t border-white/[0.04] pt-6 space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Longitud del Guion</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'short', label: 'Corto', detail: '~5 min • 5 Tokens' },
                                                    { id: 'medium', label: 'Medio', detail: '~15 min • 10 Tokens' },
                                                    { id: 'long', label: 'Largo', detail: '30+ min • 20 Tokens' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setTargetLength(opt.id as any)}
                                                        className={`p-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${targetLength === opt.id
                                                            ? 'bg-primary/10 border-primary text-primary shadow-[0_4_12px_rgba(220,38,38,0.1)]'
                                                            : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:border-white/20'
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                                        <span className="text-[8px] font-medium opacity-60 tracking-wider whitespace-nowrap">{opt.detail}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Estrategia */}
                                        <div className="border-t border-white/[0.04] pt-6 space-y-2.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Estrategia de Guion</label>
                                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                {metadata?.prompts[selectedIdioma]?.map(p => (
                                                    <button key={p.name} onClick={() => setSelectedPrompt(p.name)}
                                                        className={`px-4 py-3 text-left transition-all rounded-xl border ${selectedPrompt === p.name
                                                            ? 'bg-primary/10 border-primary/25'
                                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                                                            }`}>
                                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedPrompt === p.name ? 'text-primary' : 'text-white'}`}>{p.name}</div>
                                                        <div className="text-[9px] text-zinc-600 line-clamp-1 mt-0.5">{p.prompt}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── Nav Buttons ─── */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.04]">
                            <button onClick={handlePrevStep}
                                className={`text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors rounded-full px-4 py-2 hover:bg-white/[0.05] ${currentStep === 1 ? 'invisible' : ''}`}>
                                ← Atrás
                            </button>

                            {currentStep < totalSteps ? (
                                <button onClick={handleNextStep} className="btn-primary !py-3 !px-8">
                                    Siguiente →
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isProcessing}
                                    className={`btn-primary !py-3.5 !px-10 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isProcessing ? 'Procesando...' : '⚡ Generar Video'}
                                </button>
                            )}
                        </div>

                        {/* ─── Processing ─── */}
                        {isProcessing && (
                            <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-fade">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${statusMessage.toLowerCase().includes('cola') ? 'bg-amber-500' : 'bg-primary'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${statusMessage.toLowerCase().includes('cola') ? 'text-amber-500' : 'text-primary'}`}>
                                            {statusMessage.toLowerCase().includes('cola') ? 'En Cola de Espera' : 'Procesando'}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500">
                                        {statusMessage.toLowerCase().includes('cola') ? '#' : ''}{progress}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden mb-3 text-gradient-primary">
                                    <div className={`h-full rounded-full shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all duration-500 ${statusMessage.toLowerCase().includes('cola') ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-primary'}`}
                                        style={{ width: `${progress}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-zinc-500 font-mono italic truncate max-w-[70%]">{statusMessage}</p>
                                    <button onClick={handleCancel}
                                        className="text-[9px] text-zinc-700 hover:text-white font-bold uppercase tracking-widest transition-colors rounded-full px-3 py-1 bg-white/[0.03] hover:bg-red-500/10">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Config Tags ─── */}
                        {!isProcessing && (
                            <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
                                {formData.backgroundVideoPath && (
                                    <span className="text-[9px] font-bold text-zinc-600 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]">▶ Video</span>
                                )}
                                {formData.titulo && (
                                    <span className="text-[9px] font-bold text-zinc-600 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05] truncate max-w-[120px]">{formData.titulo}</span>
                                )}
                                <span className="text-[9px] font-bold text-zinc-600 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]">{selectedIdioma}</span>
                                <span className="text-[9px] font-bold text-zinc-600 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]">{selectedSubtitleStyle}</span>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ─── Script Modal ─── */}
            {isAwaitingScript && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                    <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-zinc-950 border border-white/[0.06] rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-fade-scale">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.04]">
                            <div>
                                <h2 className="text-xl font-black tracking-tight">
                                    Revisar <span className="text-gradient">Guion</span>
                                </h2>
                                <p className="text-[10px] text-zinc-600 mt-1">Edita el texto antes de generar el audio</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.03] px-3 py-1 rounded-full">{wordCount} palabras</span>
                                <span className="text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">Fase 2/3</span>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 mb-6">
                            <textarea
                                value={editedScript}
                                onChange={(e) => setEditedScript(e.target.value)}
                                className="w-full h-[340px] bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-sm text-zinc-300 focus:border-primary/25 focus:outline-none transition-all font-medium leading-relaxed resize-none custom-scrollbar focus:shadow-[0_0_0_3px_rgba(220,38,38,0.05)]"
                                placeholder="Escribe o edita tu guion aquí..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                            <button onClick={() => { setIsAwaitingScript(false); handleCancel(); }}
                                className="text-[10px] font-bold text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors rounded-full px-4 py-2 hover:bg-red-500/5">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmScript} disabled={isConfirmingScript}
                                className={`btn-primary !py-3 !px-8 ${isConfirmingScript ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isConfirmingScript ? 'Procesando...' : '⚡ Confirmar y Generar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ─── Toast Notifications ─── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
