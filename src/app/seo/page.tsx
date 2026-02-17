
"use client";

import React, { useState } from 'react';
import { aiVersionClient } from '../../services/aiVersionClient';
import Link from 'next/link';
import { useCredits } from '@/context/CreditsContext';

export default function SeoPage() {
    const { credits, deductLocal, refreshCredits } = useCredits();
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState('');
    const [loading, setLoading] = useState(false);

    const COST = 10;

    const handleOptimize = async () => {
        if (!keyword) return;

        if (credits < COST) {
            setResults(`❌ Saldo insuficiente. Necesitas ${COST} tokens.`);
            return;
        }

        setLoading(true);
        setResults('Debitando tokens e iniciando análisis...');

        const response = await aiVersionClient.generateSeo(keyword);

        if (response.success && response.result) {
            deductLocal(COST);
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

                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-10 mb-8 backdrop-blur-sm">
                    <div className="mb-8">
                        <label className="text-xs font-bold text-green-500 uppercase mb-3 block tracking-widest">
                            Target Keyword / Tema Viral
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Ej: Marketing Digital 2026, Recetas Veganas..."
                            className="w-full p-5 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-zinc-800"
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
                </div>

                {results && (
                    <div className="animate-fade-in-up">
                        <div className="bg-zinc-950 p-10 rounded-2xl border-l-4 border-green-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 blur-3xl bg-green-500 w-64 h-64 rounded-full pointer-events-none"></div>
                            <h3 className="text-sm font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <span className="text-green-500 text-xl">⚡</span> Reporte de Optimización
                            </h3>
                            <div className="whitespace-pre-wrap text-zinc-300 text-sm leading-relaxed font-mono">
                                {results}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
