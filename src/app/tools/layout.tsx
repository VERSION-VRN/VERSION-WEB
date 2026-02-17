
import React from 'react';
import Link from 'next/link';

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500 selection:text-white">
            {/* Navbar simple para herramientas */}
            <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold tracking-tighter">
                            VERSION <span className="text-red-500">TOOLS</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/tools/script-generator" className="text-gray-400 hover:text-white transition-colors">
                                Guionista AI
                            </Link>
                            <Link href="/tools/seo-assistant" className="text-gray-400 hover:text-white transition-colors">
                                SEO Viral
                            </Link>
                            {/* <Link href="/tools/thumbnail-analyzer" className="text-gray-400 hover:text-white transition-colors">
                Miniaturas
              </Link> */}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
