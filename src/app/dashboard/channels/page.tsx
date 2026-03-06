'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';

interface Channel {
    id: string;
    name: string;
    logo_url?: string;
    banner_url?: string;
    upcoming_videos: string[];
}

export default function ChannelsPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newChannel, setNewChannel] = useState({
        name: '',
        logo_url: '',
        banner_url: '',
        upcoming_videos: [] as string[]
    });

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const fetchChannels = async () => {
        try {
            const data = await apiFetch<Channel[]>('/channels');
            if (data) setChannels(data);
        } catch (err) {
            console.error("Error fetching channels:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchChannels();
    }, [user]);

    const handleSaveChannel = async () => {
        if (!newChannel.name) return;
        setIsSaving(true);
        try {
            await apiFetch('/channels', {
                method: 'POST',
                body: JSON.stringify(newChannel)
            });
            setShowAddModal(false);
            setNewChannel({ name: '', logo_url: '', banner_url: '', upcoming_videos: [] });
            fetchChannels();
        } catch (err) {
            console.error("Error saving channel:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteChannel = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este canal?')) return;
        try {
            await apiFetch(`/channels/${id}`, { method: 'DELETE' });
            fetchChannels();
        } catch (err) {
            console.error("Error deleting channel:", err);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen p-8 md:p-12 pb-32" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                <div>
                    <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mb-4 block">
                        ← Regresar al Dashboard
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                        MIS <span className="text-primary">CANALES</span>
                    </h1>
                    <p className="font-medium text-sm text-zinc-500 mt-2">
                        Gestiona tu flota de canales automatizados y próximos proyectos.
                    </p>
                </div>
                <EliteButton variant="primary" onClick={() => setShowAddModal(true)}>
                    + AÑADIR CANAL
                </EliteButton>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {channels.map((channel) => (
                    <EliteCard key={channel.id} variant="glass" className="group overflow-hidden !p-0">
                        {/* Banner Preview */}
                        <div className="h-24 bg-zinc-900 overflow-hidden relative">
                            {channel.banner_url ? (
                                <img src={channel.banner_url} alt="Banner" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-primary/10 to-transparent" />
                            )}
                            {/* Logo Overlay */}
                            <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl border-4 border-black bg-zinc-800 overflow-hidden shadow-2xl">
                                {channel.logo_url ? (
                                    <img src={channel.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">📺</div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 pt-10">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight">{channel.name}</h3>
                                <button onClick={() => handleDeleteChannel(channel.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                    🗑️
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Próximos Videos</span>
                                    {channel.upcoming_videos.length > 0 ? (
                                        <ul className="space-y-1">
                                            {channel.upcoming_videos.map((vid, i) => (
                                                <li key={i} className="text-[11px] font-bold py-1.5 border-b border-white/5 flex items-center gap-2">
                                                    <span className="text-primary font-mono text-[9px]">{i + 1}.</span> {vid}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[10px] italic text-zinc-700">Sin videos en planificación</p>
                                    )}
                                </div>
                            </div>

                            <EliteButton variant="outline" size="md" className="w-full mt-6" onClick={() => router.push(`/editor?channel=${channel.name}`)}>
                                CREAR VIDEO PARA CANAL
                            </EliteButton>
                        </div>
                    </EliteCard>
                ))}

                {channels.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="text-6xl mb-4">📺</div>
                        <h2 className="text-xl font-black uppercase text-zinc-700">No tienes canales registrados</h2>
                        <p className="text-zinc-600 text-sm mt-2">Empieza creando tu primer canal para organizar tus producciones.</p>
                    </div>
                )}
            </div>

            {/* Modal de Adición (Simplificado para el ejemplo) */}
            {showAddModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <EliteCard variant="glass" className="w-full max-w-lg p-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Nuevo Canal</h2>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Nombre del Canal</label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all"
                                    placeholder="Ej. VERSION Shorts"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">URL del Logo (Opcional)</label>
                                <input
                                    type="text"
                                    value={newChannel.logo_url}
                                    onChange={e => setNewChannel({ ...newChannel, logo_url: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">URL del Banner (Opcional)</label>
                                <input
                                    type="text"
                                    value={newChannel.banner_url}
                                    onChange={e => setNewChannel({ ...newChannel, banner_url: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <EliteButton variant="outline" fullWidth onClick={() => setShowAddModal(false)}>CANCELAR</EliteButton>
                            <EliteButton variant="primary" fullWidth onClick={handleSaveChannel} disabled={isSaving}>
                                {isSaving ? 'GUARDANDO...' : 'GUARDAR CANAL'}
                            </EliteButton>
                        </div>
                    </EliteCard>
                </div>
            )}
        </div>
    );
}
