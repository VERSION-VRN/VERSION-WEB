"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/', '/login', '/register'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            if (!PUBLIC_ROUTES.includes(pathname)) {
                console.warn(`Redirecting to login from ${pathname} because isAuthenticated is false`);
                router.push('/login');
            }
        }
    }, [isAuthenticated, loading, pathname, router]);

    // Show nothing while loading to prevent unauthenticated content flash
    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm font-bold tracking-widest uppercase">Cargando VERSION...</div>;
    }

    // If not authenticated and trying to access a private route, show nothing until redirect
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
        return <div className="min-h-screen bg-black" />;
    }

    return <>{children}</>;
}
