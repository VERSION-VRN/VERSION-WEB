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
        <nav
            className="w-full border-b sticky top-0 z-50 transition-colors duration-300"
            style={{
                borderColor: 'var(--glass-border)',
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 30px rgba(0,0,0,0.2)',
            }}
        >
            {/* Subtle bottom light border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="container flex justify-between items-center py-4 relative z-10">
                <Link href="/" className="text-xl font-black tracking-tighter uppercase group flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-md group-hover:rotate-12 transition-transform duration-300"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                            boxShadow: '0 0 20px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >V</div>
                    <span className="hidden sm:block" style={{ color: 'var(--foreground)' }}>VERSION</span>
                </Link>

                <div className="hidden md:flex gap-6 items-center">
                    {variant === 'public' && TOOL_NAV.map(item => (
                        <Link key={item.href} href={item.href} className="nav-link relative group/link">
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-primary/50 group-hover/link:w-full transition-all duration-300" />
                        </Link>
                    ))}

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
                                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                style={{
                                    border: '1px solid var(--glass-border)',
                                    backdropFilter: 'blur(8px)',
                                }}
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
