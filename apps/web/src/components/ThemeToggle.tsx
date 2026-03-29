import type React from 'react';
import { useThemeMode } from '../contexts/ThemeContext';

const modes = ['light', 'dark', 'system'] as const;

const icons: Record<(typeof modes)[number], React.ReactNode> = {
  light: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  dark: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  ),
  system: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  ),
};

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="flex rounded-md border border-neutral-200 bg-neutral-50 text-xs font-medium">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          className={[
            'flex items-center justify-center px-2 py-1.5 transition-colors',
            m === 'light' ? 'rounded-s-md' : m === 'system' ? 'rounded-e-md' : '',
            mode === m
              ? 'bg-brand-700 text-white'
              : 'text-neutral-600 hover:bg-neutral-100',
          ].join(' ')}
          onClick={() => setMode(m)}
          aria-label={m}
        >
          {icons[m]}
        </button>
      ))}
    </div>
  );
}
