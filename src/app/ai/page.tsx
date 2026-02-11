'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { YOUTUBE_COURSE_KNOWLEDGE } from './knowledge';
import '../globals.css';

export default function AIChat() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hola, Rebelde. Soy VERSION AI, tu estratega de contenido. He cargado el "Master en YouTube" y estoy listo para orquestar tu canal. ¿Qué paso del proceso vamos a automatizar hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('version_user_role');
        if (!role) {
            router.push('/login');
            return;
        }
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (isLoading) return <div className="min-h-screen bg-black" />;

    const getAIResponse = (userInput: string) => {
        const lowerInput = userInput.toLowerCase();

        // Respuestas basadas estrictamente en la base de conocimiento cargada
        if (lowerInput.includes('gancho') || lowerInput.includes('hook')) {
            return "Para un ganar la atención en los primeros 5 segundos (Hook), el Master recomienda: \n\n1. Una pregunta impactante.\n2. Un dato sorprendente o contradictorio.\n3. Mostrar el resultado final de inmediato.\n\nEjemplo: '¿Sabías que el 90% de los canales fallan por no aplicar esta métrica?' o 'He probado [estrategia] por 30 días y este es el resultado inesperado'.";
        }

        if (lowerInput.includes('nicho')) {
            return "La hoja de ruta para elegir un nicho es:\n\n1. Define pasiones y habilidades.\n2. Investiga la demanda en Google Trends y YouTube Analytics.\n3. Define un público objetivo (edad, intereses).\n4. Analiza qué está haciendo la competencia y qué puedes mejorar tú.";
        }

        if (lowerInput.includes('guion') || lowerInput.includes('guión')) {
            return "Estructura técnica recomendada por el sistema:\n\n- **Hook (Gancho):** Los primeros 5 segundos son vitales.\n- **Story (Historia):** Desarrolla el mensaje de forma clara.\n- **Call-to-Action (CTA):** Instruye a la audiencia (Suscribirse, comentar).\n\n¿Quieres que te dé un ejemplo de estructura para un Short o para un video largo de 15 minutos?";
        }

        if (lowerInput.includes('miniatura')) {
            return "Claves para una miniatura VITRAL según VERSION AI:\n\n1. **Contraste:** Usa colores como rojo, amarillo o naranja.\n2. **Texto:** 3 a 5 palabras grandes y legibles.\n3. **Emoción:** Expresiones faciales exageradas.\n4. **Misterio:** Un elemento que genere curiosidad sin revelar todo.";
        }

        if (lowerInput.includes('voz') || lowerInput.includes('audio')) {
            return "Para el audio profesional en el Paso 3:\n\n- **Entorno:** Reduce ruidos con paneles o graba en lugares silenciosos.\n- **Herramientas IA:** ElevenLabs es la recomendación del sistema para narración neuronal.\n- **Música:** Usa Suno, Pixabay o la biblioteca de YouTube para evitar el Copyright.";
        }

        if (lowerInput.includes('si') || lowerInput.includes('claro') || lowerInput.includes('dale')) {
            return "Excelente. Vamos a profundizar. Según el Master en YouTube, el siguiente paso lógico es definir el SEO o la estrategia de miniaturas. ¿Sobre cuál de estos puntos quieres datos específicos ahora?";
        }

        if (lowerInput.includes('seo') || lowerInput.includes('etiquetas') || lowerInput.includes('título')) {
            return "Para optimizar el SEO:\n\n1. Usa **VidiQ** o **Keywords Everywhere** para hallar palabras clave.\n2. El título debe contener la keyword principal al inicio.\n3. La descripción debe ser atractiva y optimizada para buscadores.\n4. No olvides los capítulos de video para mejorar la retención.";
        }

        return "Entendido. Para darte los datos exactos del Master en YouTube, ¿puedes decirme si necesitas ayuda con el Paso 1 (Canal), Paso 2 (Estrategia/Guion), Paso 3 (Recursos) o Paso 4 (Producción/SEO)?";
    }

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const aiContent = getAIResponse(userMessage.content);
            const aiResponse = { role: 'ai', content: aiContent };
            setMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className="flex h-screen bg-black text-white selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-20 hidden md:flex flex-col items-center py-12 border-r border-white/5 bg-zinc-950/20 backdrop-blur-xl shrink-0">
                <Link href="/dashboard" className="text-2xl font-black text-primary mb-12 hover:scale-110 transition-transform">V.</Link>
                <div className="flex flex-col gap-10">
                    <Link href="/dashboard" title="Dashboard" className="text-xl opacity-40 hover:opacity-100 transition-opacity">📊</Link>
                    <span title="AI Chat" className="text-xl cursor-pointer text-primary">🤖</span>
                    <Link href="/editor" title="Video Editor" className="text-xl opacity-40 hover:opacity-100 transition-opacity">🎬</Link>
                    <Link href="/" title="Home" className="text-xl opacity-40 hover:opacity-100 transition-opacity">🌐</Link>
                </div>
            </aside>

            {/* Chat Container */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <header className="p-6 md:px-12 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-sm font-black tracking-[0.3em] uppercase">VERSION <span className="text-primary">AI</span></h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                <span className="text-[9px] text-primary font-black uppercase tracking-widest">Estratega Activo</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-sm">
                            <span className="text-[8px] font-black uppercase text-primary/70 tracking-tighter">Database:</span>
                            <span className="text-[9px] font-black uppercase text-white tracking-widest">YouTube_Master_Data</span>
                        </div>
                    </div>
                </header>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar scroll-smooth"
                >
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full`}>
                            <div className={`${m.role === 'ai' ? 'glass-card !p-6 border-white/5' : 'bg-primary text-white p-6 shadow-xl'} 
                                            max-w-[90%] md:max-w-[80%] text-sm font-medium leading-relaxed whitespace-pre-wrap
                                            ${m.role === 'user' ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`}>
                                {m.content}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-3 px-1">
                                {m.role === 'ai' ? 'Version_Strategist' : 'Authorized_User'}
                            </span>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="max-w-4xl mx-auto w-full">
                            <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">
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
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-600 font-mono"
                        />
                        <button
                            onClick={handleSend}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 px-5 bg-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-hover transition-colors shadow-lg active:scale-95"
                        >
                            Enviar
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
}
