'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';

interface UpcomingVideo {
    id?: string;
    titulo: string;
    url: string;
    idioma: string;
    voz?: string;
    prompt_name?: string;
    miniatura?: string;
    thumbnail_path?: string;         // local path
    background_video?: string;       // display name
    background_video_path?: string;  // local path for worker
}


interface Channel {
    id: string;
    name: string;
    logo_url?: string;
    banner_url?: string;
    upcoming_videos: UpcomingVideo[];
}

interface MetaVoice { id: string; name: string; }

const LANGS = ['Español', 'English', 'Русский', 'Deutsch', 'Français', 'Italiano', 'Português', '日本語'];
const emptyVideo = (): UpcomingVideo => ({
    titulo: '', url: '', idioma: 'Español', voz: '', prompt_name: '', miniatura: '', thumbnail_path: '', background_video: '', background_video_path: ''
});

function ChannelSkeleton() {
    return (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] animate-pulse">
            <div className="h-28 bg-zinc-900/50" />
            <div className="p-6 pt-9">
                <div className="h-6 w-3/4 bg-zinc-800 rounded-md mb-4" />
                <div className="h-8 w-1/4 bg-zinc-800 rounded-md mb-4" />
                <div className="h-10 w-full bg-zinc-800/50 rounded-xl" />
            </div>
        </div>
    );
}

function VideoSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                <div className="h-9 flex-1 bg-zinc-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-9">
                <div className="h-12 bg-zinc-900 rounded-lg" />
                <div className="h-12 bg-zinc-900 rounded-lg" />
                <div className="h-12 bg-zinc-900 rounded-lg" />
            </div>
        </div>
    );
}


