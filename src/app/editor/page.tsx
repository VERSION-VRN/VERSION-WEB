'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';

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
}

export default function VideoEditor() {
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [credits, setCredits] = useState(0);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const router = useRouter();

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Form States
    const [selectedIdioma, setSelectedIdioma] = useState('Español');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [formData, setFormData] = useState({
        url: '',
        titulo: '',
        miniatura: '',
        backgroundVideo: null as File | null,
        backgroundVideoPath: ''
    });

    // UI States
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [uploadingBg, setUploadingBg] = useState(false);
    const [configError, setConfigError] = useState('');
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [resultData, setResultData] = useState<{ video_path: string, script_path?: string } | null>(null);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    // Helper para URL dinámica
    const getApiUrl = (path: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}${path}`;
    };

    // Helper para headers de seguridad
    const getSecurityHeaders = (isJson = true) => {
        const headers: Record<string, string> = {
            'X-API-Key': process.env.NEXT_PUBLIC_API_SECRET_KEY || 'wolfmessi10',
            'bypass-tunnel-reminders': 'true',
        };
        if (isJson) headers['Content-Type'] = 'application/json';
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
        setCredits(parseInt(userCredits || '0'));
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
        setStatusMessage('Iniciando carga optimizada...');

        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
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
                        if (res.ok) success = true;
                        else throw new Error('Server error');
                    } catch (e) {
                        retries--;
                        if (retries === 0) throw e;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                const percent = Math.round(((i + 1) / totalChunks) * 100);
                setStatusMessage(`Subiendo: ${percent}% completado`);
            }

            setStatusMessage('Ensamblando video...');
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
                setStatusMessage('Video cargado correctamente.');
            } else {
                throw new Error(data.error || 'Error desconocido al ensamblar');
            }

        } catch (err: any) {
            console.error("Error de subida:", err);
            alert('Error al subir el video: ' + err.message);
            setStatusMessage('Error en la carga.');
        } finally {
            setUploadingBg(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!formData.backgroundVideoPath) return alert("Debes subir un video de fondo para continuar.");
        }
        if (currentStep === 2) {
            if (!formData.url) return alert("Debes ingresar la URL de YouTube.");
            if (!formData.titulo) return alert("Debes ingresar un título.");
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleCancel = async () => {
        if (!currentTaskId) return;
        if (!confirm('¿Seguro que quieres cancelar el proceso?')) return;

        try {
            setStatusMessage('Cancelando...');
            await fetch(getApiUrl(`/cancel/${currentTaskId}`), {
                method: 'POST',
                headers: getSecurityHeaders(false)
            });
        } catch (error) {
            console.error("Error al cancelar:", error);
            alert("No se pudo cancelar la tarea.");
        }
    };

    const handleSubmit = async () => {
        if (!isAdmin && credits < 10) {
            return alert('❌ No tienes créditos suficientes (Costo: 10 tokens). Por favor, recarga tu cuenta.');
        }

        if (!formData.backgroundVideoPath || !formData.url || !formData.titulo || !selectedVoice || !selectedPrompt) {
            return alert('Por favor, completa todos los campos.');
        }

        setIsProcessing(true);
        setProgress(0);
        setStatusMessage('Iniciando secuencia en el servidor...');
        setResultData(null);

        try {
            const requestId = crypto.randomUUID();
            const userEmail = JSON.parse(localStorage.getItem(`user_${localStorage.getItem('version_user_email')}`) || '{}').email || 'unknown_user';

            const response = await fetch(getApiUrl('/process'), {
                method: 'POST',
                headers: getSecurityHeaders(),
                body: JSON.stringify({
                    url: formData.url,
                    idioma: selectedIdioma,
                    voz: selectedVoice,
                    prompt_name: selectedPrompt,
                    titulo: formData.titulo,
                    miniatura: formData.miniatura || formData.titulo,
                    add_subtitles: false,
                    background_video: formData.backgroundVideoPath,
                    request_id: requestId,
                    user_id: userEmail
                })
            });

            const data = await response.json();
            if (!data.success) {
                setIsProcessing(false);
                return alert('Error al iniciar proceso: ' + (data.detail || data.message || 'Error desconocido'));
            }

            setCurrentTaskId(data.task_id);

            const interval = setInterval(async () => {
                try {
                    const statusRes = await fetch(getApiUrl(`/status/${data.task_id}`), {
                        headers: getSecurityHeaders(false)
                    });
                    const status = await statusRes.json();
                    setProgress(status.progress);
                    setStatusMessage(status.message);

                    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
                        clearInterval(interval);
                        setIsProcessing(false);
                        setCurrentTaskId(null);

                        if (status.status === 'completed') {
                            if (!isAdmin) {
                                const newCredits = Math.max(0, credits - 10);
                                setCredits(newCredits);
                                localStorage.setItem('version_user_credits', newCredits.toString());
                            }
                            const videoRelPath = status.result.video_rel_path || status.result.video_path.split(/[\\/]/).pop();
                            const scriptRelPath = status.result.script_rel_path || videoRelPath.replace('.mp4', '_GUION.txt');

                            setResultData({
                                video_path: getApiUrl(`/downloads/${encodeURI(videoRelPath)}`),
                                script_path: getApiUrl(`/downloads/${encodeURI(scriptRelPath)}`)
                            });
                        } else if (status.status === 'failed') {
                            alert('❌ Error: ' + status.message);
                        }
                    }
                } catch {
                    clearInterval(interval);
                    setIsProcessing(false);
                }
            }, 2500);
        } catch {
            setIsProcessing(false);
            alert('Error de conexión con el backend.');
        }
    };

    if (isLoadingAuth) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 overflow-x-hidden">
            {/* Navbar */}
            <nav className="container flex justify-between items-center py-6 border-b border-white/5 fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl z-50">
                <Link href="/dashboard" className="text-xl font-black tracking-tighter uppercase transition-all hover:text-primary">
                    VERSION<span className="text-primary italic">.EDITOR</span>
                </Link>
                <div className="flex items-center gap-6">
                    <div className="bg-white/5 border border-white/5 px-4 py-2 flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none">Tu Saldo</span>
                        <span className="text-sm font-black text-primary leading-none">{isAdmin ? '∞' : credits}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sistema Online</span>
                    </div>
                </div>
            </nav>

            <main className="container pt-32 pb-24 max-w-6xl">
                <header className="mb-12 animate-fade text-center">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-4">
                        CREA TU <span className="text-primary italic">CONTENIDO</span>
                    </h1>
                    <p className="text-zinc-500 font-bold text-xs tracking-[0.3em] uppercase">ASISTENTE DE GENERACIÓN INTELIGENTE</p>
                </header>

                {/* Progress Bar */}
                <div className="mb-16 max-w-3xl mx-auto">
                    <div className="flex justify-between mb-4 px-2">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className={`flex flex-col items-center gap-2 ${currentStep >= step ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500
                                    ${currentStep >= step ? 'border-primary bg-primary text-black' : 'border-white text-white bg-black'}
                                    ${currentStep === step ? 'ring-4 ring-primary/20 scale-110' : ''}
                                `}>
                                    0{step}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                    {step === 1 ? 'Recursos' : step === 2 ? 'Datos' : 'Configuración'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-8">
                        <div className="glass-card min-h-[500px] relative flex flex-col">
                            {currentStep === 1 && (
                                <div className="flex-1 animate-fade">
                                    <div className="border-b border-white/5 pb-6 mb-8">
                                        <h3 className="text-xl font-black tracking-tighter uppercase mb-2">01. Recurso de Fondo</h3>
                                        <p className="text-zinc-500 text-xs">Sube el video que servirá de base visual para tu contenido.</p>
                                    </div>

                                    <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5">
                                        {!formData.backgroundVideoPath ? (
                                            <div className="group relative border border-dashed border-white/10 hover:border-primary/50 transition-all p-16 text-center cursor-pointer rounded-lg bg-black/20">
                                                <input
                                                    type="file"
                                                    id="bg-upload"
                                                    accept="video/*"
                                                    onChange={(e) => e.target.files?.[0] && handleUploadBackground(e.target.files[0])}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="mb-6 text-5xl group-hover:scale-110 transition-transform text-white/20 group-hover:text-primary">{uploadingBg ? '⏳' : '📁'}</div>
                                                <span className="btn-outline !py-3 !px-8 !text-[10px]">
                                                    {uploadingBg ? 'SUBIENDO...' : 'SELECCIONAR ARCHIVO'}
                                                </span>
                                                <p className="text-[9px] text-zinc-500 font-black tracking-[0.2em] uppercase mt-8">MODO CHUNK ACTIVADO • SOPORTA ARCHIVOS GRANDES</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-black/40 border border-primary/20 rounded-lg gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-primary border border-primary/20 rounded-full text-2xl">🎥</div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase truncate max-w-[200px] md:max-w-xs text-white">{formData.backgroundVideo?.name}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Listo para usar</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setFormData({ ...formData, backgroundVideoPath: '' })}
                                                    className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors py-2 px-4 border border-red-500/20 hover:border-red-500/50 rounded"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="flex-1 animate-fade">
                                    <div className="border-b border-white/5 pb-6 mb-8">
                                        <h3 className="text-xl font-black tracking-tighter uppercase mb-2">02. Configuración de Entrada</h3>
                                        <p className="text-zinc-500 text-xs">Define el contenido que quieres procesar desde YouTube.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">URL de Origen (YouTube)</label>
                                            <input
                                                type="url"
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="input-field !bg-zinc-950/50 !p-4 !text-sm"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Título del Proyecto</label>
                                            <input
                                                type="text"
                                                value={formData.titulo}
                                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                                placeholder="Ej: Curiosidades sobre el Espacio"
                                                className="input-field !bg-zinc-950/50 !p-4 !text-sm"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Texto de Gancho (Opcional)</label>
                                            <input
                                                type="text"
                                                value={formData.miniatura}
                                                onChange={(e) => setFormData({ ...formData, miniatura: e.target.value })}
                                                placeholder="Texto breve para la miniatura"
                                                className="input-field !bg-zinc-950/50 !p-4 !text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="flex-1 animate-fade">
                                    <div className="border-b border-white/5 pb-6 mb-8">
                                        <h3 className="text-xl font-black tracking-tighter uppercase mb-2">03. Estilo y Voz</h3>
                                        <p className="text-zinc-500 text-xs">Personaliza la personalidad de tu video.</p>
                                    </div>

                                    {isLoadingConfig ? (
                                        <div className="py-20 flex justify-center text-primary">
                                            <div className="w-10 h-10 border-b-2 border-primary rounded-full animate-spin"></div>
                                        </div>
                                    ) : configError ? (
                                        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center">{configError}</div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Idioma</label>
                                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                        {metadata?.idiomas.map(lang => (
                                                            <button
                                                                key={lang}
                                                                onClick={() => handleIdiomaChange(lang)}
                                                                className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all text-left border rounded ${selectedIdioma === lang
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                {lang}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Voz IA</label>
                                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                        {metadata?.voices[selectedIdioma]?.map(v => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => setSelectedVoice(v.id)}
                                                                className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all text-left border rounded ${selectedVoice === v.id
                                                                    ? 'bg-white text-black border-white'
                                                                    : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                {v.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Estrategia de Guion</label>
                                                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                                    {metadata?.prompts[selectedIdioma]?.map(p => (
                                                        <button
                                                            key={p.name}
                                                            onClick={() => setSelectedPrompt(p.name)}
                                                            className={`p-4 text-left transition-all border rounded flex flex-col gap-1 ${selectedPrompt === p.name
                                                                ? 'bg-primary/10 border-primary'
                                                                : 'bg-zinc-950/50 border-white/5 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <div className={`text-[10px] font-black uppercase tracking-wider ${selectedPrompt === p.name ? 'text-primary' : 'text-white'}`}>
                                                                {p.name}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 line-clamp-1 italic opacity-70">"{p.prompt}"</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-8 flex justify-between border-t border-white/5">
                                <button
                                    onClick={handlePrevStep}
                                    disabled={currentStep === 1}
                                    className={`px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    ← Atrás
                                </button>

                                {currentStep < totalSteps ? (
                                    <button
                                        onClick={handleNextStep}
                                        className="btn-primary !py-3 !px-8 !text-[10px]"
                                    >
                                        Siguiente Paso →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isProcessing}
                                        className={`btn-primary !py-3 !px-12 !text-[10px] shadow-[0_0_30px_var(--primary-glow)] ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                    >
                                        {isProcessing ? 'PROCESANDO...' : '🚀 GENERAR VIDEO'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 sticky top-32 animate-fade [animation-delay:400ms]">
                        <div className="glass-card shadow-2xl relative overflow-hidden ring-1 ring-primary/20">
                            <h3 className="text-xs font-black tracking-[0.4em] text-zinc-500 uppercase mb-8 border-b border-white/5 pb-4">
                                Resumen
                            </h3>

                            {!resultData ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-colors ${formData.backgroundVideoPath ? 'border-primary text-primary bg-primary/10' : 'border-zinc-800 text-zinc-700'}`}>01</div>
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Recurso Visual</div>
                                            <div className={`text-xs font-bold truncate ${formData.backgroundVideoPath ? 'text-white' : 'text-zinc-700 italic'}`}>
                                                {formData.backgroundVideoPath ? 'Video Cargado' : 'Pendiente...'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-colors ${formData.url && formData.titulo ? 'border-primary text-primary bg-primary/10' : 'border-zinc-800 text-zinc-700'}`}>02</div>
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Datos de Entrada</div>
                                            <div className={`text-xs font-bold truncate ${formData.titulo ? 'text-white' : 'text-zinc-700 italic'}`}>
                                                {formData.titulo || 'Pendiente...'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-colors ${selectedVoice ? 'border-primary text-primary bg-primary/10' : 'border-zinc-800 text-zinc-700'}`}>03</div>
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Configuración</div>
                                            <div className="text-xs font-bold text-white uppercase">{selectedIdioma}</div>
                                        </div>
                                    </div>

                                    {isProcessing && (
                                        <div className="pt-6 border-t border-white/5 animate-pulse">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[9px] font-black uppercase text-primary">Estado</span>
                                                <span className="text-[10px] font-mono text-white">{progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className="h-full bg-primary shadow-[0_0_15px_var(--primary)] transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[9px] text-zinc-500 font-mono">{statusMessage}</p>
                                                <button
                                                    onClick={handleCancel}
                                                    className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 px-2 py-1 rounded transition-colors"
                                                >
                                                    CANCELAR
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in text-center">
                                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-500/20">
                                        ✨
                                    </div>
                                    <h4 className="text-lg font-black uppercase text-white tracking-tight">¡Video Generado!</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6 px-4">Tu contenido ha sido procesado y está listo para descargar.</p>

                                    <a href={resultData.video_path} className="btn-primary w-full block !py-4 shadow-lg animate-bounce-short" target="_blank" download>
                                        Descargar Video
                                    </a>
                                    <a href={resultData.script_path} className="btn-outline border-zinc-700 w-full block !py-3 !text-[10px]" target="_blank" download>
                                        Ver Guion
                                    </a>
                                    <button
                                        onClick={() => { setResultData(null); setCurrentStep(1); setFormData({ ...formData, backgroundVideoPath: '' }); }}
                                        className="text-[9px] text-zinc-500 hover:text-white font-black uppercase tracking-widest mt-6 block w-full hover:underline"
                                    >
                                        Crear Nuevo Video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
