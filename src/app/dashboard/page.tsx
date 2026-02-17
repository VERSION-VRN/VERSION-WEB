'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';
import { useCredits } from '@/context/CreditsContext';
import { EliteButton } from '@/components/ui/EliteButton';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteBadge } from '@/components/ui/EliteBadge';

export default function Dashboard() {
    const { credits, refreshCredits } = useCredits();
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState('REBELDE');
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const router = useRouter();

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
        const name = localStorage.getItem('version_user_name');

        if (!role) {
            router.push('/login');
            return;
        }

        setIsAdmin(role === 'admin');
        setUserName(name || (role === 'admin' ? 'ADMIN' : 'REBELDE'));
        setIsLoading(false);
        fetchHistory();
        refreshCredits(); // Mantener saldo actualizado al entrar
    }, [router]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(getApiUrl('/tasks/history'), {
                headers: getSecurityHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('version_user_role');
        localStorage.removeItem('version_user_credits');
        localStorage.removeItem('version_user_name');
        router.push('/login');
    };

    if (isLoading) return <div className="min-h-screen bg-black" />;

    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-[280px] hidden lg:flex flex-col border-r border-white/[0.04] p-8 fixed h-full bg-zinc-950/20 backdrop-blur-xl z-50">
                <div className="text-xl font-black tracking-tighter uppercase mb-12">
                    VERSION<span className="text-primary">.</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-4 uppercase">Menú Principal</div>
                    <Link href="/dashboard" className="flex items-center gap-3 p-3.5 bg-white/[0.04] border-l-2 border-primary text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">📊</span> Vista General
                    </Link>
                    <Link href="/ai" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">🤖</span> VERSION AI Chat
                    </Link>
                    <Link href="/editor" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">🎬</span> VERSION Editor
                    </Link>
                    <Link href="/thumbnails" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">🖼️</span> VERSION Thumbnails
                    </Link>
                    <Link href="/writer" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">📝</span> VERSION Writer
                    </Link>
                    <Link href="/seo" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">🚀</span> VERSION SEO
                    </Link>
                    <Link href="/ai" className="flex items-center gap-3 p-3.5 text-zinc-500 hover:text-white hover:bg-white/[0.04] text-xs font-bold transition-all rounded-xl">
                        <span className="opacity-70">🤖</span> VERSION AI Chat
                    </Link>
                </nav>

                <nav className="mt-auto pt-8 border-t border-white/[0.04] space-y-4">
                    <EliteCard variant="glass" className="!p-5 mb-4 border-primary/15 bg-primary/[0.03]">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Saldo Actual</span>
                            <span className="text-xs font-black text-primary">{isAdmin ? '∞' : credits}</span>
                        </div>
                        <EliteButton variant="primary" size="sm" fullWidth onClick={() => router.push('/pricing')}>
                            Recargar Arsenal
                        </EliteButton>
                    </EliteCard>

                    <Link href="/" className="text-[10px] text-zinc-500 hover:text-white font-bold tracking-widest uppercase transition-colors block pl-1">
                        ← Volver a la Web
                    </Link>

                    <EliteCard variant="glass" className="!p-5">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Identidad Digital</div>
                        <div className="text-xs font-black uppercase mb-1 truncate">{userName}</div>
                        <EliteBadge variant="primary" className="mb-4">
                            {isAdmin ? 'ULTIMATE_ACCESS' : 'REBEL_LEVEL_1'}
                        </EliteBadge>
                        <button
                            onClick={handleLogout}
                            className="text-[9px] text-white/50 hover:text-primary font-bold uppercase tracking-widest underline transition-colors cursor-pointer block"
                        >
                            Finalizar Sesión
                        </button>
                    </EliteCard>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-[280px] p-8 md:p-12 min-h-screen">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                            HOLA, <span className="text-primary">{isAdmin ? 'ADMIN' : userName.split(' ')[0]}</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm">
                            {isAdmin ? 'Panel de control maestro activo. Ecosistema bajo control.' : 'Tu arsenal digital está listo para la acción.'}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="badge ring-1 ring-primary/30 bg-primary/5 animate-pulse !py-2 !px-4 italic">Sistema Omnisciente Activo</div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 text-white">
                    <EliteCard variant="glass" className="flex justify-between items-center p-8">
                        <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Tokens de Combate</span>
                            <div className="text-5xl font-black tabular-nums">{isAdmin ? '∞' : credits}</div>
                        </div>
                        <EliteButton variant="outline" size="md" onClick={() => router.push('/pricing')}>
                            Añadir Fondos
                        </EliteButton>
                    </EliteCard>
                    <EliteCard variant="glass" className="flex justify-between items-center p-8">
                        <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Rendimiento Operativo</span>
                            <div className="text-5xl font-black tabular-nums text-primary/20">68%</div>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-right">Optimización <br /> en curso</div>
                    </EliteCard>
                </div>

                {/* Grid de Aplicaciones */}
                <section className="mb-20">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Apps & Herramientas</h2>
                        <Link href="/pricing" className="text-primary text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Ver Planes Elite →</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* VERSION EDITOR */}
                        <EliteCard
                            variant="glass"
                            title="VERSION Editor"
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
                            title="Thumbnails"
                            subtitle="Visual Core"
                            description="Diseño de miniaturas y análisis CTR avanzado con redes neuronales."
                            headerAction={<span className="text-3xl">🖼️</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="!text-purple-400 !border-purple-500/20 hover:!bg-purple-500 hover:!text-white" onClick={() => router.push('/thumbnails')}>
                                Diseñar Impacto
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION WRITER */}
                        <EliteCard
                            variant="glass"
                            title="Writer"
                            subtitle="Script Engine"
                            description="Ingeniería de guiones virales con estructuras de alta retención."
                            headerAction={<span className="text-3xl">📝</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="!text-red-400 !border-red-500/20 hover:!bg-red-500 hover:!text-white" onClick={() => router.push('/writer')}>
                                Iniciar Script
                            </EliteButton>
                        </EliteCard>

                        {/* VERSION SEO */}
                        <EliteCard
                            variant="glass"
                            title="SEO Growth"
                            subtitle="Growth Engine"
                            description="Dominación de motores de búsqueda y análisis de competencia viral."
                            headerAction={<span className="text-3xl">🚀</span>}
                        >
                            <EliteButton variant="outline" size="md" fullWidth className="!text-green-400 !border-green-500/20 hover:!bg-green-500 hover:!text-white" onClick={() => router.push('/seo')}>
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
                            className="md:col-span-2 lg:col-span-1"
                        >
                            <EliteButton variant="secondary" size="md" fullWidth onClick={() => router.push('/ai')}>
                                Hablar con Oráculo
                            </EliteButton>
                        </EliteCard>
                    </div>
                </section>

                {/* Video History */}
                <section className="mb-20">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Historial de Videos</h2>
                        <button onClick={fetchHistory} className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Actualizar ↻</button>
                    </div>

                    {isLoadingHistory ? (
                        <div className="py-12 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="glass-card !py-12 text-center">
                            <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">No hay videos generados aún</p>
                            <Link href="/editor" className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mt-4 block hover:underline">Iniciar Primer Proyecto →</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((task) => (
                                <EliteCard key={task.id} variant="glass" className="!p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-primary/10 text-primary animate-pulse'
                                            }`}>
                                            {task.status === 'completed' ? '✓' : task.status === 'failed' ? '⚠' : '⌛'}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-[400px]">
                                                {task.original_params?.titulo || 'Proyecto Sin Título'}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                                    {new Date(task.created_at * 1000).toLocaleDateString()}
                                                </span>
                                                <EliteBadge variant={task.status === 'completed' ? 'success' : task.status === 'failed' ? 'error' : 'primary'}>
                                                    {task.status}
                                                </EliteBadge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-14 md:ml-0">
                                        {task.status === 'completed' && task.result?.video_rel_path && (
                                            <div className="flex items-center gap-2">
                                                <EliteButton
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => window.open(getApiUrl(`/downloads/${task.result.video_rel_path}`), '_blank')}
                                                >
                                                    Descargar
                                                </EliteButton>
                                                <EliteButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => router.push(`/editor/timeline?video=${encodeURIComponent(getApiUrl(`/downloads/${task.result.video_rel_path}`))}`)}
                                                >
                                                    ✂️ Editar
                                                </EliteButton>
                                            </div>
                                        )}
                                    </div>
                                </EliteCard>
                            ))}
                        </div>
                    )}
                </section>

                {/* Academy Progress */}
                <section>
                    <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase mb-8">Estatus de Formación</h2>
                    <div className="glass-card group">
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-4 text-xs font-bold uppercase">
                                <div className="flex flex-col gap-1">
                                    <span className="text-zinc-500">Módulo Actual</span>
                                    <span className="text-lg tracking-tighter font-black">Master en YouTube Automático</span>
                                </div>
                                <span className="text-primary tabular-nums font-black">{isAdmin ? '100%' : '2%'}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary shadow-[0_0_15px_var(--primary-glow)] rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: isAdmin ? '100%' : '2%' }}
                                />
                            </div>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Continuar Aprendizaje →</button>
                    </div>
                </section>
            </main>
        </div>
    );
}
