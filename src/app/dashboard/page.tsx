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
    const router = useRouter();

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
    }, [router]);

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
            <aside className="w-[280px] hidden lg:flex flex-col border-r border-white/5 p-8 fixed h-full bg-zinc-950/20 backdrop-blur-xl z-50">
                <div className="text-xl font-black tracking-tighter uppercase mb-12">
                    VERSION<span className="text-primary">.</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <div className="text-[10px] text-zinc-500 font-black tracking-widest mb-4 uppercase">Menú Principal</div>
                    <Link href="/dashboard" className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-primary text-xs font-bold transition-all">
                        <span className="opacity-70">📊</span> Vista General
                    </Link>
                    <Link href="/ai" className="flex items-center gap-3 p-3 text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-bold transition-all">
                        <span className="opacity-70">🤖</span> VERSION AI Chat
                    </Link>
                    <Link href="/editor" className="flex items-center gap-3 p-3 text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-bold transition-all">
                        <span className="opacity-70">🎬</span> VERSION Editor
                    </Link>
                </nav>

                <nav className="mt-auto pt-8 border-t border-white/5 space-y-4">
                    <div className="glass-card !p-5 mb-4 border-primary/20 bg-primary/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Saldo Actual</span>
                            <span className="text-xs font-black text-primary">{isAdmin ? '∞' : credits}</span>
                        </div>
                        <Link href="/pricing" className="btn-primary !py-2 !text-[8px] w-full text-center block">Recargar Arsenal</Link>
                    </div>

                    <Link href="/" className="text-[10px] text-zinc-500 hover:text-white font-bold tracking-widest uppercase transition-colors block">
                        ← Volver a la Web
                    </Link>

                    <div className={`p-5 glass-card !p-5 ${isAdmin ? 'ring-1 ring-primary/30' : ''}`}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Identidad Digital</div>
                        <div className="text-xs font-black uppercase mb-1 truncate">{userName}</div>
                        <div className="text-[9px] text-primary font-black uppercase tracking-tighter mb-4">Estatus: {isAdmin ? 'ULTIMATE_ACCESS' : 'REBEL_LEVEL_1'}</div>
                        <button
                            onClick={handleLogout}
                            className="text-[9px] text-white/50 hover:text-primary font-black uppercase tracking-widest underline transition-colors cursor-pointer"
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
                        <div className="badge ring-1 ring-primary/50 bg-primary/5 animate-pulse !py-2 !px-4 italic">Sistema Omnisciente Activo</div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="glass-card bg-zinc-950/40 flex justify-between items-center p-8">
                        <div>
                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Tokens Disponibles</div>
                            <div className="text-5xl font-black tabular-nums">{isAdmin ? '∞' : credits}</div>
                        </div>
                        <Link href="/pricing" className="btn-outline !py-3 !text-[10px]">Añadir Créditos</Link>
                    </div>
                    <div className="glass-card bg-zinc-950/40 flex justify-between items-center p-8">
                        <div>
                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Consumo Promedio</div>
                            <div className="text-5xl font-black tabular-nums text-zinc-800">0.0</div>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest text-right">Sin actividad <br /> reciente</div>
                    </div>
                </div>

                {/* Grid de Aplicaciones */}
                <section className="mb-20">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-black tracking-[0.3em] text-zinc-500 uppercase">Apps & Herramientas Disponibles</h2>
                        <Link href="/pricing" className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Ver Planes Elite →</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* VERSION EDITOR */}
                        <div className="glass-card group hover:scale-[1.01] border-l-4 border-l-primary/30">
                            <div className="flex justify-between items-start mb-6">
                                <span className="badge border-primary text-primary">Pro Ready</span>
                                <span className="text-2xl group-hover:animate-bounce">🎬</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">VERSION Editor</h4>
                            <p className="text-zinc-500 text-xs mb-8 leading-relaxed">Automatización de clips de YouTube con IA y edición profesional integrada.</p>
                            <Link href="/editor" className="btn-primary !py-3 !text-[10px] w-full text-center">Abrir Editor</Link>
                        </div>

                        {/* VERSION AI */}
                        <div className="glass-card group hover:scale-[1.01] border-l-4 border-l-zinc-800">
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

                {/* Academy Progress */}
                <section>
                    <h2 className="text-xs font-black tracking-[0.3em] text-zinc-500 uppercase mb-8">Estatus de Formación</h2>
                    <div className="glass-card group border-l-4 border-l-zinc-800">
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-4 text-xs font-black uppercase">
                                <div className="flex flex-col gap-1">
                                    <span className="text-zinc-500">Módulo Actual</span>
                                    <span className="text-lg tracking-tighter">Master en YouTube Automático</span>
                                </div>
                                <span className="text-primary tabular-nums">{isAdmin ? '100%' : '2%'}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary shadow-[0_0_15px_var(--primary-glow)] transition-all duration-1000 ease-out"
                                    style={{ width: isAdmin ? '100%' : '2%' }}
                                />
                            </div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Continuar Aprendizaje →</button>
                    </div>
                </section>
            </main>
        </div>
    );
}
