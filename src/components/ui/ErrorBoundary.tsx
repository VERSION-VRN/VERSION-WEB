'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class VERSIONErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('VERSION Error Critical:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-red-500/30">
                    <div className="max-w-md w-full text-center space-y-8 animate-fade">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(239,68,68,0.15)] mx-auto">
                                ⚠️
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-4 border-black animate-pulse" />
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-black tracking-tighter uppercase">Protocolo de Emergencia</h1>
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest leading-relaxed">
                                Se ha detectado una anomalía crítica en los sistemas.
                                El proceso ha sido aislado para proteger la integridad del usuario.
                            </p>
                        </div>

                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-left overflow-hidden">
                            <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Error Log</div>
                            <div className="text-[10px] font-mono text-red-400/80 break-all line-clamp-2">
                                {this.state.error?.message || 'Unknown protocol violation'}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-white text-black py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Reiniciar Sistemas
                            </button>
                            <Link
                                href="/dashboard"
                                className="text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-widest py-2 transition-colors"
                                onClick={() => this.setState({ hasError: false })}
                            >
                                Volver a la Base (Dashboard)
                            </Link>
                        </div>

                        <div className="pt-8 opacity-20 flex justify-center gap-4">
                            <div className="w-1 h-1 bg-white rounded-full" />
                            <div className="w-1 h-1 bg-white rounded-full" />
                            <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
