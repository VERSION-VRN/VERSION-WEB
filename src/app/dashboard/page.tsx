'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Dashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [credits, setCredits] = useState(0);
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
        const userCredits = localStorage.getItem('version_user_credits');
        const name = localStorage.getItem('version_user_name');

        if (!role) {
            router.push('/login');
            return;
        }

        setIsAdmin(role === 'admin');
        setCredits(parseInt(userCredits || '0'));
        setUserName(name || (role === 'admin' ? 'ADMIN' : 'REBELDE'));
        setIsLoading(false);
        fetchHistory();
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
                </nav>

                <nav className="mt-auto pt-8 border-t border-white/[0.04] space-y-4">
                    <div className="glass-card !p-5 mb-4 border-primary/15 bg-primary/[0.03]">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Saldo Actual</span>
                            <span className="text-xs font-black text-primary">{isAdmin ? '∞' : credits}</span>
                        </div>
                        <Link href="/pricing" className="btn-primary !py-2.5 !text-[8px] w-full text-center block">Recargar Arsenal</Link>
                    </div>

                    <Link href="/" className="text-[10px] text-zinc-500 hover:text-white font-bold tracking-widest uppercase transition-colors block pl-1">
                        ← Volver a la Web
                    </Link>

                    <div className={`glass-card !p-5 ${isAdmin ? 'ring-1 ring-primary/20' : ''}`}>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Identidad Digital</div>
                        <div className="text-xs font-black uppercase mb-1 truncate">{userName}</div>
                        <div className="text-[9px] text-primary font-bold uppercase tracking-tighter mb-4">{isAdmin ? 'ULTIMATE_ACCESS' : 'REBEL_LEVEL_1'}</div>
                        <button
                            onClick={handleLogout}
                            className="text-[9px] text-white/50 hover:text-primary font-bold uppercase tracking-widest underline transition-colors cursor-pointer"
                        >
                            Finalizar Sesión
                        </button>
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                    <div className="glass-card bg-zinc-950/40 flex justify-between items-center p-8">
                        <div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Tokens Disponibles</div>
                            <div className="text-5xl font-black tabular-nums">{isAdmin ? '∞' : credits}</div>
                        </div>
                        <Link href="/pricing" className="btn-outline !py-3 !text-[10px]">Añadir Créditos</Link>
                    </div>
                    <div className="glass-card bg-zinc-950/40 flex justify-between items-center p-8">
                        <div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Consumo Promedio</div>
                            <div className="text-5xl font-black tabular-nums text-zinc-800">0.0</div>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-right">Sin actividad <br /> reciente</div>
                    </div>
                </div>

                {/* Grid de Aplicaciones */}
                <section className="mb-20">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Apps & Herramientas</h2>
                        <Link href="/pricing" className="text-primary text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Ver Planes Elite →</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* VERSION EDITOR */}
                        <div className="glass-card group hover:scale-[1.01] transition-transform">
                            <div className="flex justify-between items-start mb-6">
                                <span className="badge border-primary text-primary">Pro Ready</span>
                                <span className="text-2xl group-hover:animate-bounce">🎬</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">VERSION Editor</h4>
                            <p className="text-zinc-500 text-xs mb-8 leading-relaxed">Automatización de clips de YouTube con IA y edición profesional integrada.</p>
                            <Link href="/editor" className="btn-primary !py-3 !text-[10px] w-full text-center">Abrir Editor</Link>
                        </div>

                        {/* VERSION AI */}
                        <div className="glass-card group hover:scale-[1.01] transition-transform">
                            <div className="flex justify-between items-start mb-6">
                                <span className="badge border-zinc-700 text-zinc-500">Neutral Active</span>
                                <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">VERSION AI Chat</h4>
                            <p className="text-zinc-500 text-xs mb-8 leading-relaxed">Asistente estratégico basado en el Master de YouTube y creación de ganchos.</p>
                            <Link href="/ai" className="btn-outline !py-3 !text-[10px] w-full text-center">Iniciar Chat</Link>
                        </div>
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
                                <div key={task.id} className="glass-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/[0.04] transition-all border-white/[0.04] hover:border-white/10">
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
                                                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${task.status === 'completed' ? 'text-green-500/70' :
                                                    task.status === 'failed' ? 'text-red-500/70' :
                                                        'text-primary/70'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-14 md:ml-0">
                                        {task.status === 'completed' && task.result?.video_rel_path && (
                                            <a
                                                href={getApiUrl(`/downloads/${task.result.video_rel_path}`)}
                                                target="_blank"
                                                download
                                                className="px-4 py-2 bg-white/[0.05] hover:bg-white/10 border border-white/[0.08] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                            >
                                                Descargar
                                            </a>
                                        )}
                                        <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                            <span className="text-sm">⋮</span>
                                        </button>
                                    </div>
                                </div>
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
