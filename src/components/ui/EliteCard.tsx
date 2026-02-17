'use client';

import React from 'react';

interface EliteCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    description?: string;
    className?: string;
    variant?: 'glass' | 'solid' | 'borderless';
    footer?: React.ReactNode;
    headerAction?: React.ReactNode;
}

export const EliteCard = ({
    children,
    title,
    subtitle,
    description,
    className = '',
    variant = 'glass',
    footer,
    headerAction
}: EliteCardProps) => {
    const variants = {
        glass: 'bg-zinc-950/40 backdrop-blur-xl border border-white/[0.04] hover:border-white/[0.08]',
        solid: 'bg-zinc-950 border border-white/5',
        borderless: 'bg-zinc-900/20'
    };

    return (
        <div className={`rounded-3xl p-6 transition-all duration-300 ${variants[variant]} ${className}`}>
            {(title || headerAction) && (
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {subtitle && <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">{subtitle}</span>}
                        {title && <h3 className="text-xl font-black tracking-tight text-white uppercase">{title}</h3>}
                        {description && <p className="text-xs text-zinc-500 mt-1 font-medium">{description}</p>}
                    </div>
                    {headerAction && <div className="mt-1">{headerAction}</div>}
                </div>
            )}
            <div className="relative">
                {children}
            </div>
            {footer && (
                <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-between">
                    {footer}
                </div>
            )}
        </div>
    );
};
