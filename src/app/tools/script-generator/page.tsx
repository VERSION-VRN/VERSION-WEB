
"use client";

import React, { useState, useEffect } from 'react';
import { aiVersionClient } from '../../../services/aiVersionClient';
import { useAuth } from '../../../context/AuthContext';
import Toast, { ToastType } from '../../../components/Toast';
import ReactMarkdown from 'react-markdown';

export default function ScriptGeneratorPage() {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('educativo');
    const [script, setScript] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMegaMode, setIsMegaMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [taskId, setTaskId] = useState<string | null>(null);
    const [hooks, setHooks] = useState('');
    const [loadingHooks, setLoadingHooks] = useState(false);
    const { user, deductCredits, refreshCredits } = useAuth();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const HOOK_COST = 10;

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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
                        showToast('Guion generado con éxito', 'success');
                    } else if (taskStatus.status === 'failed' || taskStatus.status === 'cancelled') {
                        setLoading(false);
                        setTaskId(null);
                        setStatus(`❌ Error: ${taskStatus.message}`);
                        showToast(taskStatus.message || 'Error en la generación', 'error');
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
            showToast('Créditos insuficientes', 'error');
            return;
        }

        setLoading(true);
        setScript('');
        setProgress(0);
        setStatus('Iniciando sistema...');

        const response = await aiVersionClient.startScriptGeneration(topic, tone, isMegaMode, user?.email || user?.id);

        if (response.success && response.task_id) {
            setTaskId(response.task_id);
            setStatus(response.message || 'Encolado...');
            deductCredits(cost);
        } else {
            setLoading(false);
            setStatus(`❌ Error al iniciar: ${response.message || response.error}`);
        }
    };

    const handleGenerateHooks = async () => {
        if (!topic) return;
        if (!user || user.credits < HOOK_COST) {
            showToast(`Necesitas ${HOOK_COST} tokens para los hooks`, 'error');
            return;
        }

        setLoadingHooks(true);
        try {
            const response = await aiVersionClient.generateHooks(topic, script, user.email || user.id);
            if (response.success && response.result) {
                setHooks(response.result);
                deductCredits(HOOK_COST);
                refreshCredits();
                showToast('Hooks generados con éxito', 'success');
            } else {
                showToast(response.error || 'Error al generar hooks', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setLoadingHooks(false);
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

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

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
                <div className="mt-10 animate-fade-in-up space-y-10">
                    <div className="p-1 bg-white/[0.03] rounded-3xl border border-white/5 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.01]">
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">Guion de Alta Definición</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">IA Optimized Structure</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(script);
                                    showToast('Guion copiado al portapapeles', 'success');
                                }}
                                className="text-[10px] bg-white/5 border border-white/10 text-white font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                Copiar Guion
                            </button>
                        </div>
                        <div className="p-8 whitespace-pre-wrap text-zinc-300 text-sm leading-relaxed max-h-[500px] overflow-y-auto selection:bg-red-500/30 prose prose-invert max-w-none scrollbar-thin scrollbar-thumb-zinc-800">
                            <ReactMarkdown>{script}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Sección de Hooks */}
                    {!hooks && !loadingHooks ? (
                        <div className="border border-dashed border-red-500/20 rounded-3xl p-10 text-center bg-red-500/[0.02] animate-fade group cursor-pointer hover:bg-red-500/[0.04] transition-all"
                            onClick={handleGenerateHooks}>
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">🔥</div>
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-2">Potenciar Retención</h4>
                            <p className="text-[10px] text-zinc-500 font-medium max-w-xs mx-auto mb-6">Genera 5 variaciones de ganchos virales basados en este guion.</p>
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20 group-hover:bg-red-500 transition-colors">
                                <span>Generar Hooks Vitrales</span>
                                <span className="opacity-50 border-l border-white/20 pl-2">⚡ {HOOK_COST}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/30" />
                                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Viral Hooks Matrix</h3>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-500/30" />
                            </div>

                            {loadingHooks ? (
                                <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse">
                                    <div className="text-2xl mb-4">🧠</div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Calculando Ángulos de Retención...</p>
                                </div>
                            ) : (
                                <div className="p-8 bg-black border border-red-500/10 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { navigator.clipboard.writeText(hooks); showToast('Hooks copiados', 'success'); }}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs">📋</button>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-400 font-medium">
                                        <ReactMarkdown>{hooks}</ReactMarkdown>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">* Usa estos hooks como la primera frase de tu video.</span>
                                        <div className="flex gap-2">
                                            {["Curiosidad", "Fomo", "Autoridad"].map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded uppercase border border-red-500/20">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
