'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface EliteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    href?: string;
}

export const EliteButton = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    href,
    className = '',
    disabled,
    ...props
}: EliteButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed border group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black';

    const sizeStyles = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-[11px]',
        lg: 'px-8 py-4 text-xs',
        xl: 'px-10 py-5 text-sm tracking-[0.2em]'
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(135deg, var(--foreground), rgba(255,255,255,0.85))',
                    color: 'var(--background)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.3)',
                };
            case 'secondary':
                return {
                    background: 'var(--glass-bg-heavy)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--glass-border)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: 'var(--shadow-glass)',
                };
            case 'outline':
                return {
                    background: 'var(--glass-bg)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--glass-border)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'var(--muted)',
                    borderColor: 'transparent'
                };
            case 'danger':
                return {
                    background: 'rgba(220, 38, 38, 0.08)',
                    color: '#ef4444',
                    borderColor: 'rgba(220, 38, 38, 0.15)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                };
            case 'success':
                return {
                    background: 'rgba(34, 197, 94, 0.08)',
                    color: '#22c55e',
                    borderColor: 'rgba(34, 197, 94, 0.15)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                };
            default:
                return {};
        }
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    const variantStyle = getVariantStyles();

    const Content = () => (
        <>
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando...</span>
                </div>
            ) : (
                <div className="flex items-center justify-center relative z-10">
                    {leftIcon && <span className="mr-2 opacity-70 transition-opacity group-hover:opacity-100">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2 opacity-70 transition-opacity group-hover:opacity-100">{rightIcon}</span>}
                </div>
            )}

            {/* Liquid shine sweep */}
            <div className="absolute top-[-50%] left-[-100%] w-[60%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[25deg] transition-all duration-700 group-hover:left-[150%] pointer-events-none z-[2]" />
        </>
    );

    const animationProps = {
        whileHover: { scale: 1.02, y: -1 },
        whileTap: { scale: 0.98, y: 0 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
    };

    if (href) {
        return (
            <motion.div {...animationProps} className={widthStyle}>
                <Link
                    href={href}
                    className={`${baseStyles} ${sizeStyles[size]} ${widthStyle} ${className}`}
                    style={variantStyle}
                    aria-disabled={disabled || isLoading}
                    {...(props as any)}
                >
                    <Content />
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.button
            {...animationProps}
            className={`${baseStyles} ${sizeStyles[size]} ${widthStyle} ${className}`}
            style={variantStyle}
            disabled={disabled || isLoading}
            aria-disabled={disabled || isLoading}
            aria-busy={isLoading}
            {...props as any}
        >
            <Content />
        </motion.button>
    );
};
