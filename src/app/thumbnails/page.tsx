
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiVersionClient } from '@/services/aiVersionClient';
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
    // Sombras (Drop Shadow)
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
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

    // Sistema de Historial (Undo/Redo)
    const [history, setHistory] = useState<Layer[][]>([]);
    const [historyStep, setHistoryStep] = useState<number>(-1);

    const saveToHistory = useCallback((newLayers: Layer[]) => {
        setHistoryStep(step => {
            setHistory(hist => {
                if (hist[step] === newLayers) return hist;
                const newHist = hist.slice(0, step + 1);
                return [...newHist, newLayers];
            });
            return step + 1;
        });
    }, []);

    const handleUndo = useCallback(() => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            setLayers(history[prevStep]);
        }
    }, [history, historyStep]);

    const handleRedo = useCallback(() => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setLayers(history[nextStep]);
        }
    }, [history, historyStep]);

    // Inicializar capa por defecto
    useEffect(() => {
        const initialLayer: Layer = {
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
            shadowColor: 'rgba(0,0,0,0.8)',
            shadowBlur: 20,
            shadowOffsetX: 8,
            shadowOffsetY: 8,
            fontFamily: 'Inter',
            visible: true,
            opacity: 1,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0
        };
        setLayers([initialLayer]);
        setSelectedLayerId('1');

        setHistory([[initialLayer]]);
        setHistoryStep(0);
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

                ctx.shadowColor = layer.shadowColor;
                ctx.shadowBlur = layer.shadowBlur;
                ctx.shadowOffsetX = layer.shadowOffsetX;
                ctx.shadowOffsetY = layer.shadowOffsetY;

                ctx.strokeStyle = layer.strokeColor;
                ctx.lineWidth = layer.strokeWidth;
                ctx.lineJoin = 'round';

                const lines = layer.content.split('\n');
                const lineHeight = layer.fontSize * 1.1;
                const topY = -(lines.length - 1) * lineHeight / 2;

                lines.forEach((line, i) => {
                    const lineY = topY + i * lineHeight;
                    if (layer.strokeWidth > 0) {
                        ctx.strokeText(line, 0, lineY);
                    }
                    ctx.fillStyle = layer.color;
                    ctx.fillText(line, 0, lineY);
                });

                if (selectedLayerId === layer.id) {
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#22c55e'; // Green 500
                    ctx.lineWidth = 3;
                    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
                    const totalHeight = lines.length * lineHeight;
                    ctx.strokeRect(-maxLineWidth / 2 - 15, -totalHeight / 2 - 15, maxLineWidth + 30, totalHeight + 30);
                }
            } else if (layer.type === 'image' && layer.imageElement) {
                ctx.shadowColor = layer.shadowColor;
                ctx.shadowBlur = layer.shadowBlur;
                ctx.shadowOffsetX = layer.shadowOffsetX;
                ctx.shadowOffsetY = layer.shadowOffsetY;

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

        // Dibujar guías magnéticas si está arrastrando cerca del centro
        const selected = layers.find(l => l.id === selectedLayerId);
        if (isDragging && selected) {
            ctx.strokeStyle = '#a855f7'; // Purple 500
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            if (selected.x === canvas.width / 2) {
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();
            }
            if (selected.y === canvas.height / 2) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

    }, [layers, backgroundImage, selectedLayerId, bgFilters, isDragging]);

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
                const lines = layer.content.split('\n');
                const lineHeight = layer.fontSize * 1.1;
                const w = Math.max(...lines.map(l => ctx.measureText(l).width));
                const h = lines.length * lineHeight;
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

        // Snapping a los centros
        const snapThreshold = 15;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        let newX = x - dragOffset.x;
        let newY = y - dragOffset.y;

        if (Math.abs(newX - centerX) < snapThreshold) newX = centerX;
        if (Math.abs(newY - centerY) < snapThreshold) newY = centerY;

        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, x: newX, y: newY } : l
        ));
    };

    const handleMouseUp = () => {
        if (isDragging) {
            saveToHistory(layers);
        }
        setIsDragging(false);
    };

    // Atajos de Teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleRedo();
                else handleUndo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedLayerId) {
                    setLayers(prev => {
                        const next = prev.filter(l => l.id !== selectedLayerId);
                        saveToHistory(next);
                        return next;
                    });
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

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                saveToHistory(layers);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedLayerId, handleUndo, handleRedo, saveToHistory, layers]);

    const addTextLayer = () => {
        const id = Date.now().toString();
        const newLayer: Layer = {
            id, type: 'text', content: 'TEXTO', x: 640, y: 360, fontSize: 100, width: 0, height: 0,
            color: '#ffffff', strokeColor: '#000000', strokeWidth: 10,
            shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
            fontFamily: 'Inter', visible: true,
            opacity: 1, rotation: 0, brightness: 100, contrast: 100, saturation: 100, blur: 0
        };
        const nextLayers = [...layers, newLayer];
        setLayers(nextLayers);
        saveToHistory(nextLayers);
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
                const newLayer: Layer = {
                    id, type: 'image', content: '', x: 640, y: 360, fontSize: 0,
                    width: img.width * ratio, height: img.height * ratio,
                    color: '', strokeColor: '', strokeWidth: 0,
                    shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 15, shadowOffsetX: 5, shadowOffsetY: 5,
                    fontFamily: 'Inter', visible: true,
                    imageElement: img,
                    opacity: 1, rotation: 0, brightness: 100, contrast: 100, saturation: 100, blur: 0
                };
                setLayers(prev => {
                    const next = [...prev, newLayer];
                    saveToHistory(next);
                    return next;
                });
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

        const layer = layers.find(l => l.id === selectedLayerId);
        if (!layer || layer.type !== 'image' || !layer.imageElement) return;

        setLoadingAnalysis(true);
        const response = await aiVersionClient.removeBackground(layer.imageElement.src) as { success: boolean; image?: string; error?: string };

        if (response.success && response.image) {
            const img = new Image();
            img.onload = () => {
                setLayers(prev => {
                    const next = prev.map(l =>
                        l.id === selectedLayerId ? { ...l, imageElement: img } : l
                    );
                    saveToHistory(next);
                    return next;
                });
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
        if (!user) {
            setFeedback('❌ Debes iniciar sesión.');
            return;
        }

        setLoadingAnalysis(true);
        const desc = layers.map(l => `${l.type}: ${l.content || 'imagen'}`).join(', ');
        const response = await aiVersionClient.analyzeThumbnail(desc) as { success: boolean; result?: string; error?: string };

        if (response.success && response.result) {
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
                    <button onClick={handleUndo} disabled={historyStep <= 0} className="bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors" title="Deshacer (Ctrl+Z)">
                        ↩
                    </button>
                    <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors" title="Rehacer (Ctrl+Y o Ctrl+Shift+Z)">
                        ↪
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-1 self-center" />
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
                {/* Layers Panel (Left Sidebar) */}
                <div className="w-[240px] bg-zinc-950 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Capas</h3>
                        <p className="text-[9px] text-zinc-600 mt-1">Navega o reordena los elementos</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {[...layers].reverse().map((l, index) => {
                            const isSelected = selectedLayerId === l.id;
                            const realIndex = layers.findIndex(x => x.id === l.id);
                            return (
                                <div
                                    key={l.id}
                                    onClick={() => setSelectedLayerId(l.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/20 border border-primary/30' : 'hover:bg-zinc-800 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-[10px] grayscale opacity-70">
                                            {l.type === 'image' ? '🖼️' : '📝'}
                                        </span>
                                        <span className="text-[10px] font-bold text-white truncate">
                                            {l.type === 'text' ? (l.content.split('\n')[0] || 'Texto Vacio') : 'Capa de Imagen'}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLayers(prev => { const arr = [...prev]; if (realIndex < arr.length - 1) { const temp = arr[realIndex]; arr[realIndex] = arr[realIndex + 1]; arr[realIndex + 1] = temp; saveToHistory(arr); return arr; } return prev; }) }}
                                                className="text-[10px] bg-zinc-900 p-1 rounded hover:bg-zinc-700 hover:text-white" title="Subir (Traer al frente)">⬆️</button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLayers(prev => { const arr = [...prev]; if (realIndex > 0) { const temp = arr[realIndex]; arr[realIndex] = arr[realIndex - 1]; arr[realIndex - 1] = temp; saveToHistory(arr); return arr; } return prev; }) }}
                                                className="text-[10px] bg-zinc-900 p-1 rounded hover:bg-zinc-700 hover:text-white" title="Bajar (Enviar atrás)">⬇️</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {layers.length === 0 && <p className="text-center text-[10px] text-zinc-600 py-10">Lienzo vacío</p>}
                    </div>
                </div>

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
                                                <textarea
                                                    value={layer.content}
                                                    onChange={(e) => updateLayerProperty(layer.id, 'content', e.target.value)}
                                                    onBlur={() => saveToHistory(layers)}
                                                    className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white resize-y min-h-[60px]"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-zinc-600">Fuente</label>
                                                    <select
                                                        value={layer.fontFamily}
                                                        onChange={(e) => {
                                                            const next = layers.map(l => l.id === layer.id ? { ...l, fontFamily: e.target.value } : l);
                                                            setLayers(next);
                                                            saveToHistory(next);
                                                        }}
                                                        className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white"
                                                    >
                                                        {VIRAL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-zinc-600">Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={layer.color}
                                                            onChange={(e) => updateLayerProperty(layer.id, 'color', e.target.value)}
                                                            onBlur={() => saveToHistory(layers)}
                                                            className="h-8 w-full bg-transparent cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Advanced Text Styling: Trazo y Sombra */}
                                            <div className="space-y-3 pt-2 border-t border-white/5">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-zinc-600 flex justify-between">
                                                            <span>Trazo (Grosor)</span> <span>{layer.strokeWidth}</span>
                                                        </label>
                                                        <input
                                                            type="range" min="0" max="50"
                                                            value={layer.strokeWidth}
                                                            onChange={(e) => updateLayerProperty(layer.id, 'strokeWidth', parseInt(e.target.value))}
                                                            onPointerUp={() => saveToHistory(layers)}
                                                            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="w-12 space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-zinc-600 text-center block">Color</label>
                                                        <input
                                                            type="color" value={layer.strokeColor}
                                                            onChange={(e) => updateLayerProperty(layer.id, 'strokeColor', e.target.value)}
                                                            onBlur={() => saveToHistory(layers)}
                                                            className="h-6 w-full bg-transparent cursor-pointer p-0 border-0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] uppercase font-bold text-zinc-600">Sombra (Drop Shadow)</label>
                                                        <input
                                                            type="color" value={layer.shadowColor}
                                                            onChange={(e) => updateLayerProperty(layer.id, 'shadowColor', e.target.value)}
                                                            onBlur={() => saveToHistory(layers)}
                                                            className="h-5 w-8 bg-transparent cursor-pointer p-0 border-0"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="space-y-1 flex-1">
                                                            <label className="text-[8px] uppercase font-bold text-zinc-500">Difusión</label>
                                                            <input type="range" min="0" max="100" value={layer.shadowBlur} onChange={(e) => updateLayerProperty(layer.id, 'shadowBlur', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                        <div className="space-y-1 flex-1">
                                                            <label className="text-[8px] uppercase font-bold text-zinc-500">Eje X</label>
                                                            <input type="range" min="-50" max="50" value={layer.shadowOffsetX} onChange={(e) => updateLayerProperty(layer.id, 'shadowOffsetX', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                        <div className="space-y-1 flex-1">
                                                            <label className="text-[8px] uppercase font-bold text-zinc-500">Eje Y</label>
                                                            <input type="range" min="-50" max="50" value={layer.shadowOffsetY} onChange={(e) => updateLayerProperty(layer.id, 'shadowOffsetY', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                    </div>
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
                                                    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, width: val, height: val * aspect } : l));
                                                }
                                            }}
                                            onPointerUp={() => saveToHistory(layers)}
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
                                            onPointerUp={() => saveToHistory(layers)}
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
                                            onPointerUp={() => saveToHistory(layers)}
                                            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Image Base Filters */}
                                    <div className="space-y-3 pt-2 border-t border-white/5">
                                        <label className="text-[10px] uppercase font-bold text-zinc-600 block">Filtros Visuales</label>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-zinc-500">Brillo ({layer.brightness}%)</label>
                                                <input type="range" min="0" max="200" value={layer.brightness} onChange={(e) => updateLayerProperty(layer.id, 'brightness', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-zinc-500">Contraste ({layer.contrast}%)</label>
                                                <input type="range" min="0" max="200" value={layer.contrast} onChange={(e) => updateLayerProperty(layer.id, 'contrast', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-zinc-500">Saturación ({layer.saturation}%)</label>
                                                <input type="range" min="0" max="300" value={layer.saturation} onChange={(e) => updateLayerProperty(layer.id, 'saturation', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-zinc-500">Desenfoque ({layer.blur}px)</label>
                                                <input type="range" min="0" max="20" value={layer.blur} onChange={(e) => updateLayerProperty(layer.id, 'blur', parseInt(e.target.value))} onPointerUp={() => saveToHistory(layers)} className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                        </div>
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
