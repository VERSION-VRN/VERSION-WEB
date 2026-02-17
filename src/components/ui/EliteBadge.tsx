'use client';

import React from 'react';

interface EliteBadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
    className?: string;
}

export const EliteBadge = ({
    children,
    variant = 'primary',
    className = ''
}: EliteBadgeProps) => {
    const variants = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-white/5 text-zinc-400 border-white/5',
        outline: 'bg-transparent text-white border-white/10',
        success: 'bg-green-500/10 text-green-500 border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        error: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
