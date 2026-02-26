'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { EditorProvider, useEditor } from '@/context/EditorContext';
import { Step1Resources } from '@/components/editor/Step1Resources';
import { Step2Data } from '@/components/editor/Step2Data';
import { Step3Style } from '@/components/editor/Step3Style';
import { ScriptModal } from '@/components/editor/ScriptModal';
import { apiFetch, getApiUrl } from '@/lib/api';

const STEP_LABELS = ['Recursos', 'Datos', 'Estilo'];

// ─── Main Content Component ───────────────────────────────
function VideoEditorContent() {
    const { user, refreshCredits } = useAuth();
    const credits = user?.credits || 0;
    const {
        currentStep, setCurrentStep,
        formData, setFormData,
        metadata, setMetadata,
        selectedIdioma, setSelectedIdioma,
        selectedVoice, setSelectedVoice,
        selectedPrompt, setSelectedPrompt,
        selectedSubtitleStyle, setSelectedSubtitleStyle,
        selectedSubtitleColor, setSelectedSubtitleColor,
        selectedSubtitlePosition, setSelectedSubtitlePosition,
        targetLength, setTargetLength,
        isProcessing, setIsProcessing,
        progress, setProgress,
        statusMessage, setStatusMessage,
        currentTaskId, setCurrentTaskId,
        isAwaitingScript, setIsAwaitingScript,
        editedScript, setEditedScript,
        resultData, setResultData,
        isLoadingConfig, configError,
        handleUploadBackground,
        handleSubmit,
        handleCancel,
        handleConfirmScript,
        handleNewVideo
    } = useEditor();

    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskIdParam = searchParams.get('task_id');

    // Sync Auth State
    useEffect(() => {
        if (user) {
            setIsAdmin(user.role === 'admin');
        }
    }, [user]);

    // Resume logic if taskId exists on mount
    useEffect(() => {
        if (taskIdParam && !currentTaskId) {
            setCurrentTaskId(taskIdParam);
        }
    }, [taskIdParam, currentTaskId, setCurrentTaskId]);

    const handleNextStep = () => {
        if (currentStep === 1 && !formData.backgroundVideoPath) return; // Add toasts as needed
        if (currentStep === 2 && (!formData.url || !formData.titulo)) return;
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handlePrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    if (!user) return <div className="min-h-screen bg-black" />;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="text-sm font-black tracking-tight uppercase hover:text-primary transition-colors">
                        VERSION<span className="text-primary">.ED</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-medium text-zinc-500">Saldo</span>
                            <span className="text-xs font-black text-primary">{isAdmin ? '∞' : credits}</span>
                        </div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
                <div className="text-center mb-10 animate-fade">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Crear <span className="text-gradient">Video</span></h1>
                    <p className="text-zinc-600 text-xs font-medium">Genera contenido con IA en minutos</p>
                </div>

                {/* Steps Navigation */}
                <div className="flex items-center justify-center gap-1.5 mb-10">
                    {STEP_LABELS.map((label, i) => {
                        const step = i + 1;
                        const isActive = currentStep === step;
                        const isDone = currentStep > step;
                        return (
                            <button key={step} onClick={() => isDone && setCurrentStep(step)}
                                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 rounded-full
                                    ${isActive ? 'bg-primary text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] scale-105' : ''}
                                    ${isDone ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] cursor-pointer' : ''}
                                    ${!isActive && !isDone ? 'text-zinc-700 cursor-default' : ''}`}>
                                {isDone ? '✓' : `${step}.`} {label}
                            </button>
                        );
                    })}
                </div>

                {resultData ? (
                    <div className="animate-fade-scale text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/15 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                            ✨
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">¡Video Listo!</h2>
                        <p className="text-zinc-500 text-xs font-medium mb-10">Tu contenido ha sido generado exitosamente</p>

                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <a href={resultData.video_path} className="btn-primary !py-4 text-center block" target="_blank" download>
                                Descargar Video
                            </a>
                            <button onClick={() => router.push(`/editor/timeline?video=${encodeURIComponent(resultData.video_path)}&length=${targetLength}&style=${encodeURIComponent(selectedPrompt)}`)}
                                className="btn-outline !py-3 text-center block !border-primary/20 hover:!border-primary/40 w-full">
                                ✂️ Editar en Timeline
                            </button>
                            <button onClick={() => router.push(`/seo?q=${encodeURIComponent(formData.titulo)}&tone=Viral`)}
                                className="btn-outline !py-3 text-center block !border-green-500/20 hover:!border-green-500/40 w-full text-green-500">
                                🚀 Generar Launch Kit (SEO)
                            </button>
                            {resultData.script_path && (
                                <a href={resultData.script_path} className="btn-outline !py-3 text-center block !border-white/10" target="_blank" download>
                                    Ver Guion
                                </a>
                            )}
                            <button onClick={handleNewVideo} className="text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-widest mt-6 transition-colors">
                                + Crear Nuevo Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="min-h-[400px]">
                            {currentStep === 1 && <Step1Resources handleUploadBackground={handleUploadBackground} />}
                            {currentStep === 2 && <Step2Data />}
                            {currentStep === 3 && <Step3Style isLoadingConfig={isLoadingConfig} configError={configError} handleIdiomaChange={setSelectedIdioma} />}
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.04]">
                            <button onClick={handlePrevStep}
                                className={`text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white px-4 py-2 transition-colors ${currentStep === 1 ? 'invisible' : ''}`}>
                                ← Atrás
                            </button>

                            {currentStep < 3 ? (
                                <button onClick={handleNextStep} className="btn-primary !py-3 !px-8">
                                    Siguiente →
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubmit(user.email, isAdmin, credits)}
                                    disabled={isProcessing}
                                    className={`btn-primary !py-3 !px-8 flex items-center gap-2 group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{progress}%</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="group-hover:scale-110 transition-transform">⚡</span>
                                            <span>Generar Video</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Status Overlay when processing */}
                        {isProcessing && (
                            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
                                <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center gap-3 shadow-2xl min-w-[300px]">
                                    <div className="w-full flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Procesando</span>
                                        <span className="text-xs font-black text-primary">{progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{statusMessage}</p>
                                    <button onClick={handleCancel} className="text-[9px] text-zinc-700 hover:text-red-500 underline mt-1">Cancelar Proceso</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <ScriptModal isConfirmingScript={false} handleConfirmScript={handleConfirmScript} handleCancel={handleCancel} />
        </div>
    );
}

// ─── Entry Point with Providers ───────────────────────────
export default function VideoEditor() {
    const searchParams = useSearchParams();
    const taskId = searchParams.get('task_id');
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);

    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <EditorProvider initialTaskId={taskId} showToast={(m, t) => setToast({ message: m, type: t })}>
                <VideoEditorContent />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </EditorProvider>
        </Suspense>
    );
}
