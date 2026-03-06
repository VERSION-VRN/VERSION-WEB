'use client';

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface EliteCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    description?: string;
    className?: string;
    variant?: 'glass' | 'solid' | 'borderless';
    footer?: React.ReactNode;
    headerAction?: React.ReactNode;
    glowColor?: string;
    hoverGlow?: boolean;
}

export const EliteCard = ({
    children,
    title,
    subtitle,
    description,
    className = '',
    variant = 'glass',
    footer,
    headerAction,
    glowColor,
    hoverGlow = true
}: EliteCardProps) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 100, damping: 30 });
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["3deg", "-3deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-3deg", "3deg"]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width - 0.5);
        y.set((event.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'glass':
                return {
                    background: 'var(--glass-bg)',
                    borderColor: 'var(--glass-border)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    boxShadow: glowColor
                        ? `0 0 40px ${glowColor}20, var(--shadow-glass)`
                        : 'var(--shadow-glass)',
                };
            case 'solid':
                return {
                    background: 'var(--glass-bg-heavy)',
                    borderColor: 'var(--glass-border)',
                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                    boxShadow: 'var(--shadow-glass)',
                };
            case 'borderless':
                return {
                    background: 'transparent',
                    borderColor: 'transparent',
                    boxShadow: 'none',
                };
        }
    };

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                color: 'var(--foreground)',
                ...getVariantStyles()
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`group/card rounded-3xl p-6 border ${className} relative overflow-hidden transition-all duration-500 hover:border-white/15 liquid-shine`}
        >
            {/* Glass shine overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{ background: 'var(--glass-shine)' }}
            />

            {/* Colored glow orb */}
            <motion.div
                style={{
                    transform: "translateZ(50px)",
                    background: glowColor || 'rgba(99, 102, 241, 0.15)'
                }}
                className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] rounded-full pointer-events-none transition-opacity duration-700 ${hoverGlow ? 'opacity-15 group-hover/card:opacity-30' : 'opacity-10'}`}
            />

            {/* Holographic border accent */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"
                style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06), transparent 50%)',
                }}
            />

            <div style={{ transform: "translateZ(20px)" }} className="relative z-10">
                {(title || headerAction) && (
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            {subtitle && <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">{subtitle}</span>}
                            {title && <h3 className="text-xl font-black tracking-tight uppercase">{title}</h3>}
                            {description && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--muted)' }}>{description}</p>}
                        </div>
                        {headerAction && <div className="mt-1">{headerAction}</div>}
                    </div>
                )}
                <div>{children}</div>
                {footer && (
                    <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--glass-border)' }}>
                        {footer}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
