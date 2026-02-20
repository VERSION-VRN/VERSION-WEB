'use client';

import Link from 'next/link';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-5xl mb-4 opacity-40">{icon}</div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">{title}</h3>
            {description && (
                <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed">{description}</p>
            )}
            {(actionLabel && actionHref) && (
                <Link href={actionHref}
                    className="mt-6 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-primary/20 text-primary rounded-full hover:bg-primary/10 transition-all">
                    {actionLabel}
                </Link>
            )}
            {(actionLabel && onAction) && (
                <button type="button" onClick={onAction}
                    className="mt-6 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-primary/20 text-primary rounded-full hover:bg-primary/10 transition-all">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
