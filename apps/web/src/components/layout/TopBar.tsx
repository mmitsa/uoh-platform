import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../../i18n';
import { useAuth } from '../../app/auth';
import { IconMenu, IconUser } from '../icons';
import { GrayModeToggle } from '../GrayModeToggle';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from '../NotificationBell';
import { PushNotificationToggle } from '../PushNotificationToggle';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { i18n, t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-0/80 px-4 backdrop-blur lg:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <IconMenu />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <PushNotificationToggle />
        <ThemeToggle />
        <GrayModeToggle />

        {/* Language toggle */}
        <div className="flex rounded-md border border-neutral-200 bg-neutral-50 text-xs font-medium">
          <button
            type="button"
            className={[
              'px-2.5 py-1.5 rounded-s-md transition-colors',
              i18n.language === 'ar'
                ? 'bg-brand-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100',
            ].join(' ')}
            onClick={() => setLocale('ar')}
          >
            ع
          </button>
          <button
            type="button"
            className={[
              'px-2.5 py-1.5 rounded-e-md transition-colors',
              i18n.language === 'en'
                ? 'bg-brand-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100',
            ].join(' ')}
            onClick={() => setLocale('en')}
          >
            En
          </button>
        </div>

        {/* User avatar dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold hover:ring-2 hover:ring-brand-300 transition-all"
            >
              {user.displayName.charAt(0)}
            </button>

            {showDropdown && (
              <div className="absolute end-0 top-full mt-1 w-56 rounded-lg border border-neutral-200 bg-neutral-0 py-1 shadow-lg z-50">
                <div className="px-3 py-2 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <IconUser className="h-4 w-4" />
                  {t('nav.profile')}
                </button>
                <div className="border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => { setShowDropdown(false); logout(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    {t('actions.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
