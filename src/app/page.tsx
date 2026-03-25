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


const APPS = [
  { icon: '🎬', badge: 'Video Engine', badgeColor: 'border-primary text-primary', title: 'VERSION Editor', desc: 'Generación de guion, voz y edición en segundos.', href: '/editor', linkColor: 'text-primary', linkLabel: 'Abrir Terminal' },
  { icon: '🖼️', badge: 'Visual Core', badgeColor: 'border-purple-500 text-purple-500', title: 'VERSION Thumbnails', desc: 'Diseño de miniaturas con análisis de CTR por IA y borrado de fondo.', href: '/thumbnails', linkColor: 'text-purple-500', linkLabel: 'Diseñar Ahora' },
  { icon: '📝', badge: 'Script Engine', badgeColor: 'border-red-500 text-red-500', title: 'VERSION Writer', desc: 'Guiones virales con estructura de retención y Modo Deep.', href: '/writer', linkColor: 'text-red-500', linkLabel: 'Escribir Guion' },
  { icon: '🚀', badge: 'Growth Engine', badgeColor: 'border-green-500 text-green-500', title: 'VERSION SEO', desc: 'Dominación de palabras clave y optimización de metadatos.', href: '/seo', linkColor: 'text-green-500', linkLabel: 'Optimizar' },
  { icon: '📺', badge: 'Channel Manager', badgeColor: 'border-blue-500 text-blue-500', title: 'Mis Canales', desc: 'Gestiona tu flota de canales, logos, banners y videos próximos en cola.', href: '/dashboard/channels', linkColor: 'text-blue-500', linkLabel: 'Gestionar Flota' },
  { icon: '🔍', badge: 'Research Engine', badgeColor: 'border-amber-500 text-amber-500', title: 'VERSION Explorer', desc: 'Explora tendencias y videos virales para potenciar tu canal.', href: '/explorer', linkColor: 'text-amber-500', linkLabel: 'Explorar' },
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

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px] animate-orb-float" />
          <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[130px] animate-orb-float" style={{ animationDelay: '-7s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[120px] animate-orb-float" style={{ animationDelay: '-14s' }} />
        </div>

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
          El poder total de la automatización.
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
              className=""
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


      {/* Pricing Section */}
      <section id="precios" className="container py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">Inversión en tu Arsenal</h2>
          <p className="text-muted-custom">Desbloquea el poder total de la automatización.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <PricingCard
            title="Access Free"
            subtitle="Nivel 1"
            price="0"
            period="/mes"
            features={[
              { text: 'Creación de Cuenta Gratis' },
              { text: 'Acceso al Explorer' }
            ]}
            buttonText="Crear Cuenta Gratis"
            buttonHref="/login"
          />

          <PricingCard
            title="Starter Pack"
            subtitle="Depósito de Recursos"
            price="25"
            period=".USD"
            features={[
              { text: '250 Tokens (~25 Videos)', highlighted: true },
              { text: 'VERSION Editor Desbloqueado' },
              { text: 'Generador Estándar' }
            ]}
            buttonText="Adquirir Starter"
            buttonHref="/pricing"
          />

          <PricingCard
            title="Pro Creator"
            subtitle="Nivel Master"
            price="49"
            period=".USD"
            glowColor="#dc2626"
            isPopular={true}
            badge="Recomendado"
            features={[
              { text: '500 Tokens (~50 Videos)', highlighted: true },
              { text: 'Soporte Prioritario' },
              { text: 'VERSION Editor Desbloqueado' }
            ]}
            buttonText="Adquirir Pro"
            buttonHref="/pricing"
          />

          <PricingCard
            title="Agency Elite"
            subtitle="Producción Masiva"
            price="99"
            period=".USD"
            features={[
              { text: '1.000 Tokens (100 Videos)', highlighted: true },
              { text: 'Soporte VIP 24/7' },
              { text: 'VERSION Editor Desbloqueado' }
            ]}
            buttonText="Adquirir Agency"
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
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 uppercase italic leading-none">REGÍSTRATE Y RECLAMA<br />TU ARSENAL</h2>
          <p className="text-white/80 text-lg md:text-xl font-bold uppercase tracking-widest mb-12">
            TE REGALAMOS <span className="text-white underline decoration-2 underline-offset-4">50 TOKENS</span> CON TU REGISTRO
          </p>
          <EliteButton href="/login?mode=register" variant="secondary" size="xl">
            {user ? 'Ir al Dashboard' : 'Crear Cuenta Gratis'}
          </EliteButton>
        </motion.div>
      </section>


      {/* Footer */}
      <footer className="container py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/[0.04] opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} VERSION. — Tech Rebel Architecture Systems.</div>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          <a href="/#apps" className="hover:text-primary transition-colors">Aplicaciones</a>
          <a href="/pricing" className="hover:text-primary transition-colors">Precios</a>
        </div>
      </footer>
    </main>
  );
}
