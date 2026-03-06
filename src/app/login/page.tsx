"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import '../globals.css';

// ─── Constantes ─────────────────────────────────────────────────────
const COUNTRIES = [
    "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba",
    "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala",
    "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
    "Puerto Rico", "Rep. Dominicana", "Uruguay", "Venezuela", "Otro"
];

const REFERRAL_SOURCES = [
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "instagram", label: "Instagram" },
    { value: "amigo", label: "Un Amigo" },
    { value: "busqueda", label: "Búsqueda en Google" },
    { value: "otro", label: "Otro" },
];

// ─── Utilidades ─────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: 'Débil', color: '#ef4444' };
    if (score <= 3) return { level: 2, label: 'Media', color: '#f59e0b' };
    return { level: 3, label: 'Fuerte', color: '#22c55e' };
}

// ─── Componente Principal ───────────────────────────────────────────
export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [credentials, setCredentials] = useState({
        email: '', password: '', confirmPassword: '',
        name: '', country: '', referralSource: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const passwordStrength = useMemo(() => getPasswordStrength(credentials.password), [credentials.password]);

    // ─── Validación en tiempo real ───
    const validateField = (field: string, value: string) => {
        const errors = { ...fieldErrors };
        switch (field) {
            case 'email':
                if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
                    errors.email = 'Formato de email inválido';
                else delete errors.email;
                break;
            case 'password':
                if (value && value.length < 8)
                    errors.password = 'Mínimo 8 caracteres';
                else delete errors.password;
                if (credentials.confirmPassword && value !== credentials.confirmPassword)
                    errors.confirmPassword = 'Las contraseñas no coinciden';
                else delete errors.confirmPassword;
                break;
            case 'confirmPassword':
                if (value && value !== credentials.password)
                    errors.confirmPassword = 'Las contraseñas no coinciden';
                else delete errors.confirmPassword;
                break;
            case 'name':
                if (!isLogin && value && value.trim().length < 2)
                    errors.name = 'Nombre muy corto';
                else delete errors.name;
                break;
        }
        setFieldErrors(errors);
    };

    const updateField = (field: string, value: string) => {
        setCredentials(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    };

    // ─── Acción Submit ───
    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const data = await apiFetch<{
                    success: boolean; token: string; name: string;
                    role: string; credits: number; message?: string;
                }>('/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: credentials.email, password: credentials.password })
                });
                if (data.success) {
                    login(data.token, {
                        email: credentials.email, name: data.name,
                        role: data.role, credits: data.credits
                    });
                    router.push('/dashboard');
                } else {
                    setError(data.message || 'Credenciales inválidas.');
                }
            } else {
                // Validaciones de registro
                if (!credentials.email || !credentials.password || !credentials.name) {
                    setIsLoading(false);
                    return setError('Por favor, completa todos los campos obligatorios.');
                }
                if (credentials.password !== credentials.confirmPassword) {
                    setIsLoading(false);
                    return setError('Las contraseñas no coinciden.');
                }
                if (credentials.password.length < 8) {
                    setIsLoading(false);
                    return setError('La contraseña debe tener al menos 8 caracteres.');
                }
                if (Object.keys(fieldErrors).length > 0) {
                    setIsLoading(false);
                    return setError('Corrige los errores antes de continuar.');
                }

                const data = await apiFetch<{
                    success: boolean; token: string; name: string;
                    role: string; credits: number; message: string;
                }>('/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                        name: credentials.name.toUpperCase(),
                        country: credentials.country,
                        referral_source: credentials.referralSource,
                    })
                });

                if (data.success) {
                    login(data.token, {
                        email: credentials.email, name: data.name,
                        role: data.role, credits: data.credits
                    });
                    setSuccess('✅ Cuenta creada. Revisa tu email de bienvenida.');
                    setTimeout(() => router.push('/dashboard'), 2000);
                } else {
                    setError(data.message || 'Error al crear cuenta.');
                }
            }
        } catch (err: any) {
            const backendUrl = typeof window !== 'undefined' ? (localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'localhost') : 'servidor';
            setError(`No se pudo conectar con el servidor VERSION en ${backendUrl}. Verifica tu conexión o el estado del túnel.`);
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Componente de Input Reutilizable ───
    const InputField = ({
        label, type = 'text', placeholder, field, required = false,
        isPassword = false, showPw, togglePw
    }: {
        label: string; type?: string; placeholder: string; field: string;
        required?: boolean; isPassword?: boolean; showPw?: boolean;
        togglePw?: () => void;
    }) => (
        <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1 flex items-center gap-1.5">
                {label}
                {required && <span className="text-primary text-[8px]">*</span>}
            </label>
            <div className="relative">
                <input
                    type={isPassword ? (showPw ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    required={required}
                    value={(credentials as any)[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className={`input-field pr-${isPassword ? '12' : '5'} ${fieldErrors[field] ? '!border-red-500/50 !ring-1 !ring-red-500/20' : ''}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={togglePw}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors text-lg cursor-pointer select-none"
                        tabIndex={-1}
                    >
                        {showPw ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}
            </div>
            {fieldErrors[field] && (
                <p className="text-[9px] text-red-400 font-bold ml-1 animate-fade">{fieldErrors[field]}</p>
            )}
        </div>
    );

    // ─── Componente Select Reutilizable ───
    const SelectField = ({ label, field, options, placeholder }: {
        label: string; field: string; placeholder: string;
        options: { value: string; label: string }[] | string[];
    }) => (
        <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">{label}</label>
            <select
                value={(credentials as any)[field]}
                onChange={(e) => updateField(field, e.target.value)}
                className="input-field appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
            >
                <option value="" className="bg-zinc-900">{placeholder}</option>
                {options.map(opt => {
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const lab = typeof opt === 'string' ? opt : opt.label;
                    return <option key={val} value={val} className="bg-zinc-900">{lab}</option>;
                })}
            </select>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--background)' }}>
            {/* Liquid Glass Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/8 blur-[180px] rounded-full animate-orb-float" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/8 blur-[160px] rounded-full animate-orb-float" style={{ animationDelay: '-10s' }} />
                <div className="absolute top-1/2 left-1/4 w-[350px] h-[350px] bg-purple-500/6 blur-[140px] rounded-full animate-orb-float" style={{ animationDelay: '-5s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative liquid-shine"
                style={{
                    background: 'var(--glass-bg-heavy)',
                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-glass)',
                    padding: '2.5rem',
                }}
            >
                {/* Glass shine overlay */}
                <div className="absolute inset-0 pointer-events-none z-[1] rounded-3xl" style={{ background: 'var(--glass-shine)' }} />

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <Link href="/" className="text-3xl font-black tracking-tighter uppercase inline-block hover:scale-105 transition-transform">
                        VERSION<span className="text-primary">.</span>
                    </Link>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={isLogin ? 'login' : 'register'}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mt-4"
                        >
                            {isLogin ? 'Acceso al Ecosistema' : 'Crear Nueva Identidad'}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Form */}
                <form onSubmit={handleAction} className="flex flex-col gap-4 relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? 'login-form' : 'register-form'}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col gap-4"
                        >
                            {/* ─── Campos de Registro ─── */}
                            {!isLogin && (
                                <>
                                    <InputField label="Nombre Completo" placeholder="Tu nombre" field="name" required />

                                    <div className="grid grid-cols-2 gap-3">
                                        <SelectField
                                            label="País / Región"
                                            field="country"
                                            placeholder="Seleccionar..."
                                            options={COUNTRIES}
                                        />
                                        <SelectField
                                            label="¿Cómo nos conociste?"
                                            field="referralSource"
                                            placeholder="Seleccionar..."
                                            options={REFERRAL_SOURCES}
                                        />
                                    </div>
                                </>
                            )}

                            {/* ─── Email ─── */}
                            <InputField
                                label="Email"
                                type="email"
                                placeholder="email@ejemplo.com"
                                field="email"
                                required
                            />

                            {/* ─── Contraseña ─── */}
                            <InputField
                                label="Contraseña"
                                placeholder="••••••••"
                                field="password"
                                required
                                isPassword
                                showPw={showPassword}
                                togglePw={() => setShowPassword(!showPassword)}
                            />

                            {/* ─── Barra de Fuerza (solo registro) ─── */}
                            {!isLogin && credentials.password && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-3 px-1"
                                >
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                                            style={{ background: passwordStrength.color }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </span>
                                </motion.div>
                            )}

                            {/* ─── Confirmar Contraseña (solo registro) ─── */}
                            {!isLogin && (
                                <InputField
                                    label="Confirmar Contraseña"
                                    placeholder="••••••••"
                                    field="confirmPassword"
                                    required
                                    isPassword
                                    showPw={showConfirmPassword}
                                    togglePw={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* ─── Mensajes de Error/Éxito ─── */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="p-3.5 bg-red-500/5 border border-red-500/15 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center rounded-xl"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="p-3.5 bg-green-500/5 border border-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-widest text-center rounded-xl"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Botón Submit ─── */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-1 !py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            isLogin ? 'Iniciar Conexión' : 'Unirse a la Élite'
                        )}
                    </button>

                    {/* ─── Toggle Login/Register ─── */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccess('');
                            setFieldErrors({});
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate y obtén 30 tokens' : '¿Ya eres miembro? Inicia Sesión'}
                    </button>
                </form>

                {/* ─── Footer ─── */}
                <div className="text-center mt-8 space-y-3 relative z-10">
                    <Link href="/" className="text-[9px] text-zinc-600 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors block">
                        Al ingresar aceptas los términos de la red VERSION
                    </Link>
                    <div className="h-[1px] w-12 bg-white/[0.04] mx-auto"></div>
                    <Link href="/" className="text-[9px] text-zinc-600 hover:text-primary font-bold uppercase tracking-[0.2em] transition-colors block">
                        ← Regresar a la red pública
                    </Link>
                </div>
            </motion.div>

            {/* Footer Tag */}
            <div className="absolute bottom-8 text-[8px] font-bold tracking-[0.5em] text-white/10 uppercase italic">
                Secure Neural Link v2.0.26
            </div>
        </div>
    );
}
