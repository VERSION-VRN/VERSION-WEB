'use client';

import React from 'react';
import { useEditor } from '@/context/EditorContext';
import { getApiUrl } from '@/lib/api';

const isValidYoutubeUrl = (url: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/.test(url);
};

const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
};

export function Step2Data() {
    const { formData, setFormData, handleUploadThumbnail, uploadingBg } = useEditor();

    return (
        <div className="animate-fade space-y-6">
            <div className="mb-2">
                <h2 className="text-lg font-black tracking-tight mb-1">Datos del Video</h2>
                <p className="text-zinc-600 text-xs">Define la fuente, título y miniatura.</p>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">URL de YouTube (Segmentar)</label>
                <div className="relative group">
                    <input type="url" value={formData.url}
                        onChange={(e) => setFormData({ url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className={`input-field pr-12 ${formData.url && !isValidYoutubeUrl(formData.url) ? 'border-red-500/50' : ''}`} />
                    {formData.url && isValidYoutubeUrl(formData.url) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-fade">✓</div>
                    )}
                </div>
                {formData.url && !isValidYoutubeUrl(formData.url) && (
                    <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-wider ml-1 animate-fade">URL No Válida</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Título del Proyecto</label>
                    <input type="text" value={formData.titulo}
                        onChange={(e) => setFormData({ titulo: e.target.value })}
                        placeholder="Ej: Curiosidades sobre el Espacio"
                        className="input-field" />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                        Texto de Gancho <span className="text-zinc-700">(Opcional)</span>
                    </label>
                    <input type="text" value={formData.miniatura}
                        onChange={(e) => setFormData({ miniatura: e.target.value })}
                        placeholder="Texto breve para la miniatura"
                        className="input-field" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Miniatura del Video</label>

                {!formData.thumbnailPath ? (
                    <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleUploadThumbnail(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={uploadingBg}
                        />
                        <div className="p-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/5 group-hover:border-primary/30 rounded-2xl">
                            {uploadingBg ? (
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="text-xl">🖼️</span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subir Miniatura Personalizada</span>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="liquid-glass p-3 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-9 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                <img src={getApiUrl(formData.thumbnailPath)} alt="Custom Thumb" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Miniatura Subida</p>
                                <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">Imagen lista para el pack</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormData({ thumbnailPath: '' })}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-all flex items-center justify-center text-xs"
                        >✕</button>
                    </div>
                )}

                {formData.url && isValidYoutubeUrl(formData.url) && !formData.thumbnailPath && (
                    <div className="animate-fade flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <img
                            src={getYoutubeThumbnail(formData.url) || ''}
                            alt="Preview"
                            className="w-20 aspect-video object-cover rounded-lg opacity-40 grayscale"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">YT Preview (Solo Ref)</p>
                            <p className="text-[10px] text-zinc-500 truncate">{formData.url}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
