"use client";

import React, { useState } from 'react';
import { aiVersionClient } from '@/services/aiVersionClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EliteCard } from '@/components/ui/EliteCard';
import { SkeletonEditorConfig } from '@/components/ui/Skeleton';
import { ToastType } from '@/components/Toast';
import dynamic from 'next/dynamic';

const Toast = dynamic(() => import('@/components/Toast'), { ssr: false });

const TONES = ["Viral", "Educativo", "Clickbait", "Inspiracional", "Serio"];
const AUDIENCES = ["General", "Emprendedores", "Gen Z", "Profesionales", "Niños/Familia"];

export default function SeoPage() {
    const { user, deductCredits, refreshCredits } = useAuth();
    const searchParams = useSearchParams();
    const [keyword, setKeyword] = useState(searchParams.get('q') || '');
    const [tone, setTone] = useState(searchParams.get('tone') || 'Viral');
    const [audience, setAudience] = useState(searchParams.get('audience') || 'General');
    const [results, setResults] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const [selectedTab, setSelectedTab] = useState<'all' | 'titles' | 'description' | 'tags'>('all');

    const COST = 15; // Aumentamos costo por análisis profundo

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleOptimize = async () => {
        if (!keyword) {
            showToast("Introduce un tema o keyword", "error");
            return;
        }

        if (!user || user.credits < COST) {
            showToast(`Saldo insuficiente. Necesitas ${COST} tokens.`, "error");
            return;
        }

        setLoading(true);
        setResults(null);

        try {
            const response = await aiVersionClient.generateSeo(keyword, tone, audience, user.email);

            if (response.success && response.result) {
                deductCredits(COST);
                setResults(response.result);
                showToast("Análisis SEO completado con éxito", "success");
                refreshCredits();
            } else {
                showToast(response.error || 'No se pudo generar el análisis.', "error");
            }
        } catch (error) {
            showToast("Error de conexión con el Oráculo SEO", "error");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado al portapapeles`, "success");
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-green-500/30">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="animate-fade">
                        <Link href="/dashboard" className="text-zinc-600 hover:text-white mb-4 inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors">
                            <span className="text-lg">←</span> Volver al Dashboard
                        </Link>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2">
                            VIRAL <span className="text-green-500">SEO</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-1 ml-1">
                            Engine de Crecimiento v3.0
                        </p>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-4 backdrop-blur-xl">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Costo Operativo</div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 text-xl font-black">⚡ {COST}</span>
                            <span className="text-zinc-600 text-[10px] font-bold uppercase">Tokens</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Controles */}
                    <div className="lg:col-span-5 space-y-6">
                        <EliteCard variant="glass" className="p-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-green-500/70 uppercase tracking-widest ml-1">Tema / Keyword Vital</label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="Ej: Cómo ganar en YouTube en 2026..."
                                        className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/40 transition-all placeholder:text-zinc-800 text-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Tono Viral</label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value)}
                                            className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-green-500/40 text-xs font-bold"
                                        >
                                            {TONES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Audiencia</label>
                                        <select
                                            value={audience}
                                            onChange={(e) => setAudience(e.target.value)}
                                            className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-green-500/40 text-xs font-bold"
                                        >
                                            {AUDIENCES.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleOptimize}
                                    disabled={loading}
                                    className={`
                                        w-full py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center gap-3
                                        ${loading
                                            ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5'
                                            : 'bg-green-600 text-white hover:bg-green-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(34,197,94,0.15)]'}
                                    `}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Analizando Algoritmo</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Ejecutar Análisis</span>
                                            <span className="text-xl">🚀</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </EliteCard>

                        <div className="p-6 border border-white/[0.04] bg-white/[0.01] rounded-3xl">
                            <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4">¿Qué incluye este reporte?</h4>
                            <ul className="space-y-3">
                                {[
                                    { icon: "✨", text: "5 Títulos optimizados para CTR" },
                                    { icon: "📝", text: "Descripción extensiva (SEO Matrix)" },
                                    { icon: "🏷️", text: "Tags de baja competencia/alto volumen" },
                                    { icon: "🖼️", text: "Concepto visual de miniatura" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-medium text-zinc-400">
                                        <span className="text-lg">{item.icon}</span> {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="lg:col-span-7">
                        {loading && <SkeletonEditorConfig />}

                        {!loading && !results && (
                            <div className="h-full flex flex-col items-center justify-center p-20 border border-dashed border-white/10 rounded-[2.5rem] text-center bg-white/[0.01]">
                                <div className="text-6xl mb-6 opacity-20">📊</div>
                                <h3 className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Esperando Entrada de Datos</h3>
                                <p className="text-zinc-800 text-[10px] mt-2 max-w-[200px]">Define tu tema y parámetros para que el Oráculo genere tu estrategia.</p>
                            </div>
                        )}

                        {results && (
                            <div className="animate-fade space-y-6">
                                <div className="flex bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-2xl gap-1">
                                    {(['all', 'titles', 'description', 'tags'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setSelectedTab(tab)}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedTab === tab
                                                ? 'bg-white text-black shadow-xl scale-105'
                                                : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {tab === 'all' ? 'Completo' : tab === 'titles' ? 'Títulos' : tab === 'description' ? 'Descripción' : 'Tags'}
                                        </button>
                                    ))}
                                </div>

                                <EliteCard variant="glass" className="p-0 overflow-hidden border-green-500/10">
                                    <div className="p-8 md:p-10 relative">
                                        <div className="absolute top-8 right-8">
                                            <button
                                                onClick={() => copyToClipboard(results, "Reporte completo")}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold"
                                                title="Copiar todo"
                                            >
                                                📋
                                            </button>
                                        </div>

                                        <div className="whitespace-pre-wrap text-zinc-200 text-sm leading-relaxed font-sans mt-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                                            {results.split('\n').map((line, i) => {
                                                const isHeader = line.match(/^\d\./) || line.includes(':') && line.length < 30;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`mb-3 ${isHeader ? 'text-green-500 font-black text-base mt-8 first:mt-0 uppercase tracking-tight' : 'opacity-80'}`}
                                                    >
                                                        {line}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </EliteCard>

                                <div className="flex justify-end gap-3">
                                    <EliteCard variant="glass" className="!p-4 bg-green-500/5 border-green-500/20 inline-flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Estrategia Optimizada para el Algoritmo</span>
                                    </EliteCard>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
