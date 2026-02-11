import Link from 'next/link';
import './globals.css';

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Navbar */}
      <nav className="container flex justify-between items-center py-8 border-b border-white/5">
        <div className="text-2xl font-black tracking-tighter uppercase">
          VERSION<span className="text-primary">.</span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="#apps" className="nav-link">Aplicaciones</Link>
          <Link href="#cursos" className="nav-link">Cursos</Link>
          <Link href="/pricing" className="nav-link">Precios</Link>
          <Link href="/login" className="px-5 py-2 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Ingresar</Link>
          <Link href="/dashboard" className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Acceso VIP</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>

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
          <Link href="/dashboard" className="btn-outline w-full md:w-auto text-primary">Unirse a la Élite</Link>
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="container py-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="badge mb-4">Ecosistema 2026</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Armamento <span className="text-primary">Digital</span></h2>
          </div>
          <p className="text-muted-custom max-w-sm text-sm">Herramientas de grado industrial para dominar los algoritmos modernos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* VERSION EDITOR */}
          <div className="glass-card group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">🎬</div>
            <span className="badge border-primary text-primary mb-6">AI Video Engine</span>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">VERSION Editor</h3>
            <p className="text-muted-custom text-sm mb-8 leading-relaxed">
              Generación masiva de contenido corto para YouTube y TikTok. IA que orquesta guion, voz y edición en segundos.
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Web Application</span>
              <Link href="/editor" className="text-primary font-black text-xs uppercase tracking-widest hover:text-white transition-colors">Abrir Terminal →</Link>
            </div>
          </div>

          {/* VERSION AI */}
          <div className="glass-card group relative overflow-hidden ring-1 ring-primary/20">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity text-primary">🤖</div>
            <span className="badge bg-primary/10 border-primary text-primary mb-6 animate-pulse">Neural System</span>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">VERSION AI</h3>
            <p className="text-muted-custom text-sm mb-8 leading-relaxed">
              Tu cerebro digital residente. Consultoría estratégica, redacción y código optimizado por modelos de última generación.
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Link</span>
              <Link href="/ai" className="text-primary font-black text-xs uppercase tracking-widest hover:text-white transition-colors">Iniciar Conexión</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Academy Section */}
      <section id="cursos" className="bg-zinc-950/50 py-32 border-y border-white/5">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade">
            <span className="text-primary font-black tracking-widest text-[10px] uppercase mb-4 block">Formación de Élite</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8 uppercase">
              DEJA DE <br /> <span className="text-primary">CONSUMIR</span>, <br /> EMPIEZA A <br /> CREAR.
            </h2>
            <p className="text-muted-custom text-lg mb-10 max-w-md italic">
              "En la era de la IA, la única moneda real es la capacidad de orquestar máquinas."
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-6 p-4 border border-white/5 hover:border-primary/30 transition-all bg-black/40">
                <span className="text-primary font-black">01</span>
                <div>
                  <h4 className="text-sm font-black uppercase">Master en IA Generativa</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Contenido viral y escalado masivo</p>
                </div>
              </div>
              <div className="flex items-center gap-6 p-4 border border-white/5 hover:border-white/20 transition-all bg-black/40">
                <span className="font-black">02</span>
                <div>
                  <h4 className="text-sm font-black uppercase">Automatización No-Code</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sistemas autónomos de ingresos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-tr from-zinc-900 to-black border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)]"></div>
            <div className="z-10 text-center">
              <div className="text-[10vw] font-black text-white/5 select-none mb-4">REBEL</div>
              <button className="btn-outline border-primary text-primary hover:bg-primary hover:text-white">Acceder a la Academia</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="container py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 text-gradient">Inversión en tu Arsenal</h2>
          <p className="text-muted-custom">Desbloquea el poder total de la automatización.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* STARTER */}
          <div className="glass-card flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8">Access Free</h3>
            <div className="text-5xl font-black mb-8">$0<span className="text-xs text-zinc-500 font-normal">/mes</span></div>
            <ul className="space-y-4 text-xs text-zinc-400 mb-12 text-left w-full">
              <li className="flex items-center gap-3">✓ <span className="uppercase tracking-widest">VERSION AI Chat Acceso</span></li>
              <li className="flex items-center gap-3">✓ <span className="uppercase tracking-widest">Creación de Cuenta Gratis</span></li>
              <li className="flex items-center gap-3 text-zinc-600">✓ <span className="uppercase tracking-widest">Visualización de Herramientas</span></li>
            </ul>
            <Link href="/login" className="btn-outline w-full py-3 text-xs mt-auto text-center">Crear Cuenta Gratis</Link>
          </div>

          {/* FULL VERSION */}
          <div className="glass-card flex flex-col items-center text-center border-primary shadow-[0_0_50px_rgba(220,38,38,0.15)] relative scale-105 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[8px] font-black px-4 py-1 tracking-[0.3em] uppercase">Pack Elite</div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-8">Elite Access</h3>
            <div className="text-5xl font-black mb-8">$29<span className="text-xs text-zinc-500 font-normal">.USD</span></div>
            <ul className="space-y-4 text-xs mb-12 text-left w-full">
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest text-primary font-black">1.000 Tokens (100 Videos)</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">VERSION Editor Desbloqueado</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">VERSION AI Master Knowledge</span></li>
              <li className="flex items-center gap-3 text-white">✓ <span className="uppercase tracking-widest">Soporte Mastermind VIP</span></li>
            </ul>
            <Link href="/pricing" className="btn-primary w-full py-4 text-xs mt-auto text-center">Adquirir Tokens Ahora</Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-24 text-center">
        <h2 className="container text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase italic">¿Vas a ser el arquitecto o el que es reemplazado?</h2>
        <button className="bg-white text-black px-12 py-6 font-black tracking-[0.3em] uppercase hover:bg-black hover:text-white transition-all shadow-2xl">Unirse a VERSION Ahora</button>
      </section>

      {/* Footer */}
      <footer className="container py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-widest">© 2026 VERSION. — Tech Rebel Architecture Systems.</div>
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
          <span className="hover:text-primary transition-colors cursor-pointer">Instagram</span>
          <span className="hover:text-primary transition-colors cursor-pointer">Twitter (X)</span>
          <span className="hover:text-primary transition-colors cursor-pointer">YouTube</span>
        </div>
      </footer>
    </main>
  );
}
