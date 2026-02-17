'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCredits } from '@/context/CreditsContext';
import { getAIResponse, getContextualSkillResponse } from '@/services/aiResponseService';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';

export const EliteAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSkillTip, setShowSkillTip] = useState(false);
    const [lastPath, setLastPath] = useState('');

    const pathname = usePathname();
    const { credits, deductLocal, refreshCredits } = useCredits();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Contextual detection
    useEffect(() => {
        if (pathname !== lastPath) {
            const skillMessage = getContextualSkillResponse(pathname);
            if (skillMessage) {
                setShowSkillTip(true);
                // Trigger an AI message if it's the first time on this tool
                if (messages.length === 0) {
                    setMessages([{ role: 'ai', content: skillMessage }]);
                }
            }
            setLastPath(pathname);
        }
    }, [pathname, lastPath, messages.length]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const COST = 1;
        if (credits < COST) {
            setMessages(prev => [...prev, { role: 'ai', content: '❌ Saldo insuficiente.' }]);
            return;
        }

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        deductLocal(COST);

        setTimeout(() => {
            const aiContent = getAIResponse(userMsg.content);
            setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
            setIsTyping(false);
            refreshCredits();
        }, 800);
    };

    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            {/* Contextual Tip */}
            {showSkillTip && !isOpen && (
                <div className="bg-zinc-950/80 backdrop-blur-md border border-primary/20 p-3 rounded-2xl shadow-2xl animate-bounce-slow max-w-[200px] relative">
                    <button
                        onClick={() => setShowSkillTip(false)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-[8px]"
                    >
                        ✕
                    </button>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">Elite Skill Activa</p>
                    <p className="text-[10px] text-zinc-300 leading-tight">Pulsa para asistencia técnica en esta sección.</p>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <EliteCard
                    variant="glass"
                    title="VERSION Elite"
                    subtitle="Neural Support"
                    className="w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-primary/10 animate-fade-up"
                    headerAction={
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    }
                >
                    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-0">
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <div className="text-3xl mb-4 group-hover:animate-pulse">🤖</div>
                                <p className="text-xs text-zinc-500 font-medium">Hola Rebelde. Soy tu soporte integrado. ¿Qué datos del Master necesitas?</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'ai'
                                        ? 'bg-white/[0.03] border border-white/[0.05] text-zinc-300 rounded-tl-none'
                                        : 'bg-primary text-white rounded-tr-none'
                                    } max-w-[85%]`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-1 items-center px-1">
                                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/[0.04]">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu consulta..."
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 pr-20 text-xs focus:outline-none focus:border-primary/30 transition-all font-medium"
                            />
                            <button
                                onClick={handleSend}
                                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all active:scale-95"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </EliteCard>
            )}

            {/* Floating Orb Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); setShowSkillTip(false); }}
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-500 shadow-2xl relative group
                    ${isOpen ? 'bg-zinc-900 border border-white/5 scale-90 rotate-90' : 'bg-black border border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]'}
                `}
            >
                <div className={`absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-20 ${isOpen ? 'hidden' : ''}`} />
                <span className={isOpen ? 'text-zinc-500' : 'group-hover:scale-110 transition-transform'}>
                    {isOpen ? '✕' : '🤖'}
                </span>

                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-black flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                        !
                    </div>
                )}
            </button>
        </div>
    );
};
