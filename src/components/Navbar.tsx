'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
    variant?: 'public' | 'app';
}

const TOOL_NAV = [
    { label: 'Aplicaciones', href: '/#apps' },
    { label: 'Cursos', href: '/#cursos' },
    { label: 'Precios', href: '/pricing' },
];

export function Navbar({ variant = 'public' }: NavbarProps) {
    const { user, logout } = useAuth();

    return (
        <nav className="w-full border-b border-white/[0.04] bg-black/80 backdrop-blur-2xl sticky top-0 z-50">
            <div className="container flex justify-between items-center py-5">
                <Link href="/" className="text-2xl font-black tracking-tighter uppercase hover:opacity-80 transition-opacity">
                    VERSION<span className="text-primary">.</span>
                </Link>

                <div className="hidden md:flex gap-6 items-center">
                    {variant === 'public' && TOOL_NAV.map(item => (
                        <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>
                    ))}

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard"
                                className="px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/20 transition-all">
                                ⚡ Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={logout}
                                className="px-4 py-2.5 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white/5 transition-all text-zinc-500">
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login"
                                className="px-5 py-2.5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-full">
                                Ingresar
                            </Link>
                            <Link href="/dashboard"
                                className="px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/10 transition-all">
                                Acceso VIP
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile: solo logo y login */}
                <div className="flex md:hidden items-center gap-3">
                    {user ? (
                        <Link href="/dashboard" className="text-primary text-[10px] font-bold">Dashboard</Link>
                    ) : (
                        <Link href="/login" className="text-[10px] font-bold">Ingresar</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
