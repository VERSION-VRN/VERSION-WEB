'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import '../../globals.css';

// ─── Types ───
interface Clip {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    label: string;
    color: string;
}

// ─── Helpers ───
const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const CLIP_COLORS = [
    'from-red-500/40 to-red-600/20',
    'from-blue-500/40 to-blue-600/20',
    'from-emerald-500/40 to-emerald-600/20',
    'from-purple-500/40 to-purple-600/20',
    'from-amber-500/40 to-amber-600/20',
    'from-cyan-500/40 to-cyan-600/20',
    'from-pink-500/40 to-pink-600/20',
];

const CLIP_BORDER_COLORS = [
    'border-red-500/50',
    'border-blue-500/50',
    'border-emerald-500/50',
    'border-purple-500/50',
    'border-amber-500/50',
    'border-cyan-500/50',
    'border-pink-500/50',
];

// ─── Main Component ───
function TimelineEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoUrl = searchParams.get('video') || '';
    const targetLength = searchParams.get('length') || 'medium';
    const scriptStyle = searchParams.get('style') || 'Estándar';

    // ─── Refs ───
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);

    // ─── Video State ───
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [videoError, setVideoError] = useState('');

    // ─── Timeline State ───
    const [clips, setClips] = useState<Clip[]>([]);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [isDraggingClip, setIsDraggingClip] = useState(false);
    const [dragClipId, setDragClipId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // ─── Trim State ───
    const [isTrimming, setIsTrimming] = useState(false);
    const [trimHandle, setTrimHandle] = useState<'start' | 'end' | null>(null);
    const [trimClipId, setTrimClipId] = useState<string | null>(null);

    // ─── Export State ───
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState('');
    const [exportResult, setExportResult] = useState<string | null>(null);

    // ─── Toast ───
    const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);
    const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── API Helpers ───
    const getApiUrl = (path: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}${path}`;
    };

    const getSecurityHeaders = (isJson = true) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('version_user_token') : null;
        const headers: Record<string, string> = {
            'X-API-Key': process.env.NEXT_PUBLIC_API_SECRET_KEY || 'wolfmessi10',
            'bypass-tunnel-reminder': 'true',
        };
        if (isJson) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    };

    // ─── Initialize Video ───
    useEffect(() => {
        console.log("Initializing Timeline Editor with Video URL:", videoUrl);

        if (!videoUrl) {
            setVideoError('No se proporcionó una URL de video.');
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        try {
            let processedUrl = videoUrl;

            // MAGIC FIX: If we are on localhost and the video URL is a LocalTunnel URL,
            // try to use localhost:8000 directly to bypass tunnel interstitials and CORS.
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                if (videoUrl.includes('.loca.lt')) {
                    console.log("🚀 Redirigiendo LocalTunnel a localhost:8000 para evitar bloqueos...");
                    const path = videoUrl.split('.loca.lt')[1];
                    processedUrl = `http://localhost:8000${path}`;
                }
            }

            console.log("Loading video from:", processedUrl);
            video.src = processedUrl;
            video.load();
        } catch (e) {
            console.error("Error setting video source:", e);
            setVideoError("Error al procesar la URL del video.");
            return;
        }

        const onLoadedMetadata = () => {
            console.log("Video metadata loaded. Duration:", video.duration);
            if (isNaN(video.duration) || video.duration === Infinity) {
                setVideoError("Duración de video inválida.");
                return;
            }
            setDuration(video.duration);
            setIsVideoLoaded(true);
            // Create initial clip spanning entire video
            setClips([{
                id: generateId(),
                startTime: 0,
                endTime: video.duration,
                duration: video.duration,
                label: 'Clip 1',
                color: CLIP_COLORS[0],
            }]);
        };

        const onVideoError = () => {
            const error = video.error;
            let msg = "Error al cargar el video. Verifica la URL.";
            if (error) {
                console.error("Video Error Code:", error.code, "Message:", error.message);
                if (error.code === 4) msg = "El formato de video no es compatible o el archivo no se encontró.";
                if (error.code === 3) msg = "Error al decodificar el video.";
            }
            setVideoError(msg);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onVideoError);
        return () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onVideoError);
        };
    }, [videoUrl]);

    // ─── Playback Sync ───
    const syncPlayhead = useCallback(() => {
        const video = videoRef.current;
        if (video && !isDraggingPlayhead) {
            setCurrentTime(video.currentTime);
        }
        animFrameRef.current = requestAnimationFrame(syncPlayhead);
    }, [isDraggingPlayhead]);

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(syncPlayhead);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [syncPlayhead]);

    // ─── Playback Controls ───
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const seekTo = (time: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(time, duration));
        setCurrentTime(video.currentTime);
    };

    const handleVolumeChange = (v: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = v;
        setVolume(v);
        setIsMuted(v === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const changeSpeed = (rate: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = rate;
        setPlaybackRate(rate);
    };

    // ─── Timeline Clicks ───
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingClip || isTrimming) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const totalWidth = rect.width;
        const time = (x / totalWidth) * duration;
        seekTo(time);
    };

    // ─── Playhead Drag ───
    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);

        const handleMouseMove = (ev: MouseEvent) => {
            const timeline = timelineRef.current;
            if (!timeline) return;
            const rect = timeline.getBoundingClientRect();
            const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
            const time = (x / rect.width) * duration;
            seekTo(time);
        };

        const handleMouseUp = () => {
            setIsDraggingPlayhead(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // ─── Trim Handles ───
    const handleTrimStart = (e: React.MouseEvent, clipId: string, handle: 'start' | 'end') => {
        e.stopPropagation();
        setIsTrimming(true);
        setTrimHandle(handle);
        setTrimClipId(clipId);

        const handleMouseMove = (ev: MouseEvent) => {
            const timeline = timelineRef.current;
            if (!timeline) return;
            const rect = timeline.getBoundingClientRect();
            const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
            const time = (x / rect.width) * duration;

            setClips(prev => prev.map(c => {
                if (c.id !== clipId) return c;
                if (handle === 'start') {
                    const newStart = Math.max(0, Math.min(time, c.endTime - 0.5));
                    return { ...c, startTime: newStart, duration: c.endTime - newStart };
                } else {
                    const newEnd = Math.max(c.startTime + 0.5, Math.min(time, duration));
                    return { ...c, endTime: newEnd, duration: newEnd - c.startTime };
                }
            }));
        };

        const handleMouseUp = () => {
            setIsTrimming(false);
            setTrimHandle(null);
            setTrimClipId(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // ─── Split ───
    const handleSplit = () => {
        try {
            if (clips.length === 0) return;

            // Find which clip the playhead is in
            const targetClip = clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
            if (!targetClip) {
                showToast('Posiciona el playhead dentro de un clip para dividir.', 'error');
                return;
            }

            if (currentTime - targetClip.startTime < 0.5 || targetClip.endTime - currentTime < 0.5) {
                showToast('El punto de corte está muy cerca del borde del clip.', 'error');
                return;
            }

            const colorIdx = (clips.length) % CLIP_COLORS.length;
            const newClip1: Clip = {
                ...targetClip,
                endTime: currentTime,
                duration: currentTime - targetClip.startTime,
            };
            const newClip2: Clip = {
                id: generateId(),
                startTime: currentTime,
                endTime: targetClip.endTime,
                duration: targetClip.endTime - currentTime,
                label: `Clip ${clips.length + 1}`,
                color: CLIP_COLORS[colorIdx],
            };

            setClips(prev => {
                const idx = prev.findIndex(c => c.id === targetClip.id);
                const newClips = [...prev];
                newClips.splice(idx, 1, newClip1, newClip2);
                return newClips;
            });
            showToast('Clip dividido correctamente', 'success');
        } catch (e) {
            console.error("Error splitting clip:", e);
            showToast("Error al dividir el clip.", "error");
        }
    };

    // ─── Delete Clip ───
    const handleDeleteClip = (clipId: string) => {
        if (clips.length <= 1) {
            showToast('Debe haber al menos un clip.', 'error');
            return;
        }
        setClips(prev => prev.filter(c => c.id !== clipId));
        if (selectedClipId === clipId) setSelectedClipId(null);
        showToast('Clip eliminado', 'info');
    };

    // ─── Drag & Drop Reorder ───
    const handleDragStart = (clipId: string) => {
        setIsDraggingClip(true);
        setDragClipId(clipId);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (!dragClipId) return;

        setClips(prev => {
            const dragIdx = prev.findIndex(c => c.id === dragClipId);
            if (dragIdx === -1) return prev;
            const newClips = [...prev];
            const [moved] = newClips.splice(dragIdx, 1);
            newClips.splice(dropIndex, 0, moved);
            return newClips;
        });

        setIsDraggingClip(false);
        setDragClipId(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setIsDraggingClip(false);
        setDragClipId(null);
        setDragOverIndex(null);
    };

    // ─── Zoom ───
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

    // ─── Export ───
    const handleExport = async () => {
        if (clips.length === 0) return;
        setIsExporting(true);
        setExportProgress(0);
        setExportMessage('Preparando exportación...');

        try {
            // If there's only one clip and it covers the full duration, just download original
            if (clips.length === 1 && clips[0].startTime === 0 && Math.abs(clips[0].endTime - duration) < 0.1) {
                setExportResult(decodeURIComponent(videoUrl));
                setExportMessage('¡Listo! No hay cambios en el video.');
                setExportProgress(100);
                setIsExporting(false);
                return;
            }

            setExportMessage('Recortando clips...');
            setExportProgress(10);

            // Step 1: Trim each clip
            const trimmedPaths: string[] = [];
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i];
                setExportMessage(`Recortando clip ${i + 1}/${clips.length}...`);
                setExportProgress(10 + Math.round((i / clips.length) * 50));

                const res = await fetch(getApiUrl('/trim-video'), {
                    method: 'POST',
                    headers: getSecurityHeaders(),
                    body: JSON.stringify({
                        video_url: decodeURIComponent(videoUrl),
                        start_time: clip.startTime,
                        end_time: clip.endTime,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Error al recortar clip');
                trimmedPaths.push(data.trimmed_path);
            }

            // Step 2: Merge all clips
            setExportMessage('Uniendo clips...');
            setExportProgress(70);

            const mergeRes = await fetch(getApiUrl('/merge-clips'), {
                method: 'POST',
                headers: getSecurityHeaders(),
                body: JSON.stringify({ clips: trimmedPaths }),
            });
            const mergeData = await mergeRes.json();
            if (!mergeData.success) throw new Error(mergeData.error || 'Error al unir clips');

            setExportProgress(100);
            setExportMessage('¡Exportación completa!');
            setExportResult(getApiUrl(mergeData.download_url));
            showToast('¡Video exportado exitosamente!', 'success');
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
            setExportMessage('Error en la exportación');
        } finally {
            setIsExporting(false);
        }
    };

    // ─── Keyboard Shortcuts ───
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 's':
                case 'S':
                    if (!e.ctrlKey && !e.metaKey) handleSplit();
                    break;
                case 'Delete':
                case 'Backspace':
                    if (selectedClipId) handleDeleteClip(selectedClipId);
                    break;
                case 'ArrowLeft':
                    seekTo(currentTime - (e.shiftKey ? 5 : 1));
                    break;
                case 'ArrowRight':
                    seekTo(currentTime + (e.shiftKey ? 5 : 1));
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentTime, selectedClipId, duration, isPlaying, clips.length, handleSplit, seekTo, togglePlay]); // Added dependencies

    // ─── Timeline Width ───
    const timelinePixelWidth = Math.max(600, duration * 80 * zoom);

    // ─── Ruler Marks ───
    const getRulerMarks = () => {
        const marks: { time: number; label: string; isMajor: boolean }[] = [];
        if (duration === 0) return marks;

        let interval = 1;
        if (duration / zoom > 120) interval = 10;
        else if (duration / zoom > 60) interval = 5;
        else if (duration / zoom > 20) interval = 2;

        for (let t = 0; t <= duration; t += interval) {
            marks.push({ time: t, label: formatTime(t), isMajor: t % (interval * 5) === 0 || interval >= 5 });
        }
        return marks;
    };

    // ─── Selected Clip Info ───
    const selectedClip = clips.find(c => c.id === selectedClipId);

    // ─── Total edited duration ───
    const totalEditedDuration = clips.reduce((acc, c) => acc + c.duration, 0);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 flex flex-col">
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="text-sm font-black tracking-tight uppercase hover:text-primary transition-colors">
                            ← <span className="text-zinc-500">VERSION</span><span className="text-primary">.ED</span>
                        </Link>
                        <div className="w-px h-5 bg-white/[0.08]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timeline Editor</span>
                        <div className="hidden md:flex items-center gap-2 ml-2">
                            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-black uppercase text-primary tracking-tighter">
                                {targetLength}
                            </div>
                            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase text-zinc-400 tracking-tighter">
                                {scriptStyle}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Duration Badge */}
                        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Duración</span>
                            <span className="text-xs font-mono font-bold text-white">{formatTime(totalEditedDuration)}</span>
                        </div>

                        {exportResult ? (
                            <a href={exportResult} download className="btn-primary !py-2.5 !px-6 !text-[10px]">
                                ⬇ Descargar
                            </a>
                        ) : (
                            <button
                                onClick={handleExport}
                                disabled={isExporting || clips.length === 0}
                                className={`btn-primary !py-2.5 !px-6 !text-[10px] ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isExporting ? 'Exportando...' : '⚡ Exportar'}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Main Layout ─── */}
            <div className="flex-1 flex flex-col pt-14">
                {videoError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center animate-fade">
                            <div className="text-6xl mb-6">⚠️</div>
                            <h2 className="text-xl font-black mb-2">Error al cargar video</h2>
                            <p className="text-zinc-500 text-sm mb-6">{videoError}</p>
                            <Link href="/editor" className="btn-primary !py-3 !px-8">← Volver al Editor</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ─── Top Section: Video Preview + Properties ─── */}
                        <div className="flex-1 flex min-h-0">
                            {/* ─── Video Preview ─── */}
                            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950/50">
                                <div className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_8px_60px_rgba(0,0,0,0.6)]">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-contain"
                                        onEnded={() => setIsPlaying(false)}
                                        preload="metadata"
                                    />

                                    {!isVideoLoaded && !videoError && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* ─── Video Controls ─── */}
                                {isVideoLoaded && (
                                    <div className="w-full max-w-3xl mt-4 flex items-center gap-4 animate-fade">
                                        {/* Play / Pause */}
                                        <button onClick={togglePlay}
                                            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                                            {isPlaying ? '⏸' : '▶'}
                                        </button>

                                        {/* Time */}
                                        <div className="text-xs font-mono text-zinc-400 min-w-[120px]">
                                            <span className="text-white font-bold">{formatTime(currentTime)}</span>
                                            <span className="text-zinc-600 mx-1">/</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>

                                        {/* Speed */}
                                        <div className="flex items-center gap-1">
                                            {[0.5, 1, 1.5, 2].map(rate => (
                                                <button key={rate} onClick={() => changeSpeed(rate)}
                                                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${playbackRate === rate
                                                        ? 'bg-white text-black'
                                                        : 'text-zinc-600 hover:text-white hover:bg-white/[0.05]'
                                                        }`}>
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-1" />

                                        {/* Volume */}
                                        <div className="flex items-center gap-2">
                                            <button onClick={toggleMute}
                                                className="text-zinc-500 hover:text-white transition-colors text-sm">
                                                {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                                            </button>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={isMuted ? 0 : volume}
                                                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                                                className="w-20 accent-primary h-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ─── Properties Panel ─── */}
                            <div className="w-80 border-l border-white/[0.04] bg-zinc-950/80 flex flex-col">
                                {/* Clip Info */}
                                <div className="p-5 border-b border-white/[0.04]">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
                                        {selectedClip ? 'Propiedades del Clip' : 'Información'}
                                    </h3>

                                    {selectedClip ? (
                                        <div className="space-y-4 animate-fade">
                                            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Nombre</label>
                                                <p className="text-sm font-bold">{selectedClip.label}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Inicio</label>
                                                    <p className="text-xs font-mono font-bold text-emerald-400">{formatTime(selectedClip.startTime)}</p>
                                                </div>
                                                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Fin</label>
                                                    <p className="text-xs font-mono font-bold text-red-400">{formatTime(selectedClip.endTime)}</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Duración</label>
                                                <p className="text-sm font-mono font-bold">{formatTime(selectedClip.duration)}</p>
                                            </div>
                                            <button onClick={() => handleDeleteClip(selectedClip.id)}
                                                className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/15 rounded-xl hover:bg-red-500/10 transition-all">
                                                🗑 Eliminar Clip
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-zinc-600 text-xs">Selecciona un clip en la línea de tiempo</p>
                                        </div>
                                    )}
                                </div>

                                {/* Clips List */}
                                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                                        Clips ({clips.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {clips.map((clip, i) => (
                                            <button
                                                key={clip.id}
                                                onClick={() => {
                                                    setSelectedClipId(clip.id);
                                                    seekTo(clip.startTime);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedClipId === clip.id
                                                    ? 'bg-primary/5 border-primary/25'
                                                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${clip.color}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider flex-1">{clip.label}</span>
                                                    <span className="text-[9px] font-mono text-zinc-500">{formatTime(clip.duration)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Shortcuts */}
                                <div className="p-4 border-t border-white/[0.04]">
                                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Atajos</h3>
                                    <div className="grid grid-cols-2 gap-1 text-[8px] text-zinc-600">
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">Space</kbd> Play</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">S</kbd> Split</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">←→</kbd> Seek</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">Del</kbd> Borrar</span>
                                        <span><kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded text-zinc-400 font-mono">+/-</kbd> Zoom</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── Export Progress Bar ─── */}
                        {isExporting && (
                            <div className="px-6 py-3 bg-zinc-900/80 border-t border-white/[0.04]">
                                <div className="max-w-[1600px] mx-auto flex items-center gap-4">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <div className="flex-1">
                                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                                                style={{ width: `${exportProgress}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 min-w-[200px]">{exportMessage}</span>
                                    <span className="text-xs font-mono font-bold text-primary">{exportProgress}%</span>
                                </div>
                            </div>
                        )}

                        {/* ─── Bottom Section: Timeline ─── */}
                        <div className="border-t border-white/[0.04] bg-zinc-950">
                            {/* ─── Toolbar ─── */}
                            <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04] bg-black/50">
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSplit}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                                        title="Split (S)">
                                        ✂️ Split
                                    </button>
                                    <button
                                        onClick={() => selectedClipId && handleDeleteClip(selectedClipId)}
                                        disabled={!selectedClipId || clips.length <= 1}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Delete (Del)">
                                        🗑 Eliminar
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mr-1">Zoom</span>
                                    <button onClick={handleZoomOut}
                                        className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-xs font-bold">
                                        −
                                    </button>
                                    <span className="text-[10px] font-mono text-zinc-400 min-w-[40px] text-center">{zoom.toFixed(1)}x</span>
                                    <button onClick={handleZoomIn}
                                        className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-xs font-bold">
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* ─── Timeline Area ─── */}
                            <div className="h-[200px] overflow-x-auto overflow-y-hidden custom-scrollbar"
                                ref={timelineRef}
                                onClick={handleTimelineClick}>

                                <div className="relative h-full" style={{ width: `${timelinePixelWidth}px`, minWidth: '100%' }}>
                                    {/* ─── Ruler ─── */}
                                    <div className="h-7 border-b border-white/[0.04] relative bg-black/40 select-none">
                                        {getRulerMarks().map((mark, i) => {
                                            const left = (mark.time / duration) * 100;
                                            return (
                                                <div key={i} className="absolute top-0 flex flex-col items-center"
                                                    style={{ left: `${left}%` }}>
                                                    <div className={`w-px ${mark.isMajor ? 'h-4 bg-zinc-600' : 'h-2.5 bg-zinc-800'}`} />
                                                    {mark.isMajor && (
                                                        <span className="text-[8px] font-mono text-zinc-600 mt-0.5 whitespace-nowrap">{mark.label}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ─── Track ─── */}
                                    <div className="absolute top-7 left-0 right-0 bottom-0 bg-zinc-900/30">
                                        {/* Track Label */}
                                        <div className="absolute left-0 top-0 bottom-0 w-0 z-10">
                                            {/* Vertical line left border */}
                                        </div>

                                        {/* ─── Clips ─── */}
                                        {clips.map((clip, i) => {
                                            const left = (clip.startTime / duration) * 100;
                                            const width = ((clip.endTime - clip.startTime) / duration) * 100;
                                            const isSelected = selectedClipId === clip.id;
                                            const isDragOver = dragOverIndex === i;
                                            const borderColor = CLIP_BORDER_COLORS[i % CLIP_BORDER_COLORS.length];

                                            return (
                                                <div
                                                    key={clip.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(clip.id)}
                                                    onDragOver={(e) => handleDragOver(e, i)}
                                                    onDrop={(e) => handleDrop(e, i)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }}
                                                    className={`absolute top-3 bottom-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all group
                                                        bg-gradient-to-r ${clip.color}
                                                        ${isSelected ? `${borderColor} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-white/[0.08] hover:border-white/20'}
                                                        ${isDragOver ? 'ring-2 ring-primary/40' : ''}
                                                    `}
                                                    style={{
                                                        left: `${left}%`,
                                                        width: `${width}%`,
                                                        minWidth: '30px',
                                                    }}
                                                >
                                                    {/* Trim Handle Left */}
                                                    <div
                                                        onMouseDown={(e) => handleTrimStart(e, clip.id, 'start')}
                                                        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize group/handle hover:bg-white/10 rounded-l-xl flex items-center justify-center"
                                                    >
                                                        <div className="w-0.5 h-6 bg-white/20 group-hover/handle:bg-white/60 rounded-full transition-colors" />
                                                    </div>

                                                    {/* Clip Content */}
                                                    <div className="absolute inset-x-4 top-0 bottom-0 flex items-center overflow-hidden">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">{clip.label}</span>
                                                            <span className="text-[8px] font-mono text-white/40 whitespace-nowrap">{formatTime(clip.duration)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Trim Handle Right */}
                                                    <div
                                                        onMouseDown={(e) => handleTrimStart(e, clip.id, 'end')}
                                                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize group/handle hover:bg-white/10 rounded-r-xl flex items-center justify-center"
                                                    >
                                                        <div className="w-0.5 h-6 bg-white/20 group-hover/handle:bg-white/60 rounded-full transition-colors" />
                                                    </div>

                                                    {/* Waveform decoration (visual only) */}
                                                    <div className="absolute inset-x-3 bottom-2 flex items-end gap-px opacity-20 pointer-events-none">
                                                        {Array.from({ length: Math.max(10, Math.floor(width * 2)) }).map((_, j) => (
                                                            <div key={j} className="flex-1 bg-white rounded-full"
                                                                style={{ height: `${4 + Math.random() * 16}px` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ─── Playhead ─── */}
                                    {duration > 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 z-30 pointer-events-none"
                                            style={{ left: `${(currentTime / duration) * 100}%` }}
                                        >
                                            {/* Head Triangle */}
                                            <div
                                                className="absolute -top-0 -translate-x-1/2 w-4 h-4 bg-primary rounded-b-sm pointer-events-auto cursor-grab active:cursor-grabbing shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"
                                                onMouseDown={handlePlayheadMouseDown}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                                            />
                                            {/* Vertical Line */}
                                            <div className="absolute top-4 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ─── Toast ─── */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] border animate-fade-scale text-sm font-bold
                    ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-white/[0.06] border-white/[0.08] text-white'
                    }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

// ─── Suspense Wrapper (Required by Next.js for useSearchParams) ───
export default function TimelineEditor() {
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
