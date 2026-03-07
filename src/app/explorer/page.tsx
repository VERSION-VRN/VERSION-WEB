'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getApiUrl } from '@/lib/api';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface YoutubeResult {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    viewCount: string | number;
    viewsPerHour?: number;
    rawViews?: number;
    publishedTime: string;
    channelName: string;
}

interface Channel {
    id: string;
    name: string;
    logo_url?: string;
    upcoming_videos: any[];
}

export default function ExplorerPage() {
    const { user, deductCredits } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<YoutubeResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<YoutubeResult | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Configuración de Costos
    const COST = 2;

    // Filtros
    const [uploadDate, setUploadDate] = useState('all');
    const [duration, setDuration] = useState('all');
    const [relevanceLanguage, setRelevanceLanguage] = useState('all');

    // Cargar canales del usuario al montar
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const data = await apiFetch<Channel[]>('/channels');
                if (data) setChannels(data);
            } catch (err) {
                console.error("Error fetching channels:", err);
            }
        };
        fetchChannels();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        // Validación de créditos antes de buscar
        if (!user || user.credits < COST) {
            alert(`❌ Saldo insuficiente. Cada búsqueda en Explorer consume ${COST} tokens.`);
            return;
        }

        setIsLoading(true);
        try {
            const langParam = relevanceLanguage !== 'all' ? relevanceLanguage : undefined;
            const data = await apiFetch<{ success: boolean, results: YoutubeResult[], translated_keywords?: string }>('/youtube/search', {
                method: 'POST',
                body: JSON.stringify({
                    keywords: query,
                    upload_date: uploadDate,
                    duration: duration,
                    relevance_language: langParam,
                    auto_translate: !!langParam
                })
            });

            if (data.success) {
                setResults(data.results);
                // Actualizar créditos localmente tras búsqueda exitosa
                if (typeof deductCredits === 'function') {
                    deductCredits(COST);
                }
            }
        } catch (error: any) {
            console.error("Search error:", error);
            if (error.status === 402) {
                alert("❌ Saldo insuficiente. Recarga tokens para seguir usando Explorer.");
            } else {
                alert("Error al realizar la búsqueda. Verifica la conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = (video: YoutubeResult) => {
        setSelectedVideo(video);
        setShowChannelModal(true);
    };

    const confirmAddToChannel = async (channelId: string) => {
        if (!selectedVideo) return;
        setIsAdding(true);
        try {
            const channel = channels.find(c => c.id === channelId);
            if (!channel) return;

            // Crear nuevo video a agregar con ID único para evitar sobreescritura
            const newVideo = {
                id: `yt_${Date.now()}`,
                titulo: selectedVideo.title,
                url: selectedVideo.url,
                miniatura: selectedVideo.thumbnail,
                idioma: 'Español' // Default
            };

            // Concatenar el nuevo video a la lista existente (no sobreescribir)
            const updatedVideos = [
                ...(channel.upcoming_videos || []),
                newVideo
            ];

            // El backend retorna el canal actualizado, no {success: boolean}
            const updatedChannel = await apiFetch<Record<string, unknown>>('/channels', {
                method: 'POST',
                body: JSON.stringify({
                    id: channelId,
                    name: channel.name,
                    upcoming_videos: updatedVideos
                })
            });

            // Cerrar modal SIEMPRE que la petición sea exitosa (no lanzó excepción)
            setShowChannelModal(false);
            setSelectedVideo(null);
            // Actualizar estado local de canales
            setChannels(prev => prev.map(c => c.id === channelId ? { ...c, upcoming_videos: updatedVideos } : c));
            // Toast de éxito discreto (sin alert bloqueante)
            console.log(`✅ Video "${selectedVideo.title}" agregado a ${channel.name}`);
        } catch (error) {
            console.error("Error adding to channel:", error);
            alert("❌ Error al agregar el video al canal.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="min-h-screen p-8 md:p-12 pb-32 lg:pb-12" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <header className="max-w-6xl mx-auto mb-16">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                        <span className="text-xl">←</span>
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                            VERSION <span className="text-primary">EXPLORER</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm mt-1 uppercase tracking-widest">
                            Inteligencia Competitiva & Búsqueda Avanzada
                        </p>
                    </div>
                </div>

                <EliteCard variant="glass" className="p-6 md:p-10 !rounded-[2.5rem]">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="relative group">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Escribe palabras clave (ej: carl jung, estoicismo, productividad...)"
                                className="w-full bg-black/40 border-2 border-white/5 focus:border-primary/50 rounded-2xl px-8 py-5 text-lg font-bold transition-all outline-none placeholder:text-zinc-700"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                <EliteButton
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    className="!rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'BUSCANDO...' : (
                                        <>
                                            BUSCAR
                                            <span className="px-1.5 py-0.5 bg-black/30 rounded text-[9px] border border-white/10">
                                                ⚡ {COST}
                                            </span>
                                        </>
                                    )}
                                </EliteButton>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[150px] space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">📅 Fecha</label>
                                <select
                                    value={uploadDate}
                                    onChange={(e) => setUploadDate(e.target.value)}
                                    className="w-full rounded-2xl px-4 py-4 text-xs font-bold transition-all outline-none focus:border-primary/50 appearance-none border border-white/10"
                                    style={{ backgroundColor: '#111', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    <option value="all" style={{ background: '#111', color: '#fff' }}>Todo el tiempo</option>
                                    <option value="this_month" style={{ background: '#111', color: '#fff' }}>Este mes</option>
                                    <option value="this_week" style={{ background: '#111', color: '#fff' }}>Esta semana</option>
                                    <option value="today" style={{ background: '#111', color: '#fff' }}>Hoy</option>
                                    <option value="this_year" style={{ background: '#111', color: '#fff' }}>Este año</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[150px] space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">⏱️ Duración</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full rounded-2xl px-4 py-4 text-xs font-bold transition-all outline-none focus:border-primary/50 appearance-none border border-white/10"
                                    style={{ backgroundColor: '#111', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    <option value="all" style={{ background: '#111', color: '#fff' }}>Cualquier duración</option>
                                    <option value="short" style={{ background: '#111', color: '#fff' }}>Corto (&lt; 4 min)</option>
                                    <option value="medium" style={{ background: '#111', color: '#fff' }}>Medio (4 - 20 min)</option>
                                    <option value="long" style={{ background: '#111', color: '#fff' }}>Largo (&gt; 20 min)</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[150px] space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">🌐 Idioma</label>
                                <select
                                    value={relevanceLanguage}
                                    onChange={(e) => setRelevanceLanguage(e.target.value)}
                                    className="w-full rounded-2xl px-4 py-4 text-xs font-bold transition-all outline-none focus:border-primary/50 appearance-none border border-white/10"
                                    style={{ backgroundColor: '#111', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    <option value="all" style={{ background: '#111', color: '#fff' }}>Cualquier idioma</option>
                                    <option value="es" style={{ background: '#111', color: '#fff' }}>Español</option>
                                    <option value="en" style={{ background: '#111', color: '#fff' }}>Inglés</option>
                                    <option value="pt" style={{ background: '#111', color: '#fff' }}>Portugués</option>
                                    <option value="fr" style={{ background: '#111', color: '#fff' }}>Francés</option>
                                    <option value="ru" style={{ background: '#111', color: '#fff' }}>Ruso</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </EliteCard>
            </header>

            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Sincronizando con YouTube...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {results.map((video) => (
                            <EliteCard key={video.id} variant="glass" className="group !p-3 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 animate-fade border-white/5 hover:border-primary/20">
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 mb-4 shadow-inner">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-6 backdrop-blur-[2px]">
                                        <EliteButton
                                            variant="primary"
                                            size="md"
                                            fullWidth
                                            onClick={() => handleAddToCart(video)}
                                            className="font-black !rounded-2xl scale-90 group-hover:scale-100 transition-transform duration-300"
                                        >
                                            AGREGAR A MI CANAL
                                        </EliteButton>
                                    </div>
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        {video.viewsPerHour && video.viewsPerHour > 500 && (
                                            <div className="bg-primary px-3 py-1 rounded-full text-[9px] font-black text-black animate-pulse shadow-lg shadow-primary/30">
                                                🔥 x100
                                            </div>
                                        )}
                                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter shadow-xl">
                                            {video.viewsPerHour?.toLocaleString()} VPH
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold border border-white/5">
                                        {video.duration}
                                    </div>
                                </div>

                                <div className="px-1 py-1">
                                    <h3 className="font-bold text-xs uppercase leading-snug line-clamp-2 mb-3 h-8 group-hover:text-primary transition-colors tracking-tight">
                                        {video.title}
                                    </h3>

                                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[8px]">YT</div>
                                            <span className="truncate">{video.channelName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                                            <span>👁️ {video.viewCount} VISTAS</span>
                                            <span className="text-zinc-700">{video.publishedTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </EliteCard>
                        ))}
                    </div>
                ) : query && !isLoading ? (
                    <div className="text-center py-40">
                        <span className="text-6xl mb-6 block">🔎</span>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">No se encontraron resultados</h3>
                        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Intenta con otras palabras clave o desactiva los filtros.</p>
                    </div>
                ) : (
                    <div className="text-center py-40 opacity-20 grayscale">
                        <span className="text-7xl mb-8 block">🔍</span>
                        <h3 className="text-2xl font-black uppercase tracking-widest">Inicia una Búsqueda</h3>
                    </div>
                )}
            </main>

            {/* Modal de Selección de Canal */}
            {showChannelModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade">
                    <EliteCard variant="glass" className="w-full max-md p-8 !rounded-[2.5rem] border-white/10 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Agregar a mi Canal</h2>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Selecciona el destino</p>
                            </div>
                            <button onClick={() => setShowChannelModal(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {channels.length > 0 ? channels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => confirmAddToChannel(channel.id)}
                                    disabled={isAdding}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/10">
                                        {channel.logo_url ? (
                                            <img src={getApiUrl(channel.logo_url)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm uppercase group-hover:text-primary transition-colors">{channel.name}</h3>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">
                                            {channel.upcoming_videos?.length || 0} Videos en cola
                                        </p>
                                    </div>
                                    <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </button>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-zinc-500 text-xs font-bold uppercase mb-4">No tienes canales creados</p>
                                    <EliteButton variant="outline" size="sm" onClick={() => router.push('/dashboard/channels')}>
                                        CREAR MI PRIMER CANAL
                                    </EliteButton>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <EliteButton variant="outline" fullWidth onClick={() => setShowChannelModal(false)}>
                                CANCELAR
                            </EliteButton>
                        </div>
                    </EliteCard>
                </div>
            )}
        </div>
    );
}
