
"use client";

import React, { useState, useEffect } from 'react';
import { aiVersionClient } from '../../services/aiVersionClient';
import Link from 'next/link';
import { useCredits } from '@/context/CreditsContext';

export default function WriterPage() {
    const { credits, deductLocal, refreshCredits } = useCredits();
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('educativo');
    const [script, setScript] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMegaMode, setIsMegaMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [taskId, setTaskId] = useState<string | null>(null);

    // Efecto para polling de estado
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (taskId && loading) {
            intervalId = setInterval(async () => {
                const taskStatus = await aiVersionClient.getTaskStatus(taskId);

                if (taskStatus) {
                    setProgress(taskStatus.progress);
                    setStatus(taskStatus.message);

                    // Actualizar script parcial si existe (para efecto streaming visual)
                    if (taskStatus.result && taskStatus.result.script) {
                        setScript(taskStatus.result.script);
                    }

                    if (taskStatus.status === 'completed') {
                        setLoading(false);
                        setTaskId(null);
                        setStatus('✅ Guion completado con éxito.');
                        if (taskStatus.result?.script) setScript(taskStatus.result.script);
                        refreshCredits();
                    } else if (taskStatus.status === 'failed' || taskStatus.status === 'cancelled') {
                        setLoading(false);
                        setTaskId(null);
                        setStatus(`❌ Error: ${taskStatus.message}`);
                        refreshCredits();
                    }
                }
            }, 2000); // Poll cada 2 segundos
        }

        return () => clearInterval(intervalId);
    }, [taskId, loading]);

    const COST = 50;

    const handleGenerate = async () => {
        if (!topic) return;

        if (credits < COST) {
            setStatus(`❌ Saldo insuficiente. Necesitas ${COST} tokens.`);
            return;
        }

        setLoading(true);
        setScript('');
        setProgress(0);
        setStatus('Debitando tokens e iniciando sistema...');

        const response = await aiVersionClient.startScriptGeneration(topic, tone, isMegaMode);

        if (response.success && response.task_id) {
            deductLocal(COST); // Optimistic UI update
            setTaskId(response.task_id);
            setStatus(response.message || 'Encolado...');
        } else {
            setLoading(false);
            setStatus(`❌ Error: ${response.message || response.error}`);
            refreshCredits();
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-12">
            <Link href="/dashboard" className="text-zinc-500 hover:text-white mb-8 block text-xs font-bold tracking-widest uppercase">← Volver al Dashboard</Link>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase">
                        VERSION <span className="text-red-600">WRITER</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
                        Arquitectura de Guiones Virales
                    </p>
                </div>

                <div className="grid gap-6 mb-8">
                    <div>
                        <label className="text-xs font-bold text-red-600 uppercase mb-2 block tracking-widest">
                            Concepto Central o Link
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ej: La caída del Imperio Romano en 2026..."
                            className="w-full p-5 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600/50 transition-colors placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">
                                Tono de Comunicación
                            </label>
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full p-5 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="educativo">🎓 Educativo / Documental</option>
                                <option value="humorístico">😂 Humorístico / Sátira</option>
                                <option value="estoico/firme">🗿 Estoico / Firme</option>
                                <option value="corporativo">💼 Profesional / Tech</option>
                                <option value="agresivo/clickbait">🔥 Agresivo / Viral</option>
                            </select>
                        </div>

                        <div
                            onClick={() => setIsMegaMode(!isMegaMode)}
                            className={`
                                p-5 border rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300
                                ${isMegaMode
                                    ? 'bg-red-600/10 border-red-600'
                                    : 'bg-zinc-900/50 border-white/10 hover:border-white/20'}
                            `}
                        >
                            <div>
                                <span className={`text-xs font-bold block mb-1 tracking-widest uppercase ${isMegaMode ? 'text-red-500' : 'text-zinc-500'}`}>
                                    Modo Mega Deep
                                </span>
                                <span className={`text-[10px] ${isMegaMode ? 'text-red-400' : 'text-zinc-600'}`}>
                                    Análisis profundo (20+ min)
                                </span>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isMegaMode ? 'bg-red-600' : 'bg-zinc-800'}`}>
                                <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all duration-200 ${isMegaMode ? 'right-[2px]' : 'left-[2px]'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`
                        w-full p-6 rounded-xl font-black text-lg tracking-[0.2em] uppercase transition-all duration-300 shadow-2xl
                        ${loading
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5'
                            : 'bg-white text-black hover:bg-red-600 hover:text-white'}
                    `}
                >
                    {loading ? 'Procesando Datos...' : 'Ejecutar Protocolo de Escritura'}
                </button>

                {loading && (
                    <div className="mt-12 animate-fade-in-up">
                        <div className="flex justify-between mb-3">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">{status}</span>
                            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 transition-all duration-500 ease-out shadow-[0_0_20px_rgba(220,38,38,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {script && (
                    <div className="mt-12 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Output Generado</h3>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(script)}
                                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 px-4 py-2 rounded-lg hover:text-white transition-all font-bold uppercase tracking-widest"
                            >
                                Copiar al Portapapeles
                            </button>
                        </div>
                        <div className="bg-zinc-950 p-10 rounded-2xl border border-white/5 text-zinc-300 text-sm leading-8 font-mono max-h-[800px] overflow-y-auto selection:bg-red-900/50">
                            {script}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
