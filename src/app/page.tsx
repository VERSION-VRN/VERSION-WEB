'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const STATS = [
  { value: '5', label: 'Herramientas AI' },
  { value: '100%', label: 'En la nube' },
  { value: '24/7', label: 'Disponible' },
  { value: '2026', label: 'En producción' },
];

const APPS = [
  { icon: '🎬', badge: 'Video Engine', badgeColor: 'border-primary text-primary', title: 'VERSION Editor', desc: 'Generación de guion, voz y edición en segundos.', href: '/editor', linkColor: 'text-primary', linkLabel: 'Abrir Terminal' },
  { icon: '🖼️', badge: 'Visual Core', badgeColor: 'border-purple-500 text-purple-500', title: 'VERSION Thumbnails', desc: 'Diseño de miniaturas con análisis de CTR por IA y borrado de fondo.', href: '/thumbnails', linkColor: 'text-purple-500', linkLabel: 'Diseñar Ahora' },
  { icon: '📝', badge: 'Script Engine', badgeColor: 'border-red-500 text-red-500', title: 'VERSION Writer', desc: 'Guiones virales con estructura de retención y Modo Deep.', href: '/writer', linkColor: 'text-red-500', linkLabel: 'Escribir Guion' },
  { icon: '🚀', badge: 'Growth Engine', badgeColor: 'border-green-500 text-green-500', title: 'VERSION SEO', desc: 'Dominación de palabras clave y optimización de metadatos.', href: '/seo', linkColor: 'text-green-500', linkLabel: 'Optimizar' },
  { icon: '🤖', badge: 'Neural System', badgeColor: 'border-primary text-primary', title: 'VERSION AI', desc: 'Tu cerebro digital residente. Consultoría estratégica total.', href: '/ai', linkColor: 'text-primary', linkLabel: 'Iniciar Conexión', wide: true },
];

