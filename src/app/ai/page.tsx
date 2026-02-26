'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { aiVersionClient } from '@/services/aiVersionClient';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { User, Terminal } from 'lucide-react';

interface Message {
    role: 'ai' | 'user';
    content: string;
}

export default function AIChat() {
    const { user, deductCredits, refreshCredits } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hola, Rebelde. Soy VERSION AI, tu estratega de contenido. He cargado el "Master en YouTube" y estoy listo para orquestar tu canal. ¿Qué paso del proceso vamos a automatizar hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const handleSend = async () => {
        if (!input.trim()) return;

        const COST = 1;
        if (!user || user.credits < COST) {
            setMessages((prev) => [...prev, { role: 'ai', content: '❌ Saldo insuficiente para procesar tu consulta. (1 token requerido)' }]);
            return;
        }

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);
        deductCredits(COST);

        try {
            const response = await aiVersionClient.chat(userMessage.content);
            if (response.success && response.response) {
                const content = response.response;
                setMessages((prev: Message[]) => [...prev, { role: 'ai', content }]);
            } else {
                setMessages((prev: Message[]) => [...prev, { role: 'ai', content: `❌ Error de sistema: ${response.error || 'No se pudo obtener respuesta.'}` }]);
            }
        } catch (error) {
            setMessages((prev: Message[]) => [...prev, { role: 'ai', content: '❌ Error de conexión con el estratega.' }]);
        } finally {
            setIsTyping(false);
            refreshCredits();
        }
    };

    return (
        <div className="flex h-screen bg-black text-white selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-20 hidden md:flex flex-col items-center py-12 border-r border-white/[0.04] bg-zinc-950/20 backdrop-blur-xl shrink-0">
                <Link href="/dashboard" className="text-2xl font-black text-primary mb-12 hover:scale-110 transition-transform">V.</Link>
                <div className="flex flex-col gap-6">
                    <Link href="/dashboard" title="Dashboard" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg opacity-40 hover:opacity-100 hover:bg-white/[0.04] transition-all">📊</Link>
                    <span title="AI Chat" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-pointer bg-primary/10 border border-primary/15 text-primary">🤖</span>
                    <Link href="/editor" title="Video Editor" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg opacity-40 hover:opacity-100 hover:bg-white/[0.04] transition-all">🎬</Link>
                    <Link href="/" title="Home" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg opacity-40 hover:opacity-100 hover:bg-white/[0.04] transition-all">🌐</Link>
                </div>
            </aside>

            {/* Chat Container */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <header className="p-6 md:px-12 border-b border-white/[0.04] flex justify-between items-center bg-black/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-sm font-black tracking-[0.3em] uppercase">VERSION <span className="text-primary">AI</span></h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Estratega Activo</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full">
                            <span className="text-[8px] font-bold uppercase text-primary/70 tracking-tighter">Database:</span>
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">YouTube_Master_Data</span>
                        </div>
                    </div>
                </header>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar scroll-smooth"
                >
                    {messages.map((m: Message, i: number) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full group/msg`}>
                            <div className={`${m.role === 'ai'
                                ? 'bg-zinc-950/60 backdrop-blur-xl border border-white/[0.06] p-8 rounded-3xl rounded-tl-lg shadow-2xl relative overflow-hidden'
                                : 'bg-primary text-white p-6 rounded-3xl rounded-tr-lg shadow-[0_10px_40px_rgba(220,38,38,0.25)]'
                                } max-w-[90%] md:max-w-[85%] text-sm font-medium leading-relaxed`}>

                                {m.role === 'ai' && (
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
                                )}

                                {m.role === 'ai' ? (
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-200">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                                                h1: ({ children }) => <h1 className="text-xl font-black uppercase tracking-tighter mb-4 text-white">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-lg font-black uppercase tracking-tighter mb-3 text-white/90">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-md font-bold uppercase tracking-widest mb-2 text-primary">{children}</h3>,
                                                ul: ({ children }) => <ul className="space-y-2 mb-4 list-disc list-inside">{children}</ul>,
                                                ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>,
                                                li: ({ children }) => <li className="text-zinc-400">{children}</li>,
                                                code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">{children}</code>,
                                                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-4 italic text-zinc-500 my-4">{children}</blockquote>
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <span className="whitespace-pre-wrap">{m.content}</span>
                                )}
                            </div>
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-4 px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                {m.role === 'ai' ? <><Terminal size={10} className="text-primary" /> Strategist_Shell</> : <><User size={10} /> Authorized_User</>}
                            </span>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="max-w-4xl mx-auto w-full">
                            <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] animate-pulse">
                                Extrayendo datos técnicos...
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-6 md:p-12 bg-gradient-to-t from-black via-black/95 to-transparent">
                    <div className="max-w-4xl mx-auto relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Pregunta por ganchos, nichos, SEO o miniaturas..."
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 pr-28 text-sm focus:outline-none focus:border-primary/30 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.06)] transition-all placeholder:text-zinc-600 font-medium"
                        />
                        <button
                            onClick={handleSend}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            Enviar
                            <span className="px-1.5 py-0.5 bg-black/20 rounded border border-white/10">
                                ⚡ 1
                            </span>
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
}
