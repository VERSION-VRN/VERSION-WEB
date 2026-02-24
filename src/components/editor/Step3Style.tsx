'use client';

import React from 'react';
import { useEditor } from '@/context/EditorContext';
import { SkeletonEditorConfig } from '@/components/ui/Skeleton';

const DEFAULT_SUBTITLE_STYLES = ["Clásico", "Dinámico (Efusivo)", "Moderno", "Impacto", "Limpio (Caja)"];
const DEFAULT_SUBTITLE_COLORS = ["Blanco", "Amarillo", "Rojo", "Azul", "Verde", "Cian", "Magenta", "Naranja", "Gris"];
const DEFAULT_SUBTITLE_POSITIONS = ["Abajo", "Centro", "Arriba"];

const COLOR_MAP: Record<string, string> = {
    "Blanco": "#FFFFFF",
    "Amarillo": "#FFFF00",
    "Rojo": "#FF0000",
    "Azul": "#0000FF",
    "Verde": "#00FF00",
    "Cian": "#00FFFF",
    "Magenta": "#FF00FF",
    "Naranja": "#FFA500",
    "Gris": "#808080"
};

const OptionPill = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-xl text-left ${selected
            ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(220,38,38,0.1)]'
            : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
            }`}
    >
        {children}
    </button>
);

const OptionPillAlt = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-xl text-left ${selected
            ? 'bg-white text-black border border-white shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
            : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
            }`}
    >
        {children}
    </button>
);

export function Step3Style({
    isLoadingConfig,
    configError,
    handleIdiomaChange
}: {
    isLoadingConfig: boolean;
    configError: string;
    handleIdiomaChange: (lang: string) => void;
}) {
    const {
        metadata,
        selectedIdioma,
        selectedVoice, setSelectedVoice,
        selectedPrompt, setSelectedPrompt,
        selectedSubtitleStyle, setSelectedSubtitleStyle,
        selectedSubtitleColor, setSelectedSubtitleColor,
        selectedSubtitlePosition, setSelectedSubtitlePosition,
        targetLength, setTargetLength
    } = useEditor();

    if (isLoadingConfig) return <SkeletonEditorConfig />;
    if (configError) return <div className="p-10 text-center border border-red-500/20 bg-red-500/5 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest">{configError}</div>;
    if (!metadata) return null;

    return (
        <div className="animate-fade">
            <div className="mb-6">
                <h2 className="text-lg font-black tracking-tight mb-1">Personalización</h2>
                <p className="text-zinc-600 text-xs">Voz, idioma y estilo visual.</p>
            </div>

            <div className="space-y-8">
                {/* Idioma & Voz */}
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Idioma</label>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                            {metadata.idiomas.map(lang => (
                                <OptionPill key={lang} selected={selectedIdioma === lang} onClick={() => handleIdiomaChange(lang)}>
                                    {lang}
                                </OptionPill>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Voz IA</label>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                            {metadata.voices[selectedIdioma]?.map(v => (
                                <OptionPillAlt key={v.id} selected={selectedVoice === v.id} onClick={() => setSelectedVoice(v.id)}>
                                    {v.name}
                                </OptionPillAlt>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subtítulos */}
                <div className="border-t border-white/[0.04] pt-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Estilo Subtítulos</label>
                            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                {(metadata.subtitle_styles?.length ? metadata.subtitle_styles : DEFAULT_SUBTITLE_STYLES).map(style => (
                                    <OptionPill key={style} selected={selectedSubtitleStyle === style} onClick={() => setSelectedSubtitleStyle(style)}>
                                        {style}
                                    </OptionPill>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Color</label>
                            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                {(metadata.subtitle_colors?.length ? metadata.subtitle_colors : DEFAULT_SUBTITLE_COLORS).map(color => (
                                    <OptionPillAlt key={color} selected={selectedSubtitleColor === color} onClick={() => setSelectedSubtitleColor(color)}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: COLOR_MAP[color] || '#FFFFFF' }}
                                            />
                                            <span>{color}</span>
                                        </div>
                                    </OptionPillAlt>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Posición</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(metadata.subtitle_positions?.length ? metadata.subtitle_positions : DEFAULT_SUBTITLE_POSITIONS).map(pos => (
                                <button key={pos} onClick={() => setSelectedSubtitlePosition(pos)}
                                    className={`py-3 text-[10px] font-bold uppercase tracking-wider transition-all rounded-xl text-center border ${selectedSubtitlePosition === pos
                                        ? 'bg-primary text-white border-primary rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.15)]'
                                        : 'bg-white/[0.03] text-zinc-600 border-white/[0.06] hover:border-white/15'
                                        }`}>
                                    {pos === "Arriba" ? "↑ Arriba" : pos === "Centro" ? "— Centro" : "↓ Abajo"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Longitud del Guion */}
                <div className="border-t border-white/[0.04] pt-6 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">Longitud del Guion</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'short', label: 'Corto', detail: '~5 min • 5 Tokens' },
                            { id: 'medium', label: 'Medio', detail: '~15 min • 10 Tokens' },
                            { id: 'long', label: 'Largo', detail: '30+ min • 20 Tokens' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setTargetLength(opt.id as any)}
                                className={`p-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${targetLength === opt.id
                                    ? 'bg-primary/10 border-primary text-primary shadow-[0_4_12px_rgba(220,38,38,0.1)]'
                                    : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:border-white/20'
                                    }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                <span className="text-[8px] font-medium opacity-60 tracking-wider whitespace-nowrap">{opt.detail}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estrategia */}
                <div className="border-t border-white/[0.04] pt-6 space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Estrategia de Guion</label>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {metadata.prompts[selectedIdioma]?.map(p => (
                            <button key={p.name} onClick={() => setSelectedPrompt(p.name)}
                                className={`px-4 py-3 text-left transition-all rounded-xl border ${selectedPrompt === p.name
                                    ? 'bg-primary/10 border-primary/25'
                                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                                    }`}>
                                <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedPrompt === p.name ? 'text-primary' : 'text-white'}`}>{p.name}</div>
                                <div className="text-[9px] text-zinc-600 line-clamp-1 mt-0.5">{p.prompt}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
