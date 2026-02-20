'use client';

import React from 'react';

interface EliteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const EliteButton = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: EliteButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 border';

    const sizeStyles = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-[11px]',
        lg: 'px-8 py-4 text-xs',
        xl: 'px-10 py-5 text-sm tracking-[0.2em]'
    };

    // Usamos estilos inline o clases que dependen de variables CSS
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--background)',
                    borderColor: 'var(--foreground)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                };
            case 'secondary':
                return {
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border)'
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border)'
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    borderColor: 'transparent'
                };
            case 'danger':
                return {
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    color: '#ef4444',
                    borderColor: 'rgba(220, 38, 38, 0.2)'
                };
            case 'success':
                return {
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    borderColor: 'rgba(34, 197, 94, 0.2)'
                };
            default:
                return {};
        }
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    const variantStyle = getVariantStyles();

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${widthStyle} ${className} ${variant === 'ghost' ? 'hover:bg-primary/5 hover:text-primary' : (variant === 'outline' ? 'hover:bg-foreground hover:text-background' : 'hover:brightness-110')}`}
            style={variantStyle}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando...</span>
                </div>
            ) : (
                <>
                    {leftIcon && <span className="mr-2 opacity-70 transition-opacity group-hover:opacity-100">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2 opacity-70 transition-opacity group-hover:opacity-100">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};
