"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import '../globals.css';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [credentials, setCredentials] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const getApiUrl = (path: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}${path}`;
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                // --- LOGIN FLOW ---
                const res = await fetch(getApiUrl('/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email, password: credentials.password })
                });
                const data = await res.json();

                if (data.success) {
                    login(data.token, {
                        email: credentials.email,
                        name: data.name,
                        role: data.role,
                        credits: data.credits
                    });
                    router.push('/dashboard');
                } else {
                    setError(data.message || 'Error de autenticación.');
                }
            } else {
                // --- REGISTER FLOW ---
                if (!credentials.email || !credentials.password || !credentials.name) {
                    return setError('Por favor, completa todos los campos.');
                }

                const res = await fetch(getApiUrl('/register'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                        name: credentials.name.toUpperCase()
                    })
                });
                const data = await res.json();

                if (data.success) {
                    // Auto-login con los datos devueltos
                    login(data.token, {
                        email: credentials.email,
                        name: data.name,
                        role: data.role,
                        credits: data.credits
                    });

                    setSuccess(data.message);
                    // Pequeña pausa para leer el mensaje de éxito antes de redirigir
                    setTimeout(() => router.push('/dashboard'), 1500);
                } else {
                    setError(data.message || 'Error al crear cuenta.');
                }
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor VERSION. Verifica tu conexión.');
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -z-10"></div>

            <div className="glass-card w-full max-w-md !p-10 animate-fade">
                <div className="text-center mb-10">
                    <Link href="/" className="text-3xl font-black tracking-tighter uppercase inline-block hover:scale-105 transition-transform">
                        VERSION<span className="text-primary">.</span>
                    </Link>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mt-4">
                        {isLogin ? 'Acceso al Ecosistema' : 'Crear Nueva Identidad'}
                    </p>
                </div>

                <form onSubmit={handleAction} className="flex flex-col gap-5">
                    {/* The previous code had a bug where name was inside an inverted logic of login, I will just correct the `!isLogin` check */}
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                placeholder="Tu nombre"
                                required
                                value={credentials.name}
                                onChange={(e) => setCredentials({ ...credentials, name: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email / Usuario</label>
                        <input
                            type="text"
                            placeholder="email@ejemplo.com"
                            required
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Código de Acceso</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-primary/5 border border-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest text-center rounded-xl animate-pulse">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-500/5 border border-green-500/15 text-green-500 text-[10px] font-bold uppercase tracking-widest text-center rounded-xl">
                            {success}
                        </div>
                    )}

                    <button type="submit" className="btn-primary w-full mt-2 !py-4">
                        {isLogin ? 'Iniciar Conexión' : 'Unirse a la Élite'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate y obtén 30 tokens' : '¿Ya eres miembro? Inicia Sesión'}
                    </button>
                </form>

                <div className="text-center mt-10 space-y-4">
                    <Link href="/" className="text-[9px] text-zinc-600 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors block">
                        Al ingresar aceptas los términos de la red VERSION
                    </Link>
                    <div className="h-[1px] w-12 bg-white/[0.04] mx-auto"></div>
                    <Link href="/" className="text-[9px] text-zinc-600 hover:text-primary font-bold uppercase tracking-[0.2em] transition-colors block">
                        ← Regresar a la red pública
                    </Link>
                </div>
            </div>

            {/* Footer Tag */}
            <div className="absolute bottom-8 text-[8px] font-bold tracking-[0.5em] text-white/10 uppercase italic">
                Secure Neural Link v2.0.26
            </div>
        </div>
    );
}
