'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getApiUrl } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreditsBar } from '@/components/ui/CreditsBar';

const TASK_TYPE_META: Record<string, { icon: string, label: string }> = {
    'editor': { icon: '🎬', label: 'Editor' },
    'thumbnails': { icon: '🖼️', label: 'Diseño' },
    'writer': { icon: '📝', label: 'Writer' },
    'seo': { icon: '🚀', label: 'SEO' },
    'ai': { icon: '🤖', label: 'VERSION AI' }
};

// Navegación centralizada para evitar duplicados
const SIDEBAR_NAV = [
    { label: 'VISTA GENERAL', href: '/dashboard', icon: '📊' },
    { label: 'VERSION AI CHAT', href: '/ai', icon: '🤖' },
    { label: 'VERSION EDITOR', href: '/editor', icon: '🎬' },
    { label: 'THUMBNAILS', href: '/thumbnails', icon: '🖼️' },
    { label: 'SCRIPT WRITER', href: '/writer', icon: '📝' },
    { label: 'VERSION SEO', href: '/seo', icon: '🚀' },
    { label: 'MIS CANALES', href: '/dashboard/channels', icon: '📺' },
];

export default function DashboardPage() {
    const { user, isAdmin, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [history, setHistory] = useState<{ id: string, task_type: string, filename: string, created_at: string, status: string, result_url: string }[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!user && !isLoading) {
            router.push('/login');
        } else if (user) {
            setIsLoading(false);
        }
    }, [user, isLoading, router]);

    const fetchHistory = useCallback(async () => {
        const userId = user?.email || user?.id;
        if (!userId) {
            console.log("[Dashboard] No user ID available for history fetch");
            return;
        }

        try {
            console.log(`[Dashboard] Fetching history for: ${userId}`);
            // El backend ahora prioriza el token, pero enviamos el email completo por compatibilidad
            const data = await apiFetch<any[]>(`/all-videos?user_id=${encodeURIComponent(userId)}`);
            if (data) {
                console.log(`[Dashboard] History received: ${data.length} items`);
                setHistory(data);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user?.email, user?.id]);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user, fetchHistory]);

    const handleLogout = () => {
        logout();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('¿ESTÁS SEGURO DE ELIMINAR ESTE VIDEO Y SUS ARCHIVOS? ESTA ACCIÓN ES IRREVERSIBLE.')) return;

        try {
            const res = await apiFetch<any>(`/tasks/${taskId}`, { method: 'DELETE' });
            if (res?.success) {
                setHistory(prev => prev.filter(item => item.id !== taskId));
            } else {
                alert('Error al eliminar la tarea');
            }
        } catch (err) {
            console.error("Error deleting task:", err);
            alert('Error de conexión con el servidor');
        }
    };

    const userName = user?.name || user?.email || 'Usuario';

    if (isLoading) return <div className="min-h-screen" style={{ background: 'var(--background)' }} />;

    return (
        <div className="flex min-h-screen selection:bg-primary/30" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
                <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex justify-around items-center shadow-2xl">
                    {SIDEBAR_NAV.slice(0, 4).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-white'}`}>
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-[8px] font-bold uppercase mt-1 tracking-tighter">{item.label.split(' ')[0]}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="flex flex-col items-center p-2 text-zinc-500 hover:text-white"
                    >
                        <span className="text-lg">☰</span>
                        <span className="text-[8px] font-bold uppercase mt-1">Más</span>
                    </button>
                </div>
            </div>

            {/* Mobile Expandable Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                        <EliteCard variant="glass" className="overflow-hidden !p-2">
                            {SIDEBAR_NAV.map((item) => (
                                <Link key={item.href} href={item.href} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                                    <span className="text-xl">{item.icon}</span> {item.label}
                                </Link>
                            ))}
                            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all border-t border-white/5 mt-2">
                                <span>🚪</span> Cerrar Sesión
                            </button>
                        </EliteCard>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-[280px] hidden lg:flex flex-col border-r border-white/[0.04] p-8 fixed h-full bg-zinc-950/20 backdrop-blur-xl z-50">
                <Link href="/" className="text-xl font-black tracking-tighter uppercase mb-12 flex items-center gap-1 group">
                    <span className="group-hover:text-primary transition-colors">VERSION</span><span className="text-primary text-3xl">.</span>
                </Link>

                <nav className="flex flex-col gap-2">
                    <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-4 uppercase">Menú Principal</div>
                    {SIDEBAR_NAV.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3.5 text-xs font-bold transition-all rounded-xl border-l-2 ${isActive
                                    ? 'bg-white/[0.04] border-primary text-foreground'
                                    : 'border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                                    }`}
                            >
                                <span className={`opacity-70 transition-opacity ${isActive ? 'opacity-100' : ''}`}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/[0.04]">
                    <CreditsBar credits={user?.credits || 0} maxCredits={isAdmin ? 1000000 : 1000} label={isAdmin ? 'Infinite Access' : 'Tokens Disponibles'} />
                    <button onClick={handleLogout} className="w-full mt-8 p-3.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 border border-white/[0.04] hover:border-red-500/20 rounded-xl transition-all">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-[280px] p-8 md:p-12 pb-32 lg:pb-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                                HOLA, <span className="text-primary">{isAdmin ? 'ADMIN' : userName.split(' ')[0]}</span>
                            </h1>
                            {isAdmin && (
                                <span className="text-[10px] font-black bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                    Admin Mode
                                </span>
                            )}
                        </div>
                        <p className="font-medium text-sm" style={{ color: 'var(--muted)' }}>
                            {isAdmin ? 'Panel de control maestro activo. Ecosistema bajo control.' : 'Tu arsenal digital está listo para la acción.'}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 animate-fade">
                    <EliteCard variant="glass" className="flex justify-between items-center p-8 group hover:scale-[1.01]">
                        <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Tokens de Combate</span>
                            <div className="text-5xl font-black tabular-nums transition-transform group-hover:scale-110 origin-left duration-500">{isAdmin ? '∞' : user?.credits || 0}</div>
                        </div>
                        <EliteButton variant="outline" size="md" onClick={() => router.push('/pricing')}>
                            FONDOS
                        </EliteButton>
                    </EliteCard>

                    {/* SEO Widget */}
                    <EliteCard variant="glass" className="md:col-span-2 p-8 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em] mb-2 block">Últimas Estrategias SEO</span>
                                {history.filter(t => t.task_type === 'seo' && t.status === 'completed').slice(0, 1).map(seo => (
                                    <div key={seo.id} className="animate-fade-in">
                                        <h3 className="text-xl font-black uppercase tracking-tight truncate max-w-[250px] mb-2">{seo.filename}</h3>
                                        <div className="flex gap-2">
                                            <a href={seo.result_url} target="_blank" className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-lg font-black hover:bg-green-500/20 transition-all uppercase">Ver Plan Full</a>
                                            <button onClick={() => router.push(`/seo?q=${encodeURIComponent(seo.filename)}`)} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg font-black hover:bg-white/10 transition-all uppercase">Optimizar Más</button>
                                        </div>
                                    </div>
                                ))}
                                {history.filter(t => t.task_type === 'seo' && t.status === 'completed').length === 0 && (
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight opacity-20 mb-2 underline decoration-zinc-800">Sin Datos de Crecimiento</h3>
                                        <Link href="/seo" className="text-[10px] text-zinc-500 font-bold hover:text-white transition-colors uppercase tracking-widest">Iniciar Primera Auditoría →</Link>
                                    </div>
                                )}
                            </div>
                            <div className="text-4xl grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-125">🚀</div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 text-[120px] font-black text-white/[0.02] select-none pointer-events-none tracking-tighter">SEO</div>
                    </EliteCard>
                </div>

                {/* Grid de Aplicaciones */}
                <section className="mb-20 animate-fade" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                            Apps & Herramientas
                        </h2>
                        <Link href="/pricing" className="text-primary text-[10px] font-bold uppercase tracking-widest hover:text-primary/70 transition-all">Ver Planes Elite →</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* VERSION EDITOR */}
                        <EliteCard
                            variant="glass"
                            title="VERSION EDITOR"
                            subtitle="Pro Ready"
                            description="Automatización de clips de YouTube con IA y edición profesional integrada."
                            headerAction={<span className="text-3xl">🎬</span>}
                        >
                            <EliteButton variant="primary" size="md" fullWidth onClick={() => router.push('/editor')}>
                                Abrir Sistema
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION THUMBNAILS */}
                        <EliteCard
                            variant="glass"
                            title="THUMBNAILS"
                            subtitle="Visual Core"
                            description="Diseño de miniaturas y análisis CTR avanzado con redes neuronales."
                            headerAction={<span className="text-3xl">🖼️</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="hover:!bg-[#a855f7] hover:!text-white hover:!border-[#a855f7]" onClick={() => router.push('/thumbnails')}>
                                Diseñar Impacto
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION WRITER */}
                        <EliteCard
                            variant="glass"
                            title="WRITER"
                            subtitle="Script Engine"
                            description="Ingeniería de guiones virales con estructuras de alta retención."
                            headerAction={<span className="text-3xl">📝</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="hover:!bg-red-500 hover:!text-white hover:!border-red-500" onClick={() => router.push('/writer')}>
                                Iniciar Script
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION SEO */}
                        <EliteCard
                            variant="glass"
                            title="SEO GROWTH"
                            subtitle="Growth Engine"
                            description="Dominación de motores de búsqueda y análisis de competencia viral."
                            headerAction={<span className="text-3xl">🚀</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="hover:!bg-green-500 hover:!text-white hover:!border-green-500" onClick={() => router.push('/seo')}>
                                Optimizar Canal
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION AI */}
                        <EliteCard
                            variant="glass"
                            title="VERSION AI"
                            subtitle="Neural System"
                            description="Consultor estratégico 24/7 basado en el Master de YouTube."
                            headerAction={<span className="text-3xl">🤖</span>}
                        >
                            <EliteButton variant="secondary" size="md" fullWidth onClick={() => router.push('/ai')}>
                                Hablar con Oráculo
                            </EliteButton>
                        </EliteCard>

                        {/* MIS CANALES */}
                        <EliteCard
                            variant="glass"
                            title="MIS CANALES"
                            subtitle="Channel Manager"
                            description="Gestiona tu flota de canales, logos, banners y videos próximos en cola."
                            headerAction={<span className="text-3xl">📺</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="hover:!bg-blue-500 hover:!text-white hover:!border-blue-500" onClick={() => router.push('/dashboard/channels')}>
                                Gestionar Flota
                            </EliteButton>
                        </EliteCard>
                    </div>
                </section>

                {/* Historial Operativo */}
                <section className="animate-fade" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Historial Operativo</h2>
                        <span className="text-[10px] text-zinc-600 font-mono italic">Últimos despliegues</span>
                    </div>

                    <EliteCard variant="solid" className="overflow-hidden !p-0">
                        {isLoadingHistory ? (
                            <div className="p-20 text-center animate-pulse text-zinc-700 uppercase tracking-widest text-[10px] font-bold">
                                Sincronizando datos...
                            </div>
                        ) : history.length > 0 ? (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Origen / Herramienta</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Estado</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {history.map((item: { id: string, task_type: string, filename: string, created_at: string, status: string, result_url: string, thumbnail_url?: string }) => {

                                            const meta = TASK_TYPE_META[item.task_type] || { icon: '📦', label: 'Proceso' };
                                            return (
                                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">{meta.icon}</span>
                                                            <div>
                                                                <div className="text-[11px] font-black uppercase tracking-tight">{item.filename || 'Proceso sin nombre'}</div>
                                                                <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{meta.label} System • {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${item.status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                                                            item.status === 'failed' ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                                                                'border-amber-500/20 text-amber-500 bg-amber-500/5 animate-pulse'
                                                            }`}>
                                                            {item.status === 'completed' ? 'Sincronizado' :
                                                                item.status === 'failed' ? 'Error Crítico' :
                                                                    'En Proceso'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 text-[10px]">
                                                            {item.result_url && (
                                                                <a href={getApiUrl(item.result_url)} target="_blank" rel="noopener noreferrer" download className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-lg transition-all hover:bg-primary/20">
                                                                    DESCARGAR
                                                                </a>
                                                            )}
                                                            {/* @ts-ignore */}
                                                            {item.thumbnail_url && (
                                                                <a href={getApiUrl(item.thumbnail_url)} target="_blank" rel="noopener noreferrer" download className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg transition-all hover:bg-emerald-500/20" title="Descargar Miniatura">
                                                                    🖼️
                                                                </a>
                                                            )}

                                                            <Link
                                                                href={`/editor?task_id=${item.id}`}
                                                                className="p-2.5 bg-white/5 border border-white/10 rounded-lg transition-all hover:bg-white/10 flex items-center gap-1.5"
                                                            >
                                                                REANUDAR
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteTask(item.id)}
                                                                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg transition-all hover:bg-red-500/20"
                                                                title="Eliminar de la lista y la PC"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>

                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon="📭"
                                title="Sin despliegues registrados"
                                description="Aún no has iniciado ninguna operación de generación. Tu historial aparecerá aquí."
                                actionLabel="Abrir Editor"
                                actionHref="/editor"
                            />
                        )}
                    </EliteCard>
                </section>
            </main>
        </div>
    );
}
