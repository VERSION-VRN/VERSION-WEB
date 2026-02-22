
"use client";

import React, { useState, useEffect } from 'react';
import { aiVersionClient } from '../../../services/aiVersionClient';
import { useAuth } from '../../../context/AuthContext';

export default function ScriptGeneratorPage() {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('educativo');
    const [script, setScript] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMegaMode, setIsMegaMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [taskId, setTaskId] = useState<string | null>(null);
    const { user, deductCredits } = useAuth();

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
                    } else if (taskStatus.status === 'failed' || taskStatus.status === 'cancelled') {
                        setLoading(false);
                        setTaskId(null);
                        setStatus(`❌ Error: ${taskStatus.message}`);
                    }
                }
            }, 2000); // Poll cada 2 segundos
        }

        return () => clearInterval(intervalId);
    }, [taskId, loading]);

    const handleGenerate = async () => {
        if (!topic) return;

        const cost = isMegaMode ? 50 : 30;
        if (!user || user.credits < cost) {
            setStatus(`❌ Error: Créditos insuficientes. Necesitas ${cost} tokens para este guion.`);
            return;
        }

        setLoading(true);
        setScript('');
        setProgress(0);
        setStatus('Iniciando sistema...');

        const response = await aiVersionClient.startScriptGeneration(topic, tone, isMegaMode);

        if (response.success && response.task_id) {
            setTaskId(response.task_id);
            setStatus(response.message || 'Encolado...');
            deductCredits(cost);
        } else {
            setLoading(false);
            setStatus(`❌ Error al iniciar: ${response.message || response.error}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black mb-2 tracking-tighter">
                    GUIONISTA <span className="text-red-500">2.0</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
                    Fórmula Version Editor (Procesamiento por Partes)
                </p>
            </div>

            <div className="grid gap-6 mb-8">
                <div>
                    <label className="text-xs font-bold text-red-500 uppercase mb-2 block tracking-widest">
                        Idea Base o Link de YouTube
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Pega un link o escribe una idea profunda..."
                        className="w-full p-4 bg-[#111] border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-widest">
                            Tono Narrativo
                        </label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full p-4 bg-[#111] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                        >
                            <option value="educativo">Educativo</option>
                            <option value="humorístico">Humorístico</option>
                            <option value="estoico/firme">Estoico / Firme</option>
                            <option value="corporativo">Corporativo</option>
                            <option value="agresivo/clickbait">Agresivo / Clickbait</option>
                        </select>
                    </div>

                    <div
                        onClick={() => setIsMegaMode(!isMegaMode)}
                        className={`
                            p-4 border rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300
                            ${isMegaMode
                                ? 'bg-red-500/10 border-red-500'
                                : 'bg-[#111] border-white/10 hover:border-white/30'}
                        `}
                    >
                        <div>
                            <span className={`text-xs font-bold block mb-1 tracking-widest ${isMegaMode ? 'text-red-500' : 'text-gray-500'}`}>
                                MODO MEGA
                            </span>
                            <span className={`text-[10px] ${isMegaMode ? 'text-red-400' : 'text-gray-600'}`}>
                                20 min (50k chars)
                            </span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isMegaMode ? 'bg-red-500' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-all duration-200 ${isMegaMode ? 'right-[2px]' : 'left-[2px]'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className={`
                    w-full p-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 shadow-xl
                    ${loading
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-900/20'}
                `}
            >
                {loading ? 'GENERANDO EN LA NUBE...' : '⚡ GENERAR GUION VIRAL'}
            </button>

            {loading && (
                <div className="mt-8 animate-fade-in-up">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">{status}</span>
                        <span className="text-[10px] font-bold text-gray-500">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-600 transition-all duration-500 ease-out box-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {script && (
                <div className="mt-10 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resultado de Alta Definición:</h3>
                        <button
                            onClick={() => navigator.clipboard.writeText(script)}
                            className="text-[10px] bg-[#111] border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg hover:text-white hover:border-white/30 transition-colors"
                        >
                            COPIAR GUION
                        </button>
                    </div>
                    <div className="whitespace-pre-wrap bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 text-gray-300 text-sm leading-relaxed max-h-[600px] overflow-y-auto selection:bg-red-500/30">
                        {script}
                    </div>
                </div>
            )}
        </div>
    );
}
