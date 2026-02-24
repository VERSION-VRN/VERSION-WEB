'use client';

import React from 'react';
import { useEditor } from '@/context/EditorContext';

export function Step1Resources({
    handleUploadBackground
}: {
    handleUploadBackground: (file: File) => Promise<void>
}) {
    const { formData, setFormData, uploadingBg, statusMessage, uploadProgress } = useEditor();

    return (
        <div className="animate-fade">
            <div className="mb-6">
                <h2 className="text-lg font-black tracking-tight mb-1">Video de Fondo</h2>
                <p className="text-zinc-600 text-xs">Sube el recurso visual base.</p>
            </div>

            {!formData.backgroundVideoPath ? (
                <div className="relative group">
                    <input
                        type="file" accept="video/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadBackground(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={uploadingBg}
                    />
                    <div className="border-2 border-dashed border-white/[0.06] group-hover:border-primary/30 transition-all rounded-3xl py-20 flex flex-col items-center justify-center gap-4 bg-white/[0.01] group-hover:bg-primary/[0.02]">
                        {uploadingBg ? (
                            <>
                                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-zinc-400">{statusMessage}</span>
                                <div className="w-52 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(220,38,38,0.4)]"
                                        style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl text-zinc-600 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                    ↑
                                </div>
                                <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                    Arrastra o selecciona un archivo
                                </span>
                                <span className="text-[10px] text-zinc-700 bg-white/[0.03] px-3 py-1 rounded-full">MP4, MOV, AVI • Hasta 500MB</span>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="border border-white/[0.06] bg-white/[0.02] rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/15 rounded-xl flex items-center justify-center text-primary text-xl">▶</div>
                        <div>
                            <p className="text-sm font-bold truncate max-w-[240px]">{formData.backgroundVideo?.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-[9px] text-green-500/70 font-bold uppercase tracking-wider">Listo</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setFormData({ backgroundVideoPath: '', backgroundVideo: null })}
                        className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-500 transition-all text-sm"
                    >✕</button>
                </div>
            )}
        </div>
    );
}
