
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreditsContextType {
    credits: number;
    refreshCredits: () => Promise<void>;
    deductLocal: (amount: number) => void;
    loading: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchCredits = async () => {
        try {
            const token = localStorage.getItem('version_user_token');
            if (!token) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setCredits(data.credits);
                    // Sincronizar localstorage por si acaso
                    localStorage.setItem('version_user_credits', data.credits.toString());
                }
            } else if (res.status === 401) {
                // Token expirado o invalido
                router.push('/login');
            }
        } catch (error) {
            console.error("Error fetching credits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    const deductLocal = (amount: number) => {
        setCredits(prev => Math.max(0, prev - amount));
    };

    return (
        <CreditsContext.Provider value={{ credits, refreshCredits: fetchCredits, deductLocal, loading }}>
            {children}
        </CreditsContext.Provider>
    );
}

export function useCredits() {
    const context = useContext(CreditsContext);
    if (context === undefined) {
        throw new Error('useCredits must be used within a CreditsProvider');
    }
    return context;
}
