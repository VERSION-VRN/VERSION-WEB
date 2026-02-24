'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { EliteButton } from './ui/EliteButton';
import { LayoutDashboard, LogOut, ExternalLink, Moon, Sun } from 'lucide-react';

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
            <div className="container flex justify-between items-center py-4">
                <Link href="/" className="text-xl font-black tracking-tighter uppercase group flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-md group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(220,38,38,0.3)]">V</div>
                    <span className="hidden sm:block" style={{ color: 'var(--foreground)' }}>VERSION</span>
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
                        <div className="flex items-center gap-4">
                            <EliteButton href="/dashboard" size="sm" variant="primary" leftIcon={<LayoutDashboard size={14} />}>
                                Dashboard
                            </EliteButton>
                            <button
                                onClick={() => {
                                    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                                        logout();
                                    }
                                }}
                                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login"
                                className="text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 hover:text-primary transition-colors"
                            >
                                Ingresar
                            </Link>
                            <EliteButton href="/dashboard" size="sm" variant="outline">
                                Acceso VIP
                            </EliteButton>
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
