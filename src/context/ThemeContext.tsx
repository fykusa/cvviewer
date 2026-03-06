import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, DEFAULT_THEME } from '../types/theme';

interface ThemeContextType {
    theme: AppTheme;
    updateTheme: (newTheme: AppTheme) => void;
    resetTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<AppTheme>(() => {
        const saved = localStorage.getItem('cv-viewer-theme');
        if (saved) {
            try {
                return { ...DEFAULT_THEME, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse saved theme', e);
            }
        }
        return DEFAULT_THEME;
    });

    const updateTheme = (newTheme: AppTheme) => {
        setTheme(newTheme);
        localStorage.setItem('cv-viewer-theme', JSON.stringify(newTheme));
    };

    const resetTheme = () => {
        setTheme(DEFAULT_THEME);
        localStorage.removeItem('cv-viewer-theme');
    };

    // Sync with localStorage across tabs if needed
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'cv-viewer-theme' && e.newValue) {
                setTheme(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
