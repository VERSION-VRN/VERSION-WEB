'use client';

import React from 'react';

interface EliteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const EliteInput = ({
    label,
    error,
    icon,
    className = '',
    ...props
}: EliteInputProps) => {
    return (
        <div className={`w-full space-y-2 ${className}`}>
            {label && (
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full rounded-2xl p-5 text-sm font-medium
                        transition-all duration-300
                        placeholder:text-zinc-700 placeholder:font-medium
                        focus:outline-none
                        ${icon ? 'pl-12' : ''}
                        ${error ? 'border-red-500/50 focus:border-red-500' : ''}
                    `}
                    style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(var(--glass-blur-light))',
                        WebkitBackdropFilter: 'blur(var(--glass-blur-light))',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.08), var(--shadow-glass)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    {...props}
                />
                {/* Glass shine overlay */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
                    }}
                />
            </div>
            {error && <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-wider ml-1">{error}</p>}
        </div>
    );
};
