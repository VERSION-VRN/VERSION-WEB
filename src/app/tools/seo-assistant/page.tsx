
"use client";

import React, { useState } from 'react';
import { aiVersionClient } from '../../../services/aiVersionClient';

export default function SeoAssistantPage() {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOptimize = async () => {
        if (!keyword) return;
        setLoading(true);
        setResults('');

        const response = await aiVersionClient.generateSeo(keyword);

        if (response.success && response.result) {
            setResults(response.result);
        } else {
            setResults(`Error: ${response.error || 'No se pudo generar el análisis.'}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black mb-2 tracking-tighter">
                    SEO <span className="text-green-500">VIRAL</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
                    Dominación Algorítmica de Búsqueda
                </p>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 mb-8">
                <div className="mb-6">
                    <label className="text-xs font-bold text-green-500 uppercase mb-2 block tracking-widest">
                        Palabra Clave o Tema
                    </label>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Ej: Marketing Digital 2026, Recetas Veganas..."
                        className="w-full p-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
                    />
                </div>

                <button
                    onClick={handleOptimize}
                    disabled={loading}
                    className={`
                        w-full p-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300
                        ${loading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-900/20'}
                    `}
                >
                    {loading ? 'ANALIZANDO TENDENCIAS...' : 'OPTIMIZAR AHORA'}
                </button>
            </div>

            {results && (
                <div className="animate-fade-in-up">
                    <div className="bg-[#0a0a0a] p-8 rounded-2xl border-l-4 border-green-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl bg-green-500 w-32 h-32 rounded-full pointer-events-none"></div>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-green-500">⚡</span> Resultados de Optimización
                        </h3>
                        <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                            {results}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
