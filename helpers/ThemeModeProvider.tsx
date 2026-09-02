import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: ThemeMode;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    // Check system preference or localStorage
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved) {
      setMode(saved);
      setResolvedTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setResolvedTheme('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', mode);
    setResolvedTheme(mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}
