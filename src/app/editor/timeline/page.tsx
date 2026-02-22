'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import '../../globals.css';
import { aiVersionClient, MediaFile } from '@/services/aiVersionClient';
import { apiFetch, getApiUrl } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────
interface Clip {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    label: string;
    color: string;
}

interface OverlayItem {
    id: string;
    mediaId: string;
    mediaUrl: string;
    mediaName: string;
    mediaType: 'image' | 'video';
    startTime: number;
    endTime: number;
    x: number;       // % 0-100
    y: number;       // % 0-100
    width: number;   // % 5-100
    opacity: number; // 0-1
}

type ActivePanel = 'clips' | 'media' | 'properties';

// ─── Helpers ─────────────────────────────────────────────
const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
const generateId = () => Math.random().toString(36).substring(2, 9);

const CLIP_COLORS = [
    'from-red-500/40 to-red-600/20',
    'from-blue-500/40 to-blue-600/20',
    'from-emerald-500/40 to-emerald-600/20',
    'from-purple-500/40 to-purple-600/20',
    'from-amber-500/40 to-amber-600/20',
    'from-cyan-500/40 to-cyan-600/20',
];
const CLIP_BORDERS = [
    'border-red-500/50', 'border-blue-500/50', 'border-emerald-500/50',
    'border-purple-500/50', 'border-amber-500/50', 'border-cyan-500/50',
];
const OVERLAY_TRACK_COLORS = ['bg-violet-500/30 border-violet-500/50', 'bg-sky-500/30 border-sky-500/50', 'bg-rose-500/30 border-rose-500/50'];

