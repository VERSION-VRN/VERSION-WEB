'use client';

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const colors = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    };

    const icons = {
        success: '✨',
        error: '⚠️',
        warning: '🔔',
        info: 'ℹ️'
    };

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
            <div className={`px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center gap-3 min-w-[300px] max-w-md ${colors[type]}`}>
                <span className="text-lg">{icons[type]}</span>
                <p className="text-[11px] font-black tracking-tight uppercase">{message}</p>
                <button onClick={() => setIsVisible(false)} className="ml-auto text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
        </div>
    );
}
