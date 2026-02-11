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

    // Helper para URL dinámica
    const getApiUrl = (path: string) => {
        // En producción (Vercel), usar la variable de entorno
        // En desarrollo local, usar localhost:8000 si no hay variable definida
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}${path}`;
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
                const metaRes = await fetch(getApiUrl('/metadata'));
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
                setConfigError('No se pudo conectar con el servidor (Backend en Desconexión). ' + err.message);
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
        setStatusMessage('Subiendo recurso de fondo...');
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await fetch(getApiUrl('/upload-background'), {
                method: 'POST',
                body: uploadFormData
            });
            const data = await res.json();
            if (data.success) {
                setFormData({ ...formData, backgroundVideo: file, backgroundVideoPath: data.path });
                setStatusMessage('Video de fondo listo.');
            } else {
                alert('Error en la subida: ' + data.error);
            }
        } catch (err) {
            alert('Error de conexión durante la subida.');
        } finally {
            setUploadingBg(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificación de créditos
        if (!isAdmin && credits < 10) {
            return alert('❌ No tienes créditos suficientes (Costo: 10 tokens). Por favor, recarga tu cuenta.');
        }

        if (!formData.backgroundVideoPath) return alert('⚠️ Por favor, sube un video de fondo primero.');
        if (!formData.url || !formData.titulo || !selectedVoice || !selectedPrompt) return alert('Por favor, completa todos los campos.');

        setIsProcessing(true);
        setProgress(0);
        setStatusMessage('Iniciando secuencia en el servidor...');
        setResultData(null);

        try {
            const generateId = () => {
                try {
                    return crypto.randomUUID();
                } catch {
                    return Math.random().toString(36).substring(2) + Date.now().toString(36);
                }
            };
            const requestId = generateId();
            const userEmail = JSON.parse(localStorage.getItem(`user_${localStorage.getItem('version_user_email')}`) || '{}').email || 'unknown_user';

            const response = await fetch(getApiUrl('/process'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const interval = setInterval(async () => {
                try {
                    const statusRes = await fetch(getApiUrl(`/status/${data.task_id}`));
                    const status = await statusRes.json();
                    setProgress(status.progress);
                    setStatusMessage(status.message);

                    if (status.status === 'completed' || status.status === 'failed') {
                        clearInterval(interval);
                        setIsProcessing(false);
                        if (status.status === 'completed') {
                            // Descontar créditos si no es admin
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
                            alert('✅ Secuencia completada con éxito. Se han descontado 10 créditos.');
                        } else {
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

            <main className="container pt-32 pb-24">
                <header className="mb-16 animate-fade">
                    <span className="badge mb-4">Módulo de Orquestación</span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-4">
                        AUTOMATIZACIÓN <br /> <span className="text-primary italic">DE VIDEO IA</span>
                    </h1>
                    <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">Motor de Generación de Contenido Inteligente</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Panel de Configuración */}
                    <div className="lg:col-span-8 space-y-8 animate-fade [animation-delay:200ms]">

                        {/* 01. Recurso Visual */}
                        <section className={`glass-card relative !p-0 overflow-hidden border-l-4 transition-all duration-500 ${formData.backgroundVideoPath ? 'border-primary' : 'border-zinc-800'}`}>
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-black tracking-tighter uppercase flex items-center gap-4">
                                    <span className="text-primary tabular-nums">01</span> Recurso de Fondo
                                </h3>
                                {formData.backgroundVideoPath && <span className="text-[10px] bg-primary/10 text-primary font-black px-3 py-1 tracking-widest uppercase">Listo</span>}
                            </div>

                            <div className="p-8 bg-zinc-950/40">
                                {!formData.backgroundVideoPath ? (
                                    <div className="group relative border border-dashed border-white/10 hover:border-primary/50 transition-all p-12 text-center cursor-pointer">
                                        <input
                                            type="file"
                                            id="bg-upload"
                                            accept="video/mp4"
                                            onChange={(e) => e.target.files?.[0] && handleUploadBackground(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="mb-6 text-4xl group-hover:scale-110 transition-transform">{uploadingBg ? '⏳' : '📁'}</div>
                                        <span className="btn-outline !py-3 !px-6 !text-[11px]">
                                            {uploadingBg ? 'SUBIENDO...' : 'SELECCIONAR MP4'}
                                        </span>
                                        <p className="text-[9px] text-zinc-500 font-black tracking-[0.2em] uppercase mt-6">Requerido para la base visual del clip</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-6 bg-black border border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary border border-primary/20">🎥</div>
                                            <div>
                                                <p className="text-sm font-black uppercase truncate max-w-[200px] md:max-w-md">{formData.backgroundVideo?.name}</p>
                                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Asset cargado correctamente</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, backgroundVideoPath: '' })}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Reemplazar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 02. Parámetros de Contenido */}
                        <section className="glass-card !p-0 border-l-4 border-zinc-800">
                            <div className="p-8 border-b border-white/5">
                                <h3 className="text-lg font-black tracking-tighter uppercase flex items-center gap-4">
                                    <span className="text-zinc-500 tabular-nums">02</span> Configuración de Entrada
                                </h3>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">URL de Origen (YouTube)</label>
                                    <input
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="input-field !bg-zinc-950/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Título del Proyecto</label>
                                        <input
                                            type="text"
                                            value={formData.titulo}
                                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                            placeholder="Nombre del Clip"
                                            className="input-field !bg-zinc-950/50"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Texto de Miniatura</label>
                                        <input
                                            type="text"
                                            value={formData.miniatura}
                                            onChange={(e) => setFormData({ ...formData, miniatura: e.target.value })}
                                            placeholder="Texto de Gancho"
                                            className="input-field !bg-zinc-950/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 03. Estilo y Voz */}
                        <section className="glass-card !p-0 border-l-4 border-zinc-800">
                            <div className="p-8 border-b border-white/5">
                                <h3 className="text-lg font-black tracking-tighter uppercase flex items-center gap-4">
                                    <span className="text-zinc-500 tabular-nums">03</span> Estilo de Narración
                                </h3>
                            </div>

                            <div className="p-8">
                                {isLoadingConfig ? (
                                    <div className="py-12 flex justify-center text-primary">
                                        <div className="w-8 h-8 border-b-2 border-primary rounded-full animate-spin"></div>
                                    </div>
                                ) : configError ? (
                                    <div className="p-6 bg-primary/5 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest text-center">{configError}</div>
                                ) : (
                                    <div className="space-y-10">
                                        {/* Idioma Select */}
                                        <div className="flex flex-wrap gap-3">
                                            {metadata?.idiomas.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleIdiomaChange(lang)}
                                                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${selectedIdioma === lang
                                                        ? 'bg-primary text-white shadow-[0_0_15px_var(--primary-glow)]'
                                                        : 'bg-zinc-900 text-zinc-500 border border-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Voz Select */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Voz Neuronal</label>
                                            <select
                                                value={selectedVoice}
                                                onChange={(e) => setSelectedVoice(e.target.value)}
                                                className="input-field !bg-zinc-950/50 cursor-pointer"
                                            >
                                                {metadata?.voices[selectedIdioma]?.map(v => (
                                                    <option key={v.id} value={v.id} className="bg-zinc-950 p-4">{v.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Prompts Grid */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Estrategia de Guion (Prompt)</label>
                                            <div className="grid grid-cols-1 gap-4">
                                                {metadata?.prompts[selectedIdioma]?.map(p => (
                                                    <button
                                                        key={p.name}
                                                        onClick={() => setSelectedPrompt(p.name)}
                                                        className={`p-5 text-left transition-all border ${selectedPrompt === p.name
                                                            ? 'bg-primary/5 border-primary'
                                                            : 'bg-zinc-950/50 border-white/5 hover:border-zinc-700'
                                                            }`}
                                                    >
                                                        <div className={`text-xs font-black uppercase tracking-wider mb-2 ${selectedPrompt === p.name ? 'text-primary' : 'text-white'}`}>
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed italic">"{p.prompt}"</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Monitor de Estado y Acción */}
                    <div className="lg:col-span-4 sticky top-32 animate-fade [animation-delay:400ms]">
                        <div className="glass-card shadow-2xl relative overflow-hidden ring-1 ring-primary/20">
                            <div className="absolute top-0 right-0 p-3 opacity-20 text-primary font-black italic">VIP</div>

                            <h3 className="text-xs font-black tracking-[0.4em] text-zinc-500 uppercase mb-8 border-b border-white/5 pb-4">
                                Monitor de Sistema
                            </h3>

                            <div className="space-y-5 mb-10 font-mono text-[10px]">
                                <div className="flex justify-between items-center group">
                                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">IDIOMA_SET</span>
                                    <span className="text-white font-black">{selectedIdioma.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">VOZ_ID</span>
                                    <span className="text-white font-black truncate max-w-[120px]">{selectedVoice}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">IA_MODEL</span>
                                    <span className="text-primary font-black tracking-tighter italic">AUTO_ROTATION</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">ESTADO_CONEXION</span>
                                    <span className="text-green-500 font-black animate-pulse">ESTABLE [V2.6]</span>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="mb-10 space-y-4">
                                    <div className="flex justify-between items-end mb-2 font-black text-[10px] uppercase tracking-widest">
                                        <span className="text-primary animate-pulse italic">Procesando secuencia...</span>
                                        <span className="text-white tabular-nums">{progress}%</span>
                                    </div>
                                    <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_20px_var(--primary)] transition-all duration-700 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider italic leading-relaxed text-center px-4">
                                        📡 {statusMessage}
                                    </p>
                                </div>
                            )}

                            {!resultData ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isProcessing || !formData.backgroundVideoPath || (!isAdmin && credits < 1)}
                                    className={`w-full !py-6 !text-[11px] btn-primary ${isProcessing || !formData.backgroundVideoPath || (!isAdmin && credits < 1) ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}`}
                                >
                                    {isProcessing ? 'EJECUTANDO SECUENCIA...' : 'INICIAR GENERACIÓN'}
                                </button>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="p-4 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest text-center mb-6 ring-1 ring-primary/10">
                                        Secuencia Finalizada Correctamente
                                    </div>
                                    <a
                                        href={resultData.video_path}
                                        className="btn-primary w-full text-center !py-4 shadow-xl"
                                        target="_blank"
                                        download
                                    >
                                        Descargar Video Final
                                    </a>
                                    <a
                                        href={resultData.script_path}
                                        className="btn-outline w-full text-center !py-4 border-zinc-700 !text-[11px]"
                                        target="_blank"
                                        download
                                    >
                                        Descargar Guion Procesado
                                    </a>
                                    <button
                                        onClick={() => setResultData(null)}
                                        className="w-full text-[9px] text-zinc-600 hover:text-white font-black uppercase tracking-[0.3em] pt-4 transition-colors"
                                    >
                                        ← Iniciar Nuevo Proyecto
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-center text-[8px] font-black text-white/5 uppercase tracking-[0.8em] select-none">
                            Version Neural Engine v2.0
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
