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
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const sizeStyles = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-[11px]',
        lg: 'px-8 py-4 text-xs',
        xl: 'px-10 py-5 text-sm tracking-[0.2em]'
    };

    const variantStyles = {
        primary: 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.05)]',
        secondary: 'bg-zinc-900 text-white border border-white/5 hover:bg-zinc-800 hover:border-white/10',
        outline: 'bg-transparent text-white border border-white/10 hover:border-white/30 hover:bg-white/5',
        ghost: 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/5',
        danger: 'bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white',
        success: 'bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]'
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
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
                    {leftIcon && <span className="mr-2 opacity-70">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2 opacity-70">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};
