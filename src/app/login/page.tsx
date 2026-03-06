"use client";

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import '../globals.css';

// ─── Estáticos ──────────────────────────────────────────────────────
const COUNTRIES = ["Argentina", "Bolivia", "Chile", "Colombia", "España", "México", "Perú", "Uruguay", "Venezuela", "Otro"];
const SOURCES = ["YouTube", "TikTok", "Instagram", "Amigo", "Google", "Otro"];

// ─── Componentes Auxiliares (Fuera para evitar re-mounts) ────────────
const Label = ({ text }: { text: string }) => (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
        {text}
    </label>
);

// ─── Componente Principal ───────────────────────────────────────────
export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [country, setCountry] = useState('');
    const [source, setSource] = useState('');

    const [showPw, setShowPw] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showBackendConfig, setShowBackendConfig] = useState(false);
    const [backendUrl, setBackendUrl] = useState('');

    const router = useRouter();
    const { login } = useAuth();

    // Cargar URL inicial de localStorage
    useMemo(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || '';
            setBackendUrl(saved);
        }
    }, []);

    const saveBackendUrl = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('backend_url', backendUrl.trim());
            setError('URL del servidor actualizada. Intenta de nuevo.');
            setShowBackendConfig(false);
        }
    };

    const pwStrength = useMemo(() => {
        if (!password) return { label: '', color: 'transparent' };
        if (password.length < 6) return { label: 'Muy corta', color: '#ef4444' };
        if (password.length < 10) return { label: 'Media', color: '#f59e0b' };
        return { label: 'Fuerte', color: '#22c55e' };
    }, [password]);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const data = await apiFetch<any>('/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                if (data.success) {
                    login(data.token, { email, name: data.name, role: data.role, credits: data.credits });
                    router.push('/dashboard');
                } else {
                    setError(data.message || 'Error al iniciar sesión');
                }
            } else {
                if (password !== confirmPassword) throw new Error("Las contraseñas no coinciden");
                if (password.length < 8) throw new Error("La contraseña debe tener 8+ caracteres");

                const data = await apiFetch<any>('/register', {
                    method: 'POST',
                    body: JSON.stringify({ email, password, name, country, referral_source: source })
                });
                if (data.success) {
                    login(data.token, { email, name: data.name, role: data.role, credits: data.credits });
                    window.location.href = '/dashboard';
                } else {
                    setError(data.message || 'Error al registrarse');
                }
            }
        } catch (err: any) {
            setError(err.message || 'No se pudo conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#050510] relative overflow-hidden">
            {/* Orbes de Fondo */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full" />
            </div>

            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-10 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
                        VERSION<span className="text-primary">.</span>
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mt-4">
                        {isLogin ? 'Acceso al Ecosistema' : 'Registrar nueva identidad'}
                    </p>
                </div>

                <form onSubmit={handleAction} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <Label text="Nombre Completo" />
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Tu nombre" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label text="País" />
                                    <select value={country} onChange={e => setCountry(e.target.value)} className="input-field">
                                        <option value="">País...</option>
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <Label text="Referencia" />
                                    <select value={source} onChange={e => setSource(e.target.value)} className="input-field">
                                        <option value="">Vengo de...</option>
                                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <Label text="Email" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="tú@ejemplo.com" required />
                    </div>

                    <div>
                        <Label text="Contraseña" />
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                {showPw ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {!isLogin && password && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full" style={{ width: password.length > 10 ? '100%' : '50%', background: pwStrength.color }} />
                                </div>
                                <span className="text-[9px] font-bold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <Label text="Confirmar Contraseña" />
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
                        </div>
                    )}

                    {error && <div className="text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-center uppercase tracking-wider">{error}</div>}

                    <button disabled={isLoading} className="btn-primary w-full py-4 relative overflow-hidden group">
                        {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Conexión' : 'Crear Cuenta')}
                    </button>

                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest text-center mt-2">
                        {isLogin ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Ingresa'}
                    </button>

                    <div className="pt-6 mt-6 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowBackendConfig(!showBackendConfig)}
                            className="w-full text-[9px] font-bold text-zinc-600 hover:text-primary uppercase tracking-[0.2em] transition-colors"
                        >
                            {showBackendConfig ? '✕ Cerrar Configuración' : '⚙️ Configurar Servidor'}
                        </button>

                        {showBackendConfig && (
                            <div className="mt-4 space-y-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5 animate-fade-in">
                                <Label text="URL del Backend (Túnel)" />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={backendUrl}
                                        onChange={e => setBackendUrl(e.target.value)}
                                        className="input-field !text-[11px] !py-2"
                                        placeholder="https://...loca.lt"
                                    />
                                    <button
                                        type="button"
                                        onClick={saveBackendUrl}
                                        className="bg-primary text-black px-3 rounded-xl font-bold text-[10px] hover:brightness-110 active:scale-95 transition-all"
                                    >
                                        OK
                                    </button>
                                </div>
                                <p className="text-[8px] text-zinc-600 leading-relaxed italic">
                                    * Cambia esto si el túnel de Localtunnel ha expirado o se ha reiniciado.
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
