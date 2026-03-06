'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Force dark theme on mount
        const html = document.documentElement;
        html.classList.remove('light');
        setMounted(true);
    }, []);

    const setTheme = () => { /* No-op: Only dark allowed */ };
    const toggleTheme = () => { /* No-op: Only dark allowed */ };

    // Prevent flash: inject theme class on first render via inline script
    if (!mounted) return (
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