export default function Home() {
  const { user } = useAuth();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const el = document.querySelectorAll('.section-enter');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    el.forEach(e => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* Navbar con estado de auth */}
      <Navbar variant="public" />

      {/* Hero Section */}
      <section className="container py-24 md:py-32 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />

        <h1 className="animate-fade text-[clamp(2.5rem,12vw,9rem)] font-black leading-[0.85] tracking-tighter mb-8 uppercase">
          VERSION <br />
          <span className="text-primary">—</span> AUTOMATIZA <br />
          TU CREATIVIDAD
        </h1>

        <p className="animate-fade opacity-0 [animation-delay:200ms] text-muted-custom text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
          La plataforma definitiva de IA y automatización diseñada para la nueva élite de creadores digitales.
        </p>

        <div className="animate-fade opacity-0 [animation-delay:400ms] flex flex-col md:flex-row gap-4 justify-center items-center">
          <Link href="#apps" className="btn-primary w-full md:w-auto">Explorar Ecosistema</Link>
          <Link href={user ? '/dashboard' : '/login'} className="btn-outline w-full md:w-auto text-primary">
            {user ? 'Ir al Dashboard →' : 'Unirse a la Élite'}
          </Link>
        </div>

        {/* Stats bar */}
        <div className="animate-fade opacity-0 [animation-delay:600ms] flex flex-wrap justify-center gap-8 mt-20 border-t border-white/[0.04] pt-12">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="container py-24 border-t border-white/[0.04]">
        <div className="section-enter flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="badge mb-4">Ecosistema 2026</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Armamento <span className="text-primary">Digital</span></h2>
          </div>
          <p className="text-muted-custom max-w-sm text-sm">Herramientas de grado industrial para dominar los algoritmos modernos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {APPS.map((app, i) => (
            <div key={app.title} className={`section-enter glass-card group relative overflow-hidden ${app.wide ? 'ring-1 ring-primary/15 md:col-span-2 lg:col-span-1' : ''}`}
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="absolute top-0 right-0 p-5 text-3xl opacity-10 group-hover:opacity-100 transition-opacity duration-500">{app.icon}</div>
              <span className={`badge border-2 mb-6 ${app.badgeColor} ${app.wide ? 'animate-pulse bg-primary/5' : ''}`}>{app.badge}</span>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{app.title}</h3>
              <p className="text-muted-custom text-sm mb-8 leading-relaxed">{app.desc}</p>
              <Link href={app.href} className={`${app.linkColor} font-bold text-xs uppercase tracking-widest hover:text-white transition-colors`}>
                {app.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Academy Section */}
      <section id="cursos" className="bg-zinc-950/50 py-32 border-y border-white/[0.04]">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="section-enter">
            <span className="text-primary font-bold tracking-widest text-[10px] uppercase mb-4 block">Formación de Élite</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8 uppercase">
              DEJA DE <br /> <span className="text-primary">CONSUMIR</span>, <br /> EMPIEZA A <br /> CREAR.
            </h2>
            <p className="text-muted-custom text-lg mb-10 max-w-md italic">
              &quot;En la era de la IA, la única moneda real es la capacidad de orquestar máquinas.&quot;
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-6 p-5 border border-primary/20 hover:border-primary/40 transition-all bg-primary/[0.03] rounded-2xl group">
                <span className="text-primary font-black text-lg">01</span>
                <div>
                  <h4 className="text-sm font-black uppercase">Master en IA Generativa</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Contenido viral y escalado masivo</p>
                </div>
              </div>
              <div className="flex items-center gap-6 p-5 border border-white/[0.04] hover:border-white/15 transition-all bg-black/40 rounded-2xl">
                <span className="font-black text-lg">02</span>
                <div>
                  <h4 className="text-sm font-black uppercase">Automatización No-Code</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sistemas autónomos de ingresos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="section-enter relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-tr from-zinc-900 to-black border border-white/[0.06] flex items-center justify-center overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)]" />
            <div className="z-10 text-center">
              <div className="text-[10vw] font-black text-white/5 select-none mb-4">REBEL</div>
              <Link href={user ? '/dashboard' : '/login'} className="btn-outline border-primary text-primary hover:bg-primary hover:text-white">
                Acceder a la Academia
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="container py-32">
        <div className="section-enter text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 text-gradient">Inversión en tu Arsenal</h2>
          <p className="text-muted-custom">Desbloquea el poder total de la automatización.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="section-enter glass-card flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8">Access Free</h3>
            <div className="text-5xl font-black mb-8">$0<span className="text-xs text-zinc-500 font-normal">/mes</span></div>
            <ul className="space-y-4 text-xs text-zinc-400 mb-12 text-left w-full">
              <li className="flex items-center gap-3">✓ <span className="uppercase tracking-widest">VERSION AI Chat Acceso</span></li>
              <li className="flex items-center gap-3">✓ <span className="uppercase tracking-widest">Creación de Cuenta Gratis</span></li>
              <li className="flex items-center gap-3 text-zinc-600">✓ <span className="uppercase tracking-widest">Visualización de Herramientas</span></li>
            </ul>
            <Link href="/login" className="btn-outline w-full py-3 text-xs mt-auto text-center">Crear Cuenta Gratis</Link>
          </div>

          <div className="section-enter glass-card flex flex-col items-center text-center border-primary shadow-[0_0_50px_rgba(220,38,38,0.1)] relative scale-105 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[8px] font-bold px-5 py-1.5 tracking-[0.3em] uppercase rounded-full shadow-[0_4px_15px_rgba(220,38,38,0.3)] animate-glow-pulse">Pack Elite</div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-8 mt-2">Elite Access</h3>
            <div className="text-5xl font-black mb-8">$29<span className="text-xs text-zinc-500 font-normal">.USD</span></div>
            <ul className="space-y-4 text-xs mb-12 text-left w-full">
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest text-primary font-bold">1.000 Tokens (100 Videos)</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">VERSION Editor Desbloqueado</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">VERSION AI Master Knowledge</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">Soporte Mastermind VIP</span></li>
            </ul>
            <Link href="/pricing" className="btn-primary w-full py-4 text-xs mt-auto text-center">Adquirir Tokens Ahora</Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-24 text-center rounded-t-[3rem]">
        <h2 className="container text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase italic">¿Vas a ser el arquitecto o el que es reemplazado?</h2>
        <Link href={user ? '/dashboard' : '/login'}
          className="bg-white text-black px-12 py-5 font-black tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all shadow-2xl rounded-full inline-block">
          {user ? 'Ir al Dashboard' : 'Unirse a VERSION Ahora'}
        </Link>
      </section>

      {/* Footer */}
      <footer className="container py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/[0.04] opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} VERSION. — Tech Rebel Architecture Systems.</div>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Twitter (X)</a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">YouTube</a>
        </div>
      </footer>
    </main>
  );
}