export default function ChannelsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Voces por idioma
    const [voicesByLang, setVoicesByLang] = useState<Record<string, MetaVoice[]>>({});

    // Modal nuevo canal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChannel, setNewChannel] = useState({ name: '', logo_url: '', banner_url: '' });
    const [uploadingImgType, setUploadingImgType] = useState<string | null>(null);

    // Panel de canal seleccionado
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [editingVideos, setEditingVideos] = useState<UpcomingVideo[]>([]);
    const [savingVideos, setSavingVideos] = useState(false);
    const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);

    // Generación en cola
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingIdx, setGeneratingIdx] = useState<number>(-1);
    const [queueLog, setQueueLog] = useState<string[]>([]);

    useEffect(() => {
        if (!user && !isLoading) router.push('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            fetchChannels();
            fetchMetadata();
        }
    }, [user]);

    const fetchChannels = async () => {
        try {
            const data = await apiFetch<Channel[]>('/channels');
            if (data) setChannels(data);
        } catch (err) {
            console.error('Error fetching channels:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMetadata = async () => {
        if (Object.keys(voicesByLang).length > 0) return; // Ya tenemos voces
        try {
            const meta = await apiFetch<{ voices: Record<string, MetaVoice[]> }>('/metadata');
            if (meta?.voices) setVoicesByLang(meta.voices);
        } catch { /* ignorar */ }
    };

    // ─── Subida de imágenes (logo/banner) ────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImgType(type);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        try {
            const res = await apiFetch<{ success: boolean; url: string }>('/upload-channel-asset', { method: 'POST', body: fd });
            if (res.success) setNewChannel(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: res.url }));
        } catch { alert(`Error al subir ${type}`); }
        finally { setUploadingImgType(null); }
    };

    // ─── Subida de video de fondo por video ───────────────────────────
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingVideoIdx(idx);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await apiFetch<{ success: boolean; path: string; url: string }>('/upload-channel-video', { method: 'POST', body: fd });
            if (res.success) {
                setEditingVideos(prev => prev.map((v, i) => i === idx ? {
                    ...v,
                    background_video: file.name,
                    background_video_path: res.path
                } : v));
            }
        } catch { alert('Error al subir el video de fondo'); }
        finally { setUploadingVideoIdx(null); }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingVideoIdx(idx);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await apiFetch<{ success: boolean; path: string; url: string }>('/upload-channel-thumbnail', { method: 'POST', body: fd });
            if (res.success) {
                setEditingVideos(prev => prev.map((v, i) => i === idx ? {
                    ...v,
                    miniatura: res.url,
                    thumbnail_path: res.path
                } : v));
            }
        } catch { alert('Error al subir la miniatura'); }
        finally { setUploadingVideoIdx(null); }
    };

    // ─── Canal: guardar ───────────────────────────────────────────────
    const handleSaveChannel = async () => {
        if (!newChannel.name.trim()) return;
        setIsSaving(true);
        try {
            await apiFetch('/channels', { method: 'POST', body: JSON.stringify({ ...newChannel, upcoming_videos: [] }) });
            setShowAddModal(false);
            setNewChannel({ name: '', logo_url: '', banner_url: '' });
            fetchChannels();
        } finally { setIsSaving(false); }
    };

    const handleDeleteChannel = async (id: string) => {
        if (!confirm('¿Eliminar este canal?')) return;
        await apiFetch(`/channels/${id}`, { method: 'DELETE' });
        setSelectedChannel(null);
        fetchChannels();
    };

    // ─── Panel: abrir canal ───────────────────────────────────────────
    const openChannel = (ch: Channel) => {
        setSelectedChannel(ch);
        setEditingVideos(ch.upcoming_videos?.length > 0 ? [...ch.upcoming_videos] : [emptyVideo()]);
        setQueueLog([]);
        setGeneratingIdx(-1);
    };

    // ─── Videos: edición ─────────────────────────────────────────────
    const updateVideo = (idx: number, field: keyof UpcomingVideo, val: string) =>
        setEditingVideos(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));

    const addVideo = () => setEditingVideos(prev => [...prev, emptyVideo()]);
    const removeVideo = (idx: number) => setEditingVideos(prev => prev.filter((_, i) => i !== idx));

    const saveVideos = async () => {
        if (!selectedChannel) return;
        setSavingVideos(true);
        try {
            const updated = { ...selectedChannel, upcoming_videos: editingVideos.filter(v => v.titulo.trim()) };
            await apiFetch('/channels', { method: 'POST', body: JSON.stringify(updated) });
            await fetchChannels();
            setSelectedChannel(prev => prev ? { ...prev, upcoming_videos: updated.upcoming_videos } : null);
        } finally { setSavingVideos(false); }
    };

    // ─── Generar todos ────────────────────────────────────────────────
    const handleGenerateAll = async () => {
        const videos = editingVideos.filter(v => v.titulo.trim() && v.url.trim());
        if (videos.length === 0) { alert('Necesitas al menos un video con título y URL.'); return; }

        // Confirmación de costo de tokens
        const totalCost = videos.length;
        if (!confirm(`🚀 Estás por generar ${totalCost} video(s). \n\nEsto consumirá un total de ${totalCost} tokens (${totalCost} x 1 token). \n\n¿Deseas continuar?`)) return;

        // Validar fondos (opcional, el backend lo hará igual)
        if (user && user.credits < totalCost) {
            alert(`❌ Saldo insuficiente. Necesitas ${totalCost} tokens y tienes ${user.credits}.`);
            return;
        }

        // Validar fondos
        const sinFondo = videos.filter(v => !v.background_video_path?.trim());
        if (sinFondo.length > 0) {
            if (!confirm(`${sinFondo.length} video(s) no tienen fondo subido. ¿Continuar de todas formas? Esos fallarán.`)) return;
        }

        setIsGenerating(true);
        setQueueLog([`🚀 Iniciando cola de ${videos.length} video(s)...`]);

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            setGeneratingIdx(i);
            setQueueLog(prev => [...prev, `▶ (${i + 1}/${videos.length}) Encolando: "${video.titulo}"...`]);

            try {
                const requestId = `ch_${selectedChannel?.id?.slice(0, 8)}_v${i}_${Date.now()}`;
                await apiFetch('/process', {
                    method: 'POST',
                    body: JSON.stringify({
                        request_id: requestId,
                        url: video.url,
                        titulo: video.titulo,
                        idioma: video.idioma || 'Español',
                        voz: video.voz || null,
                        prompt_name: video.prompt_name || null,
                        miniatura: video.miniatura || '',
                        thumbnail_url: video.miniatura || '',
                        thumbnail_path: video.thumbnail_path || '',
                        background_video: video.background_video_path || '',

                        pause_at_script: false,
                    }),
                });
                setQueueLog(prev => [...prev, `✅ "${video.titulo}" encolado correctamente.`]);
            } catch (err: any) {
                setQueueLog(prev => [...prev, `❌ Error en "${video.titulo}": ${err.message}`]);
            }

            // Pequeña pausa entre requests
            await new Promise(r => setTimeout(r, 300));
        }

        setQueueLog(prev => [...prev, `🎬 Cola finalizada. Ve al Dashboard para ver el progreso.`]);
        setIsGenerating(false);
        setGeneratingIdx(-1);
    };

    if (isLoading && channels.length === 0) {
        return (
            <div className="min-h-screen p-8 md:p-12" style={{ background: 'var(--background)' }}>
                <div className="w-48 h-4 bg-zinc-800 rounded-full mb-6 opacity-20" />
                <div className="h-12 w-64 bg-zinc-800 rounded-xl mb-12" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <ChannelSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    // ─── Panel de canal ───────────────────────────────────────────────
    if (selectedChannel) return (
        <div className="min-h-screen p-6 md:p-10 pb-32" style={{ background: 'var(--background)', color: 'var(--foreground)', '--glass-blur': '8px' } as any}>
            <button onClick={() => setSelectedChannel(null)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mb-6 block">
                ← Volver a Mis Canales
            </button>

            {/* Header del canal */}
            <EliteCard variant="glass" className="!p-0 overflow-hidden mb-8">
                <div className="h-36 relative overflow-hidden">
                    {selectedChannel.banner_url
                        ? <img src={getApiUrl(selectedChannel.banner_url)} alt="Banner" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, transparent 100%)', opacity: 0.15 }} />
                    }
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000 0%, transparent 70%)' }} />
                    <div className="absolute bottom-4 left-6 flex items-end gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-black shadow-2xl bg-zinc-800">
                            {selectedChannel.logo_url
                                ? <img src={getApiUrl(selectedChannel.logo_url)} alt="Logo" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                : <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
                            }
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">{selectedChannel.name}</h1>
                    </div>
                </div>
            </EliteCard>

            {/* Barra de acciones */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                <h2 className="text-lg font-black uppercase tracking-tight">
                    📋 Próximos Videos <span className="text-primary">({editingVideos.filter(v => v.titulo).length})</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                    <EliteButton variant="outline" size="sm" onClick={addVideo}>+ Agregar</EliteButton>
                    <EliteButton variant="outline" size="sm" onClick={saveVideos} disabled={savingVideos}>
                        {savingVideos ? 'Guardando...' : '💾 Guardar Lista'}
                    </EliteButton>
                    <EliteButton variant="primary" size="sm" onClick={handleGenerateAll} disabled={isGenerating} className="flex items-center gap-2">
                        {isGenerating ? `⏳ Generando ${generatingIdx + 1}/${editingVideos.filter(v => v.titulo).length}...` : (
                            <>
                                🎬 GENERAR TODOS
                                <span className="px-1.5 py-0.5 bg-black/30 rounded text-[9px] border border-white/10">
                                    ⚡ 10-20
                                </span>
                            </>
                        )}
                    </EliteButton>
                </div>
            </div>

            {/* Lista de videos */}
            <div className="space-y-4 mb-8">
                {editingVideos.map((video, idx) => {
                    const voicesForLang = voicesByLang[video.idioma] || [];
                    return (
                        <EliteCard key={idx} variant="glass" className="!p-4">
                            {/* Fila del título */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-primary font-mono font-black text-sm w-6 flex-shrink-0">{idx + 1}.</span>
                                <input
                                    value={video.titulo}
                                    onChange={e => updateVideo(idx, 'titulo', e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none"
                                    placeholder="Título del video..."
                                />
                                <button onClick={() => removeVideo(idx)} className="text-zinc-600 hover:text-red-500 transition-colors text-lg flex-shrink-0">✕</button>
                            </div>

                            {/* Grid de campos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-9 mb-4">
                                {/* URL */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">URL / FUENTE YOUTUBE</label>
                                    <input
                                        value={video.url}
                                        onChange={e => updateVideo(idx, 'url', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                                {/* Idioma */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">IDIOMA</label>
                                    <select
                                        value={video.idioma}
                                        onChange={e => { updateVideo(idx, 'idioma', e.target.value); updateVideo(idx, 'voz', ''); }}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                                    >
                                        {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                {/* Voz */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">VOZ NARRATIVA</label>
                                    <select
                                        value={video.voz || ''}
                                        onChange={e => updateVideo(idx, 'voz', e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                                    >
                                        <option value="">🎙️ Voz por defecto</option>
                                        {voicesForLang.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                {/* Estilo de guion */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">ESTILO DE GUION</label>
                                    <input
                                        value={video.prompt_name || ''}
                                        onChange={e => updateVideo(idx, 'prompt_name', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                                        placeholder="🎭 Opcional: Estilo de guion"
                                    />
                                </div>
                                {/* Video de fondo — upload */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">VIDEO DE FONDO</label>
                                    <label className="relative flex items-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-lg px-3 py-2 text-xs cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                                        {uploadingVideoIdx === idx ? (
                                            <span className="text-primary animate-pulse">📤 Subiendo...</span>
                                        ) : video.background_video ? (
                                            <span className="text-green-400 truncate">✅ {video.background_video}</span>
                                        ) : (
                                            <span className="text-zinc-500">📹 Subir video de fondo</span>
                                        )}
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => handleVideoUpload(e, idx)}
                                        />
                                    </label>
                                </div>
                                {/* Miniatura — upload */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">MINIATURA (OPCIONAL)</label>
                                    <label className="relative flex items-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-lg px-3 py-2 text-xs cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                                        {uploadingVideoIdx === idx ? (
                                            <span className="text-primary animate-pulse">📤 Subiendo...</span>
                                        ) : video.miniatura ? (
                                            <div className="flex items-center gap-2 truncate">
                                                <img src={getApiUrl(video.miniatura)} className="w-4 h-4 rounded object-cover" />
                                                <span className="text-green-400 truncate tracking-tighter">✅ Miniatura Personalizada</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500">🖼️ Subir Miniatura</span>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => handleThumbnailUpload(e, idx)}
                                        />
                                    </label>
                                </div>
                            </div>


                            {/* Indicador generando */}
                            {isGenerating && generatingIdx === idx && (
                                <div className="mt-2 pl-9 text-[10px] text-primary animate-pulse">▶ Generando este video...</div>
                            )}
                        </EliteCard>
                    );
                })}

                {editingVideos.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-zinc-600">
                        <p className="text-3xl mb-2">🎬</p>
                        <p className="text-sm">No hay videos. Haz clic en "+ Agregar".</p>
                    </div>
                )}

                {isLoading && editingVideos.length === 0 && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <VideoSkeleton key={i} />)}
                    </div>
                )}
            </div>

            {/* Log de generación */}
            {queueLog.length > 0 && (
                <EliteCard variant="glass" className="!p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">LOG DE GENERACIÓN</h3>
                    <div className="space-y-1 font-mono max-h-48 overflow-y-auto">
                        {queueLog.map((line, i) => (
                            <p key={i} className="text-[11px] text-zinc-400">{line}</p>
                        ))}
                    </div>
                    {!isGenerating && (
                        <EliteButton variant="outline" size="sm" className="mt-4" onClick={() => router.push('/dashboard')}>
                            Ver Progreso en Dashboard →
                        </EliteButton>
                    )}
                </EliteCard>
            )}
        </div>
    );

    // ─── Vista principal: lista de canales ────────────────────────────
    return (
        <div className="min-h-screen p-8 md:p-12 pb-32" style={{ background: 'var(--background)', color: 'var(--foreground)', '--glass-blur': '8px' } as any}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                <div>
                    <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mb-4 block">
                        ← Regresar al Dashboard
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                        MIS <span className="text-primary">CANALES</span>
                    </h1>
                    <p className="font-medium text-sm text-zinc-500 mt-2">
                        Gestiona tu flota de canales y genera tu producción en cola.
                    </p>
                </div>
                <EliteButton variant="primary" onClick={() => setShowAddModal(true)}>
                    + NUEVO CANAL
                </EliteButton>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {channels.map(channel => (
                    <div
                        key={channel.id}
                        onClick={() => openChannel(channel)}
                        className="group overflow-hidden cursor-pointer rounded-3xl border transition-all duration-300 hover:ring-1 hover:ring-primary/50 hover:border-white/20"
                        style={{ background: 'var(--glass)', borderColor: 'var(--border)', backdropFilter: 'blur(8px)' }}
                    >
                        <div className="h-28 bg-zinc-900 overflow-hidden relative">
                            {channel.banner_url ? (
                                <img
                                    src={getApiUrl(channel.banner_url)}
                                    alt="Banner"
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, transparent 100%)', opacity: 0.12 }} />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(to top, #0d0d0d, transparent)' }} />
                            <div className="absolute -bottom-5 left-5 w-14 h-14 rounded-xl border-4 border-black bg-zinc-800 overflow-hidden shadow-2xl">
                                {channel.logo_url ? (
                                    <img
                                        src={getApiUrl(channel.logo_url)}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">📺</div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 pt-9">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black uppercase tracking-tight">{channel.name}</h3>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDeleteChannel(channel.id); }}
                                    className="text-zinc-700 hover:text-red-500 transition-colors"
                                >🗑️</button>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-primary font-black text-lg">{channel.upcoming_videos?.length || 0}</span>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Videos en cola</span>
                            </div>
                            <div className="w-full text-center py-2 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:border-primary/50 group-hover:text-primary transition-all">
                                Gestionar Canal →
                            </div>
                        </div>
                    </div>
                ))}

                {channels.length === 0 && (
                    <div className="col-span-full py-24 text-center">
                        <div className="text-6xl mb-4">📺</div>
                        <h2 className="text-xl font-black uppercase text-zinc-700">No tienes canales registrados</h2>
                        <p className="text-zinc-600 text-sm mt-2">Empieza creando tu primer canal.</p>
                    </div>
                )}
            </div>

            {/* Modal nuevo canal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <EliteCard variant="glass" className="w-full max-w-lg p-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Nuevo Canal</h2>
                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Nombre del Canal *</label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                    placeholder="Ej. VERSION Shorts"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {(['logo', 'banner'] as const).map(type => (
                                    <div key={type}>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">{type === 'logo' ? '🖼️ Logo' : '🎨 Banner'}</label>
                                        <div className="relative h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-primary/40 transition-colors">
                                            {(type === 'logo' ? newChannel.logo_url : newChannel.banner_url) ? (
                                                <img src={getApiUrl(type === 'logo' ? newChannel.logo_url : newChannel.banner_url)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] text-zinc-600">Clic para subir</span>
                                            )}
                                            <input
                                                type="file" accept="image/*"
                                                onChange={e => handleImageUpload(e, type)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            {uploadingImgType === type && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold animate-pulse">Subiendo...</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <EliteButton variant="outline" fullWidth onClick={() => setShowAddModal(false)}>CANCELAR</EliteButton>
                            <EliteButton variant="primary" fullWidth onClick={handleSaveChannel} disabled={isSaving}>
                                {isSaving ? 'CREANDO...' : 'CREAR CANAL'}
                            </EliteButton>
                        </div>
                    </EliteCard>
                </div>
            )}
        </div>
    );
}
