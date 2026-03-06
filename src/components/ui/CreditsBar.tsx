'use client';

interface CreditsBarProps {
    credits: number;
    maxCredits?: number;
    label?: string;
    showCount?: boolean;
}

export function CreditsBar({ credits, maxCredits = 1000, label = 'Créditos', showCount = true }: CreditsBarProps) {
    const percent = Math.min((credits / maxCredits) * 100, 100);
    const aproxVideos = Math.floor(credits / 10);

    const barGradient =
        percent > 50 ? 'linear-gradient(90deg, #10B981, #34D399)' :
            percent > 20 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                'linear-gradient(90deg, #EF4444, #F87171)';

    const textColor =
        percent > 50 ? 'text-emerald-400' :
            percent > 20 ? 'text-amber-400' :
                'text-red-400';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
                {showCount && (
                    <span className={`text-[10px] font-bold font-mono ${textColor}`}>
                        {credits.toLocaleString()} pts
                    </span>
                )}
            </div>
            <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                    background: 'var(--glass-bg-heavy)',
                    border: '1px solid var(--glass-border)',
                }}
            >
                <div
                    className="h-full rounded-full transition-all duration-700 relative"
                    style={{
                        width: `${percent}%`,
                        background: barGradient,
                        boxShadow: `0 0 8px ${percent > 50 ? 'rgba(16,185,129,0.3)' : percent > 20 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                />
            </div>
            {aproxVideos > 0 && (
                <p className="text-[8px] text-zinc-600">≈ {aproxVideos} videos disponibles</p>
            )}
        </div>
    );
}
