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
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Read from localStorage or fall back to system preference
        const stored = localStorage.getItem('version_theme') as Theme | null;
        let resolved: Theme = stored || 'dark';
        if (!stored) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            resolved = prefersDark ? 'dark' : 'light';
        }
        applyTheme(resolved);
        setThemeState(resolved);
        setMounted(true);
    }, []);

    const applyTheme = (t: Theme) => {
        const html = document.documentElement;
        if (t === 'light') {
            html.classList.add('light');
        } else {
            html.classList.remove('light');
        }
        localStorage.setItem('version_theme', t);
    };

    const setTheme = (t: Theme) => {
        applyTheme(t);
        setThemeState(t);
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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
