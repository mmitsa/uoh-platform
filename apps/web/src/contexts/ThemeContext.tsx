import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemPreference() : mode;
}

function applyTheme(resolved: ResolvedTheme) {
  if (resolved === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
  });

  const resolvedTheme = useMemo(() => resolve(mode), [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Apply theme on mount and when mode changes
  useEffect(() => {
    applyTheme(resolve(mode));
  }, [mode]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemPreference());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, resolvedTheme }), [mode, setMode, resolvedTheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}
