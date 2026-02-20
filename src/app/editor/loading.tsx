export default function EditorLoading() {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            <div className="h-14 border-b border-white/[0.04] bg-black/80 animate-shimmer" />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
}