// ─── Component ───────────────────────────────────────────
function TimelineEditorContent() {
    const searchParams = useSearchParams();
    const videoUrl = searchParams.get('video') || '';
    const targetLength = searchParams.get('length') || 'medium';
    const scriptStyle = searchParams.get('style') || 'Estándar';

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);
    const mediaInputRef = useRef<HTMLInputElement>(null);

    // Video State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [videoError, setVideoError] = useState('');

    // Timeline/Clip State
    const [clips, setClips] = useState<Clip[]>([]);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const [trimHandle, setTrimHandle] = useState<'start' | 'end' | null>(null);
    const [trimClipId, setTrimClipId] = useState<string | null>(null);

    // Overlay State
    const [overlays, setOverlays] = useState<OverlayItem[]>([]);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
    const [overlayDragStart, setOverlayDragStart] = useState<{ ox: number; oy: number; mx: number; my: number } | null>(null);

    // Media Pool State
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    // UI State
    const [activePanel, setActivePanel] = useState<ActivePanel>('clips');
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState('');
    const [exportResult, setExportResult] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── API ─────────────────────────────────────────────

    // ─── Video Init ──────────────────────────────────────
    useEffect(() => {
        if (!videoUrl) { setVideoError('No se proporcionó URL de video.'); return; }
        const video = videoRef.current;
        if (!video) return;

        let url = videoUrl;
        if (window.location.hostname === 'localhost' && url.includes('.loca.lt')) {
            url = `http://localhost:8000${url.split('.loca.lt')[1]}`;
        }
        video.src = url;
        video.load();

        const onMeta = () => {
            if (isNaN(video.duration) || video.duration === Infinity) { setVideoError('Duración inválida.'); return; }
            setDuration(video.duration);
            setIsVideoLoaded(true);
            setClips([{ id: generateId(), startTime: 0, endTime: video.duration, duration: video.duration, label: 'Clip 1', color: CLIP_COLORS[0] }]);
        };
        const onErr = () => setVideoError('Error al cargar el video. Verifica la URL.');
        video.addEventListener('loadedmetadata', onMeta);
        video.addEventListener('error', onErr);
        return () => { video.removeEventListener('loadedmetadata', onMeta); video.removeEventListener('error', onErr); };
    }, [videoUrl]);

    // ─── Playhead sync ───────────────────────────────────
    const syncPlayhead = useCallback(() => {
        if (videoRef.current && !isDraggingPlayhead) setCurrentTime(videoRef.current.currentTime);
        animFrameRef.current = requestAnimationFrame(syncPlayhead);
    }, [isDraggingPlayhead]);
    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(syncPlayhead);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [syncPlayhead]);

    // ─── Playback ────────────────────────────────────────
    const seekTo = (t: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = Math.max(0, Math.min(t, duration));
        setCurrentTime(v.currentTime);
    };
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setIsPlaying(true); }
        else { v.pause(); setIsPlaying(false); }
    };

    // ─── Timeline Click ──────────────────────────────────
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTrimming) return;
        const rect = e.currentTarget.getBoundingClientRect();
        seekTo(((e.clientX - rect.left) / rect.width) * duration);
    };

    // ─── Playhead Drag ───────────────────────────────────
    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
        const move = (ev: MouseEvent) => {
            const tl = timelineRef.current;
            if (!tl) return;
            const r = tl.getBoundingClientRect();
            seekTo(((Math.max(0, Math.min(ev.clientX - r.left, r.width))) / r.width) * duration);
        };
        const up = () => { setIsDraggingPlayhead(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // ─── Trim ────────────────────────────────────────────
    const handleTrimStart = (e: React.MouseEvent, clipId: string, handle: 'start' | 'end') => {
        e.stopPropagation();
        setIsTrimming(true); setTrimHandle(handle); setTrimClipId(clipId);
        const move = (ev: MouseEvent) => {
            const tl = timelineRef.current;
            if (!tl) return;
            const r = tl.getBoundingClientRect();
            const t = ((Math.max(0, Math.min(ev.clientX - r.left, r.width))) / r.width) * duration;
            setClips(prev => prev.map(c => {
                if (c.id !== clipId) return c;
                if (handle === 'start') { const s = Math.max(0, Math.min(t, c.endTime - 0.5)); return { ...c, startTime: s, duration: c.endTime - s }; }
                else { const end = Math.max(c.startTime + 0.5, Math.min(t, duration)); return { ...c, endTime: end, duration: end - c.startTime }; }
            }));
        };
        const up = () => { setIsTrimming(false); setTrimHandle(null); setTrimClipId(null); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // ─── Split ───────────────────────────────────────────
    const handleSplit = () => {
        const target = clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
        if (!target) { showToast('Playhead no está dentro de un clip.', 'error'); return; }
        if (currentTime - target.startTime < 0.5 || target.endTime - currentTime < 0.5) { showToast('Punto de corte muy cerca del borde.', 'error'); return; }
        const idx = clips.length % CLIP_COLORS.length;
        setClips(prev => {
            const i = prev.findIndex(c => c.id === target.id);
            const list = [...prev];
            list.splice(i, 1, { ...target, endTime: currentTime, duration: currentTime - target.startTime },
                { id: generateId(), startTime: currentTime, endTime: target.endTime, duration: target.endTime - currentTime, label: `Clip ${prev.length + 1}`, color: CLIP_COLORS[idx] });
            return list;
        });
        showToast('Clip dividido', 'success');
    };

    const handleDeleteClip = (id: string) => {
        if (clips.length <= 1) { showToast('Debe quedar al menos un clip.', 'error'); return; }
        setClips(p => p.filter(c => c.id !== id));
        if (selectedClipId === id) setSelectedClipId(null);
        showToast('Clip eliminado', 'info');
    };

    // ─── Keyboard shortcuts ──────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch (e.key) {
                case ' ': e.preventDefault(); togglePlay(); break;
                case 's': case 'S': if (!e.ctrlKey) handleSplit(); break;
                case 'Delete': case 'Backspace': if (selectedClipId) handleDeleteClip(selectedClipId); break;
                case 'ArrowLeft': seekTo(currentTime - (e.shiftKey ? 5 : 1)); break;
                case 'ArrowRight': seekTo(currentTime + (e.shiftKey ? 5 : 1)); break;
                case '+': case '=': setZoom(z => Math.min(z + 0.5, 5)); break;
                case '-': setZoom(z => Math.max(z - 0.5, 0.5)); break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [currentTime, selectedClipId, duration, clips.length]);

    // ─── Media Pool ──────────────────────────────────────
    const loadMedia = useCallback(async () => {
        setIsLoadingMedia(true);
        try {
            const res = await aiVersionClient.listMedia();
            if (res.success && res.files) setMediaFiles(res.files as MediaFile[]);
        } finally { setIsLoadingMedia(false); }
    }, []);
    useEffect(() => { loadMedia(); }, [loadMedia]);

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingMedia(true);
        try {
            const res = await aiVersionClient.uploadMedia(file);
            if (res.success) { showToast('Archivo subido', 'success'); await loadMedia(); }
            else showToast(res.error || 'Error al subir', 'error');
        } finally { setIsUploadingMedia(false); if (mediaInputRef.current) mediaInputRef.current.value = ''; }
    };

    const handleDeleteMedia = async (id: string) => {
        const res = await aiVersionClient.deleteMedia(id);
        if (res.success) { setMediaFiles(p => p.filter(f => f.id !== id)); showToast('Eliminado', 'info'); }
    };

    // ─── Overlays ────────────────────────────────────────
    const addOverlay = (media: MediaFile) => {
        if (!isVideoLoaded) { showToast('Carga un video primero', 'error'); return; }
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const o: OverlayItem = {
            id: generateId(), mediaId: media.id,
            mediaUrl: `${base}${media.url}`, mediaName: media.name,
            mediaType: media.type as 'image' | 'video',
            startTime: currentTime, endTime: Math.min(currentTime + 5, duration),
            x: 5, y: 5, width: 25, opacity: 1,
        };
        setOverlays(p => [...p, o]);
        setSelectedOverlayId(o.id);
        setActivePanel('properties');
        showToast(`Overlay "${media.name}" añadido`, 'success');
    };

    const updateOverlay = (id: string, changes: Partial<OverlayItem>) =>
        setOverlays(p => p.map(o => o.id === id ? { ...o, ...changes } : o));

    const deleteOverlay = (id: string) => {
        setOverlays(p => p.filter(o => o.id !== id));
        if (selectedOverlayId === id) setSelectedOverlayId(null);
        showToast('Overlay eliminado', 'info');
    };

    // Overlay drag inside preview
    const startOverlayDrag = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedOverlayId(id);
        const o = overlays.find(x => x.id === id);
        if (!o || !previewRef.current) return;
        setIsDraggingOverlay(true);
        setOverlayDragStart({ ox: o.x, oy: o.y, mx: e.clientX, my: e.clientY });
    };
    useEffect(() => {
        if (!isDraggingOverlay || !overlayDragStart || !selectedOverlayId || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const onMove = (e: MouseEvent) => {
            const dx = ((e.clientX - overlayDragStart.mx) / rect.width) * 100;
            const dy = ((e.clientY - overlayDragStart.my) / rect.height) * 100;
            updateOverlay(selectedOverlayId, {
                x: Math.max(0, Math.min(70, overlayDragStart.ox + dx)),
                y: Math.max(0, Math.min(80, overlayDragStart.oy + dy)),
            });
        };
        const onUp = () => setIsDraggingOverlay(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [isDraggingOverlay, overlayDragStart, selectedOverlayId]);

    // ─── Export ──────────────────────────────────────────
    const handleExport = async () => {
        if (!clips.length) return;
        setIsExporting(true); setExportProgress(0); setExportMessage('Preparando...');
        try {
            if (clips.length === 1 && clips[0].startTime === 0 && Math.abs(clips[0].endTime - duration) < 0.1 && !overlays.length) {
                setExportResult(decodeURIComponent(videoUrl));
                setExportMessage('¡Listo! Sin cambios.');
                setExportProgress(100); setIsExporting(false); return;
            }
            setExportMessage('Recortando clips...');
            const trimmedPaths: string[] = [];
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i];
                setExportProgress(10 + Math.round((i / clips.length) * 50));
                const data = await apiFetch<{ success: boolean; error?: string; trimmed_path: string }>('/trim-video', {
                    method: 'POST',
                    body: JSON.stringify({ video_url: decodeURIComponent(videoUrl), start_time: clip.startTime, end_time: clip.endTime }),
                });
                if (!data.success) throw new Error(data.error || 'Error recortando');
                trimmedPaths.push(data.trimmed_path);
            }
            setExportMessage('Uniendo y aplicando overlays...');
            setExportProgress(70);

            // Build composition with overlays
            const composition = {
                clips: trimmedPaths,
                overlays: overlays.map(o => ({
                    media_path: o.mediaUrl.replace(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000', ''),
                    start_time: o.startTime, end_time: o.endTime,
                    x: o.x, y: o.y, width: o.width, opacity: o.opacity,
                })),
            };

            const mergeData = await apiFetch<{ success: boolean; error?: string; download_url: string }>('/merge-clips', {
                method: 'POST',
                body: JSON.stringify(composition),
            });
            if (!mergeData.success) throw new Error(mergeData.error || 'Error uniendo');
            setExportProgress(100); setExportMessage('¡Exportado!');
            setExportResult(getApiUrl(mergeData.download_url));
            showToast('¡Video exportado!', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            showToast('Error: ' + errorMessage, 'error');
            setExportMessage('Error en exportación');
        } finally { setIsExporting(false); }
    };

    // ─── Computed ────────────────────────────────────────
    const timelinePixelWidth = Math.max(600, duration * 80 * zoom);
    const getRulerMarks = () => {
        const marks: { time: number; label: string; major: boolean }[] = [];
        if (!duration) return marks;
        let interval = 1;
        if (duration / zoom > 120) interval = 10;
        else if (duration / zoom > 60) interval = 5;
        else if (duration / zoom > 20) interval = 2;
        for (let t = 0; t <= duration; t += interval)
            marks.push({ time: t, label: formatTime(t), major: t % (interval * 5) === 0 || interval >= 5 });
        return marks;
    };
    const selectedClip = clips.find(c => c.id === selectedClipId);
    const selectedOverlay = overlays.find(o => o.id === selectedOverlayId);
    const totalDuration = clips.reduce((a, c) => a + c.duration, 0);
    const activeOverlays = overlays.filter(o => currentTime >= o.startTime && currentTime <= o.endTime);

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 flex flex-col">

            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="text-sm font-black tracking-tight uppercase hover:text-primary transition-colors">
                            ← <span className="text-zinc-500">VERSION</span><span className="text-primary">.ED</span>
                        </Link>
                        <div className="w-px h-5 bg-white/[0.08]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timeline Pro</span>
                        <div className="hidden md:flex items-center gap-2 ml-2">
                            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-black uppercase text-primary tracking-tighter">{targetLength}</div>
                            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase text-zinc-400 tracking-tighter">{scriptStyle}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Duración</span>
                            <span className="text-xs font-mono font-bold text-white">{formatTime(totalDuration)}</span>
                        </div>
                        {exportResult ? (
                            <a href={exportResult} download className="btn-primary !py-2.5 !px-6 !text-[10px]">⬇ Descargar</a>
                        ) : (
                            <button onClick={handleExport} disabled={isExporting || !clips.length}
                                className={`btn-primary !py-2.5 !px-6 !text-[10px] ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isExporting ? 'Exportando...' : '⚡ Exportar'}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main */}
            <div className="flex-1 flex flex-col pt-14">
                {videoError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-6">⚠️</div>
                            <h2 className="text-xl font-black mb-2">Error al cargar video</h2>
                            <p className="text-zinc-500 text-sm mb-6">{videoError}</p>
                            <Link href="/editor" className="btn-primary !py-3 !px-8">← Volver</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top: Preview + Sidebar */}
                        <div className="flex-1 flex min-h-0">
                            {/* Video Preview */}
                            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950/50">
                                {/* Video + Overlay Canvas */}
                                <div ref={previewRef} className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
                                    style={{ cursor: isDraggingOverlay ? 'grabbing' : 'default' }}>
                                    <video ref={videoRef} className="w-full h-full object-contain" onEnded={() => setIsPlaying(false)} preload="metadata" />
                                    {/* Overlay images */}
                                    {activeOverlays.map(o => (
                                        <div key={o.id}
                                            onMouseDown={e => startOverlayDrag(e, o.id)}
                                            className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${selectedOverlayId === o.id ? 'ring-2 ring-primary/60' : ''}`}
                                            style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.width}%`, opacity: o.opacity, zIndex: 10 }}>
                                            <img src={o.mediaUrl} alt={o.mediaName} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                                        </div>
                                    ))}
                                    {!isVideoLoaded && !videoError && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Video Controls */}
                                {isVideoLoaded && (
                                    <div className="w-full max-w-3xl mt-4 flex items-center gap-4">
                                        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                                            {isPlaying ? '⏸' : '▶'}
                                        </button>
                                        <div className="text-xs font-mono text-zinc-400 min-w-[120px]">
                                            <span className="text-white font-bold">{formatTime(currentTime)}</span>
                                            <span className="text-zinc-600 mx-1">/</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[0.5, 1, 1.5, 2].map(r => (
                                                <button key={r} onClick={() => { const v = videoRef.current; if (v) { v.playbackRate = r; setPlaybackRate(r); } }}
                                                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${playbackRate === r ? 'bg-white text-black' : 'text-zinc-600 hover:text-white hover:bg-white/[0.05]'}`}>
                                                    {r}x
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex-1" />
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setIsMuted(v.muted); } }} className="text-zinc-500 hover:text-white transition-colors text-sm">
                                                {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                                            </button>
                                            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                                                onChange={e => { const v = videoRef.current; const val = parseFloat(e.target.value); if (v) { v.volume = val; setVolume(val); setIsMuted(val === 0); } }}
                                                className="w-20 accent-primary h-1 cursor-pointer" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Panel */}
                            <div className="w-80 border-l border-white/[0.04] bg-zinc-950/80 flex flex-col">
                                {/* Tabs */}
                                <div className="flex border-b border-white/[0.04]">
                                    {(['clips', 'media', 'properties'] as ActivePanel[]).map(tab => (
                                        <button key={tab} onClick={() => setActivePanel(tab)}
                                            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${activePanel === tab ? 'text-white border-b-2 border-primary' : 'text-zinc-600 hover:text-zinc-400'}`}>
                                            {tab === 'clips' ? '🎬 Clips' : tab === 'media' ? '📂 Medios' : '✦ Props'}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab: Clips */}
                                {activePanel === 'clips' && (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {selectedClip && (
                                            <div className="p-4 border-b border-white/[0.04] space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Inicio</label>
                                                        <p className="text-xs font-mono font-bold text-emerald-400">{formatTime(selectedClip.startTime)}</p>
                                                    </div>
                                                    <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Fin</label>
                                                        <p className="text-xs font-mono font-bold text-red-400">{formatTime(selectedClip.endTime)}</p>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                    <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Duración</label>
                                                    <p className="text-sm font-mono font-bold">{formatTime(selectedClip.duration)}</p>
                                                </div>
                                                <button onClick={() => handleDeleteClip(selectedClip.id)}
                                                    className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/15 rounded-xl hover:bg-red-500/10 transition-all">
                                                    🗑 Eliminar Clip
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Clips ({clips.length})</p>
                                            <div className="space-y-1.5">
                                                {clips.map(clip => (
                                                    <button key={clip.id} onClick={() => { setSelectedClipId(clip.id); seekTo(clip.startTime); }}
                                                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${selectedClipId === clip.id ? 'bg-primary/5 border-primary/25' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2.5 h-2.5 rounded-sm bg-gradient-to-r ${clip.color} flex-shrink-0`} />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider flex-1 truncate">{clip.label}</span>
                                                            <span className="text-[9px] font-mono text-zinc-500">{formatTime(clip.duration)}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: Media Pool */}
                                {activePanel === 'media' && (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="p-4 border-b border-white/[0.04]">
                                            <input ref={mediaInputRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleUploadMedia} />
                                            <button onClick={() => mediaInputRef.current?.click()} disabled={isUploadingMedia}
                                                className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary/20 transition-all disabled:opacity-50">
                                                {isUploadingMedia ? '⬆ Subiendo...' : '+ Subir Archivo'}
                                            </button>
                                        </div>
                                        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                            {isLoadingMedia ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : mediaFiles.length === 0 ? (
                                                <p className="text-center text-zinc-600 text-[10px] py-8 leading-relaxed">Tu biblioteca está vacía.<br />Sube imágenes o videos para usar como overlays.</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {mediaFiles.map(file => (
                                                        <div key={file.id} className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] aspect-video cursor-pointer hover:border-primary/40 transition-all"
                                                            onClick={() => addOverlay(file)}>
                                                            {file.type === 'image' ? (
                                                                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${file.url}`}
                                                                    alt={file.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                                    <span className="text-2xl">🎬</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-[9px] font-bold text-white uppercase">+ Añadir</span>
                                                            </div>
                                                            <button onClick={e => { e.stopPropagation(); handleDeleteMedia(file.id); }}
                                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-red-400 text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                ×
                                                            </button>
                                                            <div className="absolute bottom-0 inset-x-0 p-1 bg-black/70">
                                                                <p className="text-[8px] text-zinc-300 truncate">{file.name}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tab: Properties */}
                                {activePanel === 'properties' && (
                                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                        {!selectedOverlay ? (
                                            <div className="text-center py-8">
                                                <p className="text-zinc-600 text-[10px]">Selecciona un overlay</p>
                                                <p className="text-zinc-700 text-[9px] mt-2">Añade medios desde la pestaña Medios</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 truncate">{selectedOverlay.mediaName}</p>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Inicio (s)</label>
                                                        <input type="number" min="0" max={duration} step="0.1" value={selectedOverlay.startTime.toFixed(1)}
                                                            onChange={e => updateOverlay(selectedOverlay.id, { startTime: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary/40" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Fin (s)</label>
                                                        <input type="number" min="0" max={duration} step="0.1" value={selectedOverlay.endTime.toFixed(1)}
                                                            onChange={e => updateOverlay(selectedOverlay.id, { endTime: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary/40" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Tamaño: {selectedOverlay.width}%</label>
                                                        <input type="range" min="5" max="100" value={selectedOverlay.width}
                                                            onChange={e => updateOverlay(selectedOverlay.id, { width: parseInt(e.target.value) })}
                                                            className="w-full accent-primary cursor-pointer" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">Opacidad: {Math.round(selectedOverlay.opacity * 100)}%</label>
                                                        <input type="range" min="0" max="100" value={Math.round(selectedOverlay.opacity * 100)}
                                                            onChange={e => updateOverlay(selectedOverlay.id, { opacity: parseInt(e.target.value) / 100 })}
                                                            className="w-full accent-primary cursor-pointer" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                                                        <div className="p-2 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                            <span className="text-zinc-600 block mb-0.5">X</span>
                                                            <span className="text-white">{selectedOverlay.x.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="p-2 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                            <span className="text-zinc-600 block mb-0.5">Y</span>
                                                            <span className="text-white">{selectedOverlay.y.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteOverlay(selectedOverlay.id)}
                                                        className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/15 rounded-xl hover:bg-red-500/10 transition-all">
                                                        🗑 Eliminar Overlay
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Shortcuts footer */}
                                <div className="p-4 border-t border-white/[0.04]">
                                    <div className="grid grid-cols-2 gap-1 text-[8px] text-zinc-600">
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">Space</kbd> Play</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">S</kbd> Split</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">←→</kbd> Seek</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">Del</kbd> Borrar</span>
                                    </div>
                                </div>
                            </div>
                        </div>{/* end top section */}

                        {/* Export Progress */}
                        {isExporting && (
                            <div className="px-6 py-3 bg-zinc-900/80 border-t border-white/[0.04]">
                                <div className="max-w-[1800px] mx-auto flex items-center gap-4">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <div className="flex-1">
                                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]" style={{ width: `${exportProgress}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 min-w-[200px]">{exportMessage}</span>
                                    <span className="text-xs font-mono font-bold text-primary">{exportProgress}%</span>
                                </div>
                            </div>
                        )}

                        {/* Bottom: Timeline */}
                        <div className="border-t border-white/[0.04] bg-zinc-950">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04] bg-black/50">
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSplit}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all">
                                        ✂️ Split
                                    </button>
                                    <button onClick={() => selectedClipId && handleDeleteClip(selectedClipId)}
                                        disabled={!selectedClipId || clips.length <= 1}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                        🗑 Eliminar
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Zoom</span>
                                    <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-xs font-bold">−</button>
                                    <span className="text-[10px] font-mono text-zinc-400 min-w-[40px] text-center">{zoom.toFixed(1)}x</span>
                                    <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-xs font-bold">+</button>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="overflow-x-auto custom-scrollbar" ref={timelineRef} onClick={handleTimelineClick}>
                                <div className="relative" style={{ width: `${timelinePixelWidth}px`, minWidth: '100%' }}>

                                    {/* Ruler */}
                                    <div className="h-7 border-b border-white/[0.04] relative bg-black/40 select-none">
                                        {getRulerMarks().map((m, i) => (
                                            <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${(m.time / duration) * 100}%` }}>
                                                <div className={`w-px ${m.major ? 'h-4 bg-zinc-600' : 'h-2.5 bg-zinc-800'}`} />
                                                {m.major && <span className="text-[8px] font-mono text-zinc-600 mt-0.5 whitespace-nowrap">{m.label}</span>}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Video Track Label */}
                                    <div className="flex">
                                        <div className="w-16 flex-shrink-0 flex items-center justify-end pr-2 border-r border-white/[0.04] bg-black/20">
                                            <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600 rotate-0">VID</span>
                                        </div>
                                        {/* Video Track */}
                                        <div className="flex-1 h-16 relative bg-zinc-900/30">
                                            {clips.map((clip, i) => {
                                                const left = (clip.startTime / duration) * 100;
                                                const width = ((clip.endTime - clip.startTime) / duration) * 100;
                                                const isSelected = selectedClipId === clip.id;
                                                return (
                                                    <div key={clip.id} draggable onClick={e => { e.stopPropagation(); setSelectedClipId(clip.id); }}
                                                        className={`absolute top-2 bottom-2 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all group bg-gradient-to-r ${clip.color} ${isSelected ? CLIP_BORDERS[i % CLIP_BORDERS.length] : 'border-white/[0.08] hover:border-white/20'}`}
                                                        style={{ left: `${left}%`, width: `${width}%`, minWidth: '30px' }}>
                                                        {/* Trim Left */}
                                                        <div onMouseDown={e => handleTrimStart(e, clip.id, 'start')} className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize group/h hover:bg-white/10 rounded-l-xl flex items-center justify-center">
                                                            <div className="w-0.5 h-5 bg-white/20 group-hover/h:bg-white/60 rounded-full transition-colors" />
                                                        </div>
                                                        <div className="absolute inset-x-4 top-0 bottom-0 flex items-center overflow-hidden">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">{clip.label}</span>
                                                            <span className="text-[8px] font-mono text-white/40 ml-2 whitespace-nowrap">{formatTime(clip.duration)}</span>
                                                        </div>
                                                        {/* Waveform decoration SVG */}
                                                        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1.5 h-6 w-[calc(100%-24px)] opacity-20 pointer-events-none">
                                                            {(() => {
                                                                const points = Math.max(8, Math.floor(width * 1.5));
                                                                let d = '';
                                                                for (let j = 0; j < points; j++) {
                                                                    const x = (j / Math.max(1, points - 1)) * 100;
                                                                    const h = 4 + Math.sin(j * 0.7) * 6 + (Math.abs(Math.sin(j * 13.37)) * 6);
                                                                    const y = 24 - h;
                                                                    d += `M ${x} 24 L ${x} ${y} `;
                                                                }
                                                                return <path d={d} fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />;
                                                            })()}
                                                        </svg>
                                                        {/* Trim Right */}
                                                        <div onMouseDown={e => handleTrimStart(e, clip.id, 'end')} className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize group/h hover:bg-white/10 rounded-r-xl flex items-center justify-center">
                                                            <div className="w-0.5 h-5 bg-white/20 group-hover/h:bg-white/60 rounded-full transition-colors" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Playhead line */}
                                            {duration > 0 && (
                                                <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
                                                    <div className="w-px h-full bg-primary/60" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overlay Tracks */}
                                    {[0, 1, 2].map(trackIdx => {
                                        const trackOverlays = overlays.filter((_, i) => i % 3 === trackIdx);
                                        return (
                                            <div key={trackIdx} className="flex border-t border-white/[0.03]">
                                                <div className="w-16 flex-shrink-0 flex items-center justify-end pr-2 border-r border-white/[0.04] bg-black/20">
                                                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-700">OVL {trackIdx + 1}</span>
                                                </div>
                                                <div className="flex-1 h-10 relative bg-black/20">
                                                    {trackOverlays.map(o => {
                                                        const left = (o.startTime / duration) * 100;
                                                        const width = ((o.endTime - o.startTime) / duration) * 100;
                                                        const isSelOv = selectedOverlayId === o.id;
                                                        return (
                                                            <div key={o.id} onClick={e => { e.stopPropagation(); setSelectedOverlayId(o.id); setActivePanel('properties'); }}
                                                                className={`absolute top-1 bottom-1 rounded-lg border cursor-pointer transition-all ${OVERLAY_TRACK_COLORS[trackIdx]} ${isSelOv ? 'ring-1 ring-primary' : 'hover:brightness-125'}`}
                                                                style={{ left: `${left}%`, width: `${width}%`, minWidth: '20px' }}>
                                                                <div className="absolute inset-x-2 top-0 bottom-0 flex items-center overflow-hidden">
                                                                    <span className="text-[7px] font-bold text-white/70 truncate">{o.mediaName}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {duration > 0 && (
                                                        <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
                                                            <div className="w-px h-full bg-primary/40" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Playhead (global) */}
                                    {duration > 0 && (
                                        <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
                                            <div onMouseDown={handlePlayheadMouseDown} className="absolute -top-0 -translate-x-1/2 w-4 h-4 bg-primary rounded-b-sm pointer-events-auto cursor-grab active:cursor-grabbing shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                                            <div className="w-px h-full bg-primary shadow-[0_0_4px_rgba(220,38,38,0.4)]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all animate-fade ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' :
                    toast.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' :
                        'bg-zinc-800/90 border border-white/10 text-white'}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

export default function TimelineEditorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <TimelineEditorContent />
        </Suspense>
    );
}
