
"use client";

import React, { useState } from 'react';
import { aiVersionClient } from '../../services/aiVersionClient';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EliteCard } from '@/components/ui/EliteCard';

export default function SeoPage() {
    const { user, deductCredits, refreshCredits } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState('');
    const [loading, setLoading] = useState(false);

    const COST = 10;

    const handleOptimize = async () => {
        if (!keyword) return;

        if (!user || user.credits < COST) {
            setResults(`❌ Saldo insuficiente. Necesitas ${COST} tokens.`);
            return;
        }

        setLoading(true);
        setResults('Debitando tokens e iniciando análisis...');

        const response = await aiVersionClient.generateSeo(keyword);

        if (response.success && response.result) {
            deductCredits(COST);
            setResults(response.result);
            refreshCredits();
        } else {
            setResults(`Error: ${response.error || 'No se pudo generar el análisis.'}`);
            refreshCredits();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-12">
            <Link href="/dashboard" className="text-zinc-500 hover:text-white mb-8 block text-xs font-bold tracking-widest uppercase">← Volver al Dashboard</Link>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase">
                        VERSION <span className="text-green-500">SEO</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
                        Algoritmo de Posicionamiento Global
                    </p>
                </div>

                <EliteCard variant="glass" glowColor="var(--color-seo)" className="mb-8 p-10">
                    <div className="mb-8">
                        <label className="text-xs font-bold text-green-500 uppercase mb-3 block tracking-widest">
                            Target Keyword / Tema Viral
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Ej: Marketing Digital 2026, Recetas Veganas..."
                            className="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-zinc-800"
                            onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
                        />
                    </div>

                    <button
                        onClick={handleOptimize}
                        disabled={loading}
                        className={`
                            w-full p-5 rounded-xl font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300
                            ${loading
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]'}
                        `}
                    >
                        {loading ? 'Analizando Métricas...' : 'Optimizar Metadatos'}
                    </button>
                </EliteCard>

                {results && (
                    <div className="animate-fade-in-up">
                        <EliteCard variant="glass" glowColor="var(--color-seo)" className="p-0 overflow-hidden">
                            <div className="bg-zinc-950/40 p-10 relative">
                                <h3 className="text-sm font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
                                    <span className="text-green-500 text-xl">⚡</span> Reporte de Optimización
                                </h3>
                                <div className="whitespace-pre-wrap text-zinc-200 text-sm leading-relaxed font-sans mt-4">
                                    {results.split('\n').map((line, i) => (
                                        <div key={i} className={`mb-3 ${line.match(/^\d\./) ? 'text-green-500 font-bold text-base mt-6' : ''}`}>
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </EliteCard>
                    </div>
                )}
            </div>
        </div>
    );
}
