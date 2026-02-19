
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiVersionClient } from '../../services/aiVersionClient';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Layer {
    id: string;
    type: 'text' | 'image';
    content: string; // Texto o DataURL de imagen
    x: number;
    y: number;
    fontSize: number;    // Solo para texto
    width: number;       // Para imágenes
    height: number;      // Para imágenes
    color: string;
    strokeColor: string;
    strokeWidth: number;
    fontFamily: string;
    visible: boolean;
    imageElement?: HTMLImageElement;
    // Nuevas propiedades
    opacity: number;
    rotation: number;
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
}

const VIRAL_FONTS = [
    'Inter', 'Bebas Neue', 'Luckiest Guy', 'Montserrat', 'Roboto', 'Anton'
];

export default function ThumbnailPage() {
    const { user, deductCredits, refreshCredits } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [bgFilters, setBgFilters] = useState({ blur: 0, brightness: 100, contrast: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [feedback, setFeedback] = useState('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // Inicializar capa por defecto
    useEffect(() => {
        setLayers([{
            id: '1',
            type: 'text',
            content: 'EDICIÓN PRO',
            x: 640,
            y: 360,
            fontSize: 150,
            width: 0, height: 0,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 20,
            fontFamily: 'Inter',
            visible: true,
            opacity: 1,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0
        }]);
        setSelectedLayerId('1');
    }, []);

    // Cargar fondo por defecto
    useEffect(() => {
        const img = new Image();
        img.src = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1280&h=720&auto=format&fit=crop';
        img.crossOrigin = "anonymous";
        img.onload = () => setBackgroundImage(img);
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar Fondo
        ctx.save();
        if (backgroundImage) {
            ctx.filter = `blur(${bgFilters.blur}px) brightness(${bgFilters.brightness}%) contrast(${bgFilters.contrast}%)`;
            try {
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                // Fallback si hay error de cross-origin
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        layers.forEach(layer => {
            if (!layer.visible) return;

            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) blur(${layer.blur}px)`;

            ctx.translate(layer.x, layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);

            if (layer.type === 'text') {
                ctx.font = `bold ${layer.fontSize}px '${layer.fontFamily}', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 8;
                ctx.shadowOffsetY = 8;

                ctx.strokeStyle = layer.strokeColor;
                ctx.lineWidth = layer.strokeWidth;
                ctx.lineJoin = 'round';
                ctx.strokeText(layer.content, 0, 0);

                ctx.fillStyle = layer.color;
                ctx.fillText(layer.content, 0, 0);

                if (selectedLayerId === layer.id) {
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#22c55e'; // Green 500
                    ctx.lineWidth = 3;
                    const metrics = ctx.measureText(layer.content);
                    ctx.strokeRect(-metrics.width / 2 - 15, -layer.fontSize / 2 - 15, metrics.width + 30, layer.fontSize + 30);
                }
            } else if (layer.type === 'image' && layer.imageElement) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;

                ctx.drawImage(layer.imageElement, -layer.width / 2, -layer.height / 2, layer.width, layer.height);

                if (selectedLayerId === layer.id) {
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(-layer.width / 2 - 5, -layer.height / 2 - 5, layer.width + 10, layer.height + 10);
                }
            }
            ctx.restore();
        });

    }, [layers, backgroundImage, selectedLayerId, bgFilters]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const clickedLayer = [...layers].reverse().find(layer => {
            if (layer.type === 'text') {
                const ctx = canvas.getContext('2d');
                if (!ctx) return false;
                ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`;
                const metrics = ctx.measureText(layer.content);
                const w = metrics.width;
                const h = layer.fontSize;
                return x >= layer.x - w / 2 && x <= layer.x + w / 2 && y >= layer.y - h / 2 && y <= layer.y + h / 2;
            } else if (layer.type === 'image') {
                return x >= layer.x - layer.width / 2 && x <= layer.x + layer.width / 2 &&
                    y >= layer.y - layer.height / 2 && y <= layer.y + layer.height / 2;
            }
            return false;
        });

        if (clickedLayer) {
            setSelectedLayerId(clickedLayer.id);
            setIsDragging(true);
            setDragOffset({ x: x - clickedLayer.x, y: y - clickedLayer.y });
        } else {
            setSelectedLayerId(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !selectedLayerId) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, x: x - dragOffset.x, y: y - dragOffset.y } : l
        ));
    };

    const handleMouseUp = () => setIsDragging(false);

    // Atajos de Teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedLayerId) {
                    setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
                    setSelectedLayerId(null);
                }
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (selectedLayerId) {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    setLayers(prev => prev.map(l => {
                        if (l.id === selectedLayerId) {
                            if (e.key === 'ArrowUp') return { ...l, y: l.y - step };
                            if (e.key === 'ArrowDown') return { ...l, y: l.y + step };
                            if (e.key === 'ArrowLeft') return { ...l, x: l.x - step };
                            if (e.key === 'ArrowRight') return { ...l, x: l.x + step };
                        }
                        return l;
                    }));
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedLayerId]);

    const addTextLayer = () => {
        const id = Date.now().toString();
        setLayers([...layers, {
            id, type: 'text', content: 'TEXTO', x: 640, y: 360, fontSize: 100, width: 0, height: 0,
            color: '#ffffff', strokeColor: '#000000', strokeWidth: 10, fontFamily: 'Inter', visible: true,
            opacity: 1, rotation: 0, brightness: 100, contrast: 100, saturation: 100, blur: 0
        }]);
        setSelectedLayerId(id);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("⚠️ La imagen es demasiado grande. El tamaño máximo permitido es 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const id = Date.now().toString();
                const ratio = Math.min(400 / img.width, 400 / img.height, 1);
                setLayers(prev => [...prev, {
                    id, type: 'image', content: '', x: 640, y: 360, fontSize: 0,
                    width: img.width * ratio, height: img.height * ratio,
                    color: '', strokeColor: '', strokeWidth: 0, fontFamily: 'Inter', visible: true,
                    imageElement: img,
                    opacity: 1, rotation: 0, brightness: 100, contrast: 100, saturation: 100, blur: 0
                }]);
                setSelectedLayerId(id);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("⚠️ La imagen es demasiado grande. El tamaño máximo permitido es 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => setBackgroundImage(img);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const updateLayerProperty = <K extends keyof Layer>(id: string, property: K, value: Layer[K]) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, [property]: value } : l));
    };

    const removeBackground = async () => {
        if (!selectedLayerId) return;
        const COST = 20;

        if (!user || user.credits < COST) {
            alert(`❌ Saldo insuficiente. Necesitas ${COST} tokens.`);
            return;
        }

        const layer = layers.find(l => l.id === selectedLayerId);
        if (!layer || layer.type !== 'image' || !layer.imageElement) return;

        setLoadingAnalysis(true);
        const response = await aiVersionClient.removeBackground(layer.imageElement.src);

        if (response.success && response.image) {
            deductCredits(COST);
            const img = new Image();
            img.onload = () => {
                setLayers(prev => prev.map(l =>
                    l.id === selectedLayerId ? { ...l, imageElement: img } : l
                ));
                setLoadingAnalysis(false);
                refreshCredits();
            };
            img.src = response.image;
        } else {
            alert("Error: " + (response.error || "Fallo desconocido"));
            setLoadingAnalysis(false);
            refreshCredits();
        }
    };

    const analyzeThumbnail = async () => {
        const COST = 10;
        if (!user || user.credits < COST) {
            setFeedback(`❌ Saldo insuficiente. Necesitas ${COST} tokens.`);
            return;
        }

        setLoadingAnalysis(true);
        const desc = layers.map(l => `${l.type}: ${l.content || 'imagen'}`).join(', ');
        const response = await aiVersionClient.analyzeThumbnail(desc);

        if (response.success && response.result) {
            deductCredits(COST);
            setFeedback(response.result);
            refreshCredits();
        } else {
            setFeedback("Error al analizar.");
            refreshCredits();
        }
        setLoadingAnalysis(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-20">
            {/* Google Fonts Pre-load */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Luckiest+Guy&family=Montserrat:wght@900&family=Roboto:wght@900&display=swap');
            `}} />

            <Link href="/dashboard" className="text-zinc-500 hover:text-white mb-6 block text-xs font-bold tracking-widest uppercase">← Volver al Dashboard</Link>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter">
                    VERSION <span className="text-purple-500">THUMBNAILS</span>
                </h1>
                <div className="flex gap-2">
                    <button onClick={addTextLayer} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors">
                        + Texto
                    </button>
                    <label className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors cursor-pointer">
                        + Imagen
                        <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                    </label>
                    <label className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors cursor-pointer">
                        🖼️ Fondo
                        <input type="file" hidden onChange={handleBackgroundUpload} accept="image/*" />
                    </label>
                    <button
                        onClick={() => selectedLayerId && setLayers(prev => prev.filter(l => l.id !== selectedLayerId))}
                        disabled={!selectedLayerId}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>

            <div className="flex gap-6 h-[75vh]">
                {/* Canvas Area */}
                <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative shadow-2xl">
                    <div className="border border-white/10 shadow-xl w-full max-w-[80%] aspect-video">
                        <canvas
                            ref={canvasRef}
                            width={1280}
                            height={720}
                            className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-[320px] bg-zinc-950 border border-white/5 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto">
                    {selectedLayerId ? (() => {
                        const layer = layers.find(l => l.id === selectedLayerId);
                        if (!layer) return null;
                        return (
                            <>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Propiedades</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => {
                                            const l = layers.find(x => x.id === selectedLayerId);
                                            if (l) setLayers([...layers.filter(x => x.id !== selectedLayerId), l]);
                                        }} className="text-[10px] bg-zinc-800 p-1 rounded hover:bg-zinc-700">⬆️</button>
                                        <button onClick={() => {
                                            const l = layers.find(x => x.id === selectedLayerId);
                                            if (l) setLayers([l, ...layers.filter(x => x.id !== selectedLayerId)]);
                                        }} className="text-[10px] bg-zinc-800 p-1 rounded hover:bg-zinc-700">⬇️</button>
                                    </div>
                                </div>

                                {layer.type === 'image' && (
                                    <button
                                        onClick={removeBackground}
                                        disabled={loadingAnalysis}
                                        className="w-full py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loadingAnalysis ? 'Procesando...' : '✨ Borrar Fondo AI'}
                                    </button>
                                )}

                                <div className="space-y-4">
                                    {layer.type === 'text' && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-600">Contenido</label>
                                                <input
                                                    type="text"
                                                    value={layer.content}
                                                    onChange={(e) => updateLayerProperty(layer.id, 'content', e.target.value)}
                                                    className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-600">Fuente</label>
                                                <select
                                                    value={layer.fontFamily}
                                                    onChange={(e) => updateLayerProperty(layer.id, 'fontFamily', e.target.value)}
                                                    className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white"
                                                >
                                                    {VIRAL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-600">Color</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={layer.color} onChange={(e) => updateLayerProperty(layer.id, 'color', e.target.value)} className="h-8 w-full bg-transparent cursor-pointer" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-zinc-600 flex justify-between">
                                            <span>Tamaño</span> <span>{layer.type === 'text' ? layer.fontSize : Math.round(layer.width)}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="10"
                                            max={layer.type === 'text' ? "400" : "1500"}
                                            value={layer.type === 'text' ? layer.fontSize : layer.width}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (layer.type === 'text') {
                                                    updateLayerProperty(layer.id, 'fontSize', val);
                                                } else if (layer.imageElement) {
                                                    const aspect = layer.imageElement.height / layer.imageElement.width;
                                                    setLayers(layers.map(l => l.id === selectedLayerId ? { ...l, width: val, height: val * aspect } : l));
                                                }
                                            }}
                                            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-zinc-600 flex justify-between">
                                            <span>Rotación</span> <span>{layer.rotation}°</span>
                                        </label>
                                        <input
                                            type="range" min="-180" max="180"
                                            value={layer.rotation}
                                            onChange={(e) => updateLayerProperty(layer.id, 'rotation', parseInt(e.target.value))}
                                            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-zinc-600 flex justify-between">
                                            <span>Opacidad</span> <span>{Math.round(layer.opacity * 100)}%</span>
                                        </label>
                                        <input
                                            type="range" min="0" max="1" step="0.01"
                                            value={layer.opacity}
                                            onChange={(e) => updateLayerProperty(layer.id, 'opacity', parseFloat(e.target.value))}
                                            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </>
                        );
                    })() : (
                        <div className="text-center text-zinc-600 text-xs py-10">
                            Selecciona un elemento para editar
                        </div>
                    )}

                    <div className="border-t border-white/10 pt-6 mt-auto">
                        <button
                            onClick={analyzeThumbnail}
                            disabled={loadingAnalysis}
                            className="w-full py-3 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 border border-purple-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-3 flex items-center justify-center gap-2"
                        >
                            {loadingAnalysis ? 'Analizando...' : '👁️ Analizar CTR (IA)'}
                        </button>
                        <button
                            onClick={() => {
                                const canvas = canvasRef.current;
                                if (!canvas) return;
                                const link = document.createElement('a');
                                link.download = 'version-thumb.png';
                                link.href = canvas.toDataURL();
                                link.click();
                            }}
                            className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Descargar PNG
                        </button>
                    </div>
                </div>
            </div>

            {feedback && (
                <div className="mt-8 animate-fade-in-up">
                    <div className="bg-zinc-950 p-6 rounded-2xl border-l-4 border-purple-500">
                        <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Feedback Estratégico</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap">{feedback}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
