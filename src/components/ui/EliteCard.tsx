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
    // Definimos estilos basados en variables CSS para que cambien automáticamente con el tema
    const variantStyles = {
        glass: 'backdrop-blur-xl border transition-all duration-300',
        solid: 'border transition-all duration-300',
        borderless: 'transition-all duration-300'
    };

    const variantColors = {
        glass: {
            background: 'var(--glass)',
            borderColor: 'var(--border)'
        },
        solid: {
            background: 'var(--surface)',
            borderColor: 'var(--border)'
        },
        borderless: {
            background: 'transparent',
            borderColor: 'transparent'
        }
    };

    return (
        <div
            className={`rounded-3xl p-6 ${variantStyles[variant]} ${className}`}
            style={{
                backgroundColor: variantColors[variant].background,
                borderColor: variantColors[variant].borderColor,
                color: 'var(--foreground)'
            }}
        >
            {(title || headerAction) && (
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {subtitle && <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">{subtitle}</span>}
                        {title && <h3 className="text-xl font-black tracking-tight uppercase" style={{ color: 'var(--foreground)' }}>{title}</h3>}
                        {description && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--muted)' }}>{description}</p>}
                    </div>
                    {headerAction && <div className="mt-1">{headerAction}</div>}
                </div>
            )}
            <div className="relative">
                {children}
            </div>
            {footer && (
                <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    {footer}
                </div>
            )}
        </div>
    );
};
