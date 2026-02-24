'use client';

import React from 'react';
import { useEditor } from '@/context/EditorContext';

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
    const { formData, setFormData } = useEditor();

    return (
        <div className="animate-fade space-y-5">
            <div className="mb-2">
                <h2 className="text-lg font-black tracking-tight mb-1">Datos del Video</h2>
                <p className="text-zinc-600 text-xs">Define la fuente y título.</p>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">URL de YouTube</label>
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

            {formData.url && isValidYoutubeUrl(formData.url) && (
                <div className="animate-fade-scale flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <img
                        src={getYoutubeThumbnail(formData.url) || ''}
                        alt="Preview"
                        className="w-24 aspect-video object-cover rounded-lg shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Detectado</p>
                        <p className="text-[11px] text-zinc-400 truncate font-medium">{formData.url}</p>
                    </div>
                </div>
            )}

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
    );
}
