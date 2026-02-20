'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

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
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <nav className="w-full border-b sticky top-0 z-50 backdrop-blur-2xl transition-colors duration-300"
            style={{ borderColor: 'var(--border)', background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(248,248,249,0.85)' }}>
            <div className="container flex justify-between items-center py-5">
                <Link href="/" className="text-2xl font-black tracking-tighter uppercase hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--foreground)' }}>
                    VERSION<span className="text-primary">.</span>
                </Link>

                <div className="hidden md:flex gap-6 items-center">
                    {variant === 'public' && TOOL_NAV.map(item => (
                        <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>
                    ))}

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        className="relative w-12 h-6 rounded-full border transition-all duration-300 flex items-center px-0.5 hover:scale-110 active:scale-95"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                        }}>
                        <span className="absolute left-1 text-[11px] select-none">{isDark ? '🌙' : ''}</span>
                        <span className="absolute right-1 text-[11px] select-none">{!isDark ? '☀️' : ''}</span>
                        <span
                            className="w-5 h-5 rounded-full transition-transform duration-300 shadow-sm flex-shrink-0"
                            style={{
                                background: isDark ? '#fff' : '#000',
                                transform: isDark ? 'translateX(0)' : 'translateX(24px)',
                            }}
                        />
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard"
                                className="px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/20 transition-all">
                                ⚡ Dashboard
                            </Link>
                            <button type="button" onClick={logout}
                                className="px-4 py-2.5 border text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white/5 transition-all"
                                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login"
                                className="px-5 py-2.5 border text-[10px] font-bold uppercase tracking-widest rounded-full transition-all hover:bg-primary hover:text-white hover:border-primary"
                                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                                Ingresar
                            </Link>
                            <Link href="/dashboard"
                                className="px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/10 transition-all">
                                Acceso VIP
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center gap-3">
                    <button type="button" onClick={toggleTheme}
                        className="text-lg hover:scale-110 transition-transform"
                        aria-label="Toggle theme">
                        {isDark ? '🌙' : '☀️'}
                    </button>
                    {user ? (
                        <Link href="/dashboard" className="text-primary text-[10px] font-bold">Dashboard</Link>
                    ) : (
                        <Link href="/login" className="text-[10px] font-bold" style={{ color: 'var(--foreground)' }}>Ingresar</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
