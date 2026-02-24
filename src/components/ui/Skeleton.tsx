export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-white/[0.04] rounded-lg ${className}`} />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
        </div>
    );
}

export function SkeletonEditorConfig() {
    return (
        <div className="space-y-8 animate-fade">
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-32 w-full rouned-xl" />
                    <Skeleton className="h-32 w-full rouned-xl" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-40" />
                <div className="h-12 bg-white/[0.02] rounded-xl flex items-center px-4 gap-4">
                    <Skeleton className="h-3 w-full" />
                </div>
            </div>
        </div>
    );
}
