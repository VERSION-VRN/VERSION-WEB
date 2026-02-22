'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import dynamic from 'next/dynamic';
const HeroBackground = dynamic(() => import('@/components/visual/HeroBackground').then(mod => mod.HeroBackground), { ssr: false });
import { motion } from 'framer-motion';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteButton } from '@/components/ui/EliteButton';
import { PricingCard } from '@/components/ui/PricingCard';
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

  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* Navbar con estado de auth */}
      <Navbar variant="public" />

      {/* Hero Section */}
      <section className="container py-32 md:py-48 text-center relative min-h-[90vh] flex flex-col justify-center items-center">
        <HeroBackground />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2.5rem,10vw,8rem)] font-black leading-[0.8] tracking-tighter mb-8 uppercase"
        >
          VERSION <br />
          <span className="text-primary">—</span> AUTOMATIZA <br />
          TU CREATIVIDAD
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-custom text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium"
        >
          La plataforma definitiva de IA y automatización diseñada para la nueva élite de creadores digitales.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <EliteButton href="#apps" size="xl" className="w-full md:w-auto">Explorar Ecosistema</EliteButton>
          <EliteButton href={user ? '/dashboard' : '/login'} variant="outline" size="xl" className="w-full md:w-auto">
            {user ? 'Ir al Dashboard' : 'Unirse a la Élite'}
          </EliteButton>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-wrap justify-center gap-8 mt-20 border-t border-white/[0.04] pt-12"
        >
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="container py-24 border-t border-white/[0.04]">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">Ecosistema 2026</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Armamento <span className="text-primary">Digital</span></h2>
          </div>
          <p className="text-muted-custom max-w-sm text-sm">Herramientas de grado industrial para dominar los algoritmos modernos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {APPS.map((app, i) => (
            <motion.div
              key={app.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={app.wide ? 'md:col-span-2 lg:col-span-1' : ''}
            >
              <EliteCard
                title={app.title}
                subtitle={app.badge}
                description={app.desc}
                glowColor={app.badgeColor.includes('red') ? '#dc2626' : (app.badgeColor.includes('purple') ? '#a855f7' : '#dc2626')}
                className="h-full"
                footer={
                  <EliteButton href={app.href} variant="outline" size="sm" className="w-full md:w-auto">
                    {app.linkLabel}
                  </EliteButton>
                }
              >
                <div className="absolute top-0 right-0 p-8 text-4xl opacity-5 group-hover/card:opacity-20 transition-all duration-700 rotate-12 group-hover/card:rotate-0">
                  {app.icon}
                </div>
              </EliteCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Academy Section */}
      <section id="cursos" className="bg-zinc-950/50 py-32 border-y border-white/[0.04]">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-tr from-zinc-900 to-black border border-white/[0.06] flex items-center justify-center overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)]" />
            <div className="z-10 text-center">
              <div className="text-[10vw] font-black text-white/5 select-none mb-4">REBEL</div>
              <EliteButton href={user ? '/dashboard' : '/login'} variant="outline">
                Acceder a la Academia
              </EliteButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="container py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">Inversión en tu Arsenal</h2>
          <p className="text-muted-custom">Desbloquea el poder total de la automatización.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            title="Access Free"
            subtitle="Nivel 1"
            price="0"
            period="/mes"
            features={[
              { text: 'VERSION AI Chat Acceso' },
              { text: 'Creación de Cuenta Gratis' }
            ]}
            buttonText="Crear Cuenta Gratis"
            buttonHref="/login"
          />

          <PricingCard
            title="Elite Access"
            subtitle="Nivel Master"
            price="29"
            period=".USD"
            glowColor="#dc2626"
            isPopular={true}
            badge="Pack Elite"
            features={[
              { text: '1.000 Tokens (100 Videos)', highlighted: true },
              { text: 'VERSION Editor Desbloqueado' }
            ]}
            buttonText="Adquirir Tokens Ahora"
            buttonHref="/pricing"
          />
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-32 text-center rounded-t-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container relative z-10"
        >
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-12 uppercase italic leading-none">¿VAS A SER EL ARQUITECTO<br />O EL QUE ES REEMPLAZADO?</h2>
          <EliteButton href={user ? '/dashboard' : '/login'} variant="secondary" size="xl">
            {user ? 'Ir al Dashboard' : 'Unirse a VERSION Ahora'}
          </EliteButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/[0.04] opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} VERSION. — Tech Rebel Architecture Systems.</div>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Instagram</a>
          <a href="#" className="hover:text-primary transition-colors">Twitter (X)</a>
          <a href="#" className="hover:text-primary transition-colors">YouTube</a>
        </div>
      </footer>
    </main>
  );
}
