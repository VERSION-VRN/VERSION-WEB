export default function DashboardLoading() {
    return (
        <div className="flex min-h-screen bg-black">
            <div className="w-[280px] hidden lg:block border-r border-white/[0.04] bg-zinc-950/20 animate-shimmer" />
            <div className="flex-1 p-12">
                <div className="h-10 w-64 bg-white/[0.04] rounded-2xl mb-4 animate-shimmer" />
                <div className="h-4 w-48 bg-white/[0.03] rounded-xl mb-16 animate-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-shimmer" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-48 bg-white/[0.03] rounded-2xl animate-shimmer" />)}
                </div>
            </div>
        </div>
    );
}
