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
    // 3D Tilt state
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 100, damping: 30 });
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
        // Normalización para 0..1
        x.set((event.clientX - rect.left) / rect.width - 0.5);
        y.set((event.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const variantStyles = {
        glass: 'backdrop-blur-xl border',
        solid: 'border',
        borderless: ''
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
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                backgroundColor: variantColors[variant].background,
                borderColor: variantColors[variant].borderColor,
                color: 'var(--foreground)',
                boxShadow: glowColor ? `0 0 40px ${glowColor}${glowColor.length === 7 ? '15' : ''}` : undefined
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`group/card rounded-3xl p-6 ${variantStyles[variant]} ${className} relative overflow-hidden transition-all duration-500 hover:border-white/20`}
        >
            {/* Perspective Overlay Glow */}
            <motion.div
                style={{
                    transform: "translateZ(50px)",
                    background: glowColor || 'rgba(255,255,255,0.05)'
                }}
                className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-opacity duration-500 ${hoverGlow ? 'opacity-20 group-hover/card:opacity-40' : 'opacity-10'}`}
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

                <div>
                    {children}
                </div>

                {footer && (
                    <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        {footer}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
