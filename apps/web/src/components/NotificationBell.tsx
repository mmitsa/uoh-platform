import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBell } from './icons';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';

function timeAgo(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return t('notifications.justNow');
  if (diffMin < 60) return t('notifications.minutesAgo', { count: diffMin });
  if (diffHr < 24) return t('notifications.hoursAgo', { count: diffHr });
  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({
  notification,
  lang,
  t,
  onRead,
  onNavigate,
}: {
  notification: AppNotification;
  lang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const title = lang === 'ar' ? notification.titleAr : notification.titleEn;
  const body = lang === 'ar' ? notification.bodyAr : notification.bodyEn;

  return (
    <button
      type="button"
      className={[
        'w-full text-start px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0',
        notification.isRead ? 'bg-neutral-0' : 'bg-blue-50/50',
      ].join(' ')}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
        if (notification.actionUrl) {
          onNavigate(notification.actionUrl);
        }
      }}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">{title}</p>
          {body && (
            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{body}</p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            {timeAgo(notification.createdAtUtc, t)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        type="button"
        className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
        onClick={() => setOpen(prev => !prev)}
        aria-label={t('notifications.title')}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-0 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('notifications.title')}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                onClick={() => markAllAsRead()}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  lang={i18n.language}
                  t={t}
                  onRead={markAsRead}
                  onNavigate={(url) => { setOpen(false); navigate(url); }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
