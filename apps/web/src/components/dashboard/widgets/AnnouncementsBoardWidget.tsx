import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';
import { useApi } from '../../../hooks/useApi';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AnnouncementItem {
  id: string;
  type: 'circular' | 'news' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  publishDate: string;
}

/* -------------------------------------------------------------------------- */
/*  Styling maps                                                              */
/* -------------------------------------------------------------------------- */

const TYPE_ICON_BG: Record<string, string> = {
  circular: 'bg-blue-100 text-blue-600',
  news: 'bg-green-100 text-green-600',
  announcement: 'bg-amber-100 text-amber-600',
};

const TYPE_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  circular: 'info',
  news: 'success',
  announcement: 'warning',
};

const PRIORITY_BADGE: Record<string, 'default' | 'warning' | 'danger'> = {
  normal: 'default',
  important: 'warning',
  urgent: 'danger',
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function AnnouncementsBoardWidget(_props: WidgetProps) {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const isRtl = i18n.language === 'ar';

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AnnouncementItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<{ items: AnnouncementItem[] }>(
        '/api/v1/announcements?status=published&pageSize=5',
      );
      setItems(data.items);
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('announcements.noActiveAnnouncements')}
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-neutral-100">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setDetail(item)}
              className="flex w-full items-center gap-3 px-1 py-2.5 text-start transition-colors hover:bg-neutral-50 rounded-lg"
            >
              {/* Type icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TYPE_ICON_BG[item.type]}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  {item.type === 'circular' && (
                    <path d="M16.881 4.345A23.112 23.112 0 0 1 8.25 6H7.5a5.25 5.25 0 0 0-.88 10.427 21.593 21.593 0 0 0 1.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 0 1-.628-1.607c1.918.258 3.88.1 5.706-.498V6a.75.75 0 0 1 .75-.75h.008c.29 0 .573.017.852.047ZM18.5 5.698V17.302a.75.75 0 0 0 1.272.529c.992-.996 1.478-2.448 1.478-5.831s-.486-4.835-1.478-5.83a.75.75 0 0 0-1.272.528Z" />
                  )}
                  {item.type === 'news' && (
                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v11.75A2.75 2.75 0 0 1 11.25 18h-5.5A2.75 2.75 0 0 1 3 15.25V3.5Zm3.75 7a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM5 5.75A.75.75 0 0 1 5.75 5h4.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 8.25v-2.5Z" clipRule="evenodd" />
                  )}
                  {item.type === 'announcement' && (
                    <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
                  )}
                </svg>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {isRtl ? item.titleAr : item.titleEn}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {formatDate(item.publishDate)}
                </p>
              </div>

              {/* Priority badge */}
              {item.priority !== 'normal' && (
                <Badge variant={PRIORITY_BADGE[item.priority]} className="shrink-0 text-[10px]">
                  {t(`announcements.priority_${item.priority}`)}
                </Badge>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? (isRtl ? detail.titleAr : detail.titleEn) : ''}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={TYPE_BADGE[detail.type]}>
                {t(`announcements.type_${detail.type}`)}
              </Badge>
              {detail.priority !== 'normal' && (
                <Badge variant={PRIORITY_BADGE[detail.priority]}>
                  {t(`announcements.priority_${detail.priority}`)}
                </Badge>
              )}
              <span className="text-xs text-neutral-400 ms-auto">
                {formatDate(detail.publishDate)}
              </span>
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700" dir={isRtl ? 'rtl' : 'ltr'}>
              {isRtl ? detail.bodyAr : detail.bodyEn}
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetail(null)}>
                {t('actions.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
