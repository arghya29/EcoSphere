'use client';

import * as React from 'react';
import { THEME_STORAGE_KEY } from '@/components/shared/theme-script';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    stored = null;
  }
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');

  React.useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch (error) {}
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const toggle = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = React.useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
