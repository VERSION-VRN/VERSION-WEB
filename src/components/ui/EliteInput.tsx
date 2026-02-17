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
                        w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-sm font-medium
                        focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-300
                        placeholder:text-zinc-700 placeholder:font-medium
                        ${icon ? 'pl-12' : ''}
                        ${error ? 'border-red-500/50 focus:border-red-500' : ''}
                    `}
                    {...props}
                />
                <div className="absolute inset-0 rounded-2xl border border-white/0 pointer-events-none group-focus-within:border-white/5 transition-all duration-500" />
            </div>
            {error && <p className="text-[9px] text-red-500/70 font-bold uppercase tracking-wider ml-1">{error}</p>}
        </div>
    );
};
