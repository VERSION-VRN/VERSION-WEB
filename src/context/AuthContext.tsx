"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    email: string;
    name: string;
    role: string;
    credits: number;
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    deductCredits: (amount: number) => void;
    refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Inicializar desde LocalStorage al cargar
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user_profile');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error parseando usuario:", e);
                // logout();
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: UserProfile) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user_profile', JSON.stringify(newUser));
    };

    const logout = (reason?: string) => {
        console.warn('Forcing logout. Reason:', reason);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('backend_url');
        router.push('/login');
    };

    const deductCredits = (amount: number) => {
        if (user) {
            const updatedUser = { ...user, credits: Math.max(0, user.credits - amount) };
            setUser(updatedUser);
            localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        }
    };

    const refreshCredits = async () => {
        if (!token || !user) return;
        try {
            const apiUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/users/me/credits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.credits !== undefined) {
                    const updatedUser = { ...user, credits: data.credits, role: data.role || user.role };
                    setUser(updatedUser);
                    localStorage.setItem('user_profile', JSON.stringify(updatedUser));
                }
            } else {
                console.warn('refreshCredits falló con status:', res.status);
                if (res.status === 401) {
                    // logout('401 in refreshCredits'); 
                }
            }
        } catch (error) {
            console.error("Error fetching latest credits:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            loading,
            login,
            logout,
            deductCredits,
            refreshCredits
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
