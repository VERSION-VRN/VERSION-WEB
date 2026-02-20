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

    const barColor =
        percent > 50 ? 'bg-emerald-500' :
            percent > 20 ? 'bg-amber-500' :
                'bg-red-500';

    const textColor =
        percent > 50 ? 'text-emerald-400' :
            percent > 20 ? 'text-amber-400' :
                'text-red-400';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
                {showCount && (
                    <span className={`text-[10px] font-bold font-mono ${textColor}`}>
                        {credits.toLocaleString()} pts
                    </span>
                )}
            </div>
            <div className="stat-bar">
                <div
                    className={`stat-bar-fill ${barColor}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {aproxVideos > 0 && (
                <p className="text-[8px] text-zinc-600">≈ {aproxVideos} videos disponibles</p>
            )}
        </div>
    );
}
