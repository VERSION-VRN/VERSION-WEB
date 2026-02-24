'use client';

import React from 'react';
import { useEditor } from '@/context/EditorContext';

export function ScriptModal({
    isConfirmingScript,
    handleConfirmScript,
    handleCancel
}: {
    isConfirmingScript: boolean;
    handleConfirmScript: () => Promise<void>;
    handleCancel: () => Promise<void>;
}) {
    const { isAwaitingScript, setIsAwaitingScript, editedScript, setEditedScript } = useEditor();

    if (!isAwaitingScript) return null;

    const wordCount = editedScript.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-zinc-950 border border-white/[0.06] rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-fade-scale">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.04]">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">
                            Revisar <span className="text-gradient">Guion</span>
                        </h2>
                        <p className="text-[10px] text-zinc-600 mt-1">Edita el texto antes de generar el audio</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.03] px-3 py-1 rounded-full">{wordCount} palabras</span>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">Fase 2/3</span>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 mb-6">
                    <textarea
                        value={editedScript}
                        onChange={(e) => setEditedScript(e.target.value)}
                        className="w-full h-[340px] bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-sm text-zinc-300 focus:border-primary/25 focus:outline-none transition-all font-medium leading-relaxed resize-none custom-scrollbar focus:shadow-[0_0_0_3px_rgba(220,38,38,0.05)]"
                        placeholder="Escribe o edita tu guion aquí..."
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <button onClick={() => { setIsAwaitingScript(false); handleCancel(); }}
                        className="text-[10px] font-bold text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors rounded-full px-4 py-2 hover:bg-red-500/5">
                        Cancelar
                    </button>
                    <button onClick={handleConfirmScript} disabled={isConfirmingScript}
                        className={`btn-primary !py-3 !px-8 ${isConfirmingScript ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isConfirmingScript ? 'Procesando...' : '⚡ Confirmar y Generar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
