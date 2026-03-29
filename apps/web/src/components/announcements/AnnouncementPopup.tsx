import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button } from '../ui';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PopupAnnouncement {
  id: string;
  type: 'circular' | 'news' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  publishDate: string;
  expiryDate: string;
  requireAcknowledgment: boolean;
  surveyId: string | null;
  attachments: { id: string; fileName: string; sizeBytes: number }[];
}

interface AnnouncementPopupProps {
  announcement: PopupAnnouncement;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  queuePosition?: string; // e.g. "1 / 3"
}

/* -------------------------------------------------------------------------- */
/*  Styling maps                                                              */
/* -------------------------------------------------------------------------- */

const PRIORITY_BAR: Record<string, string> = {
  urgent: 'bg-red-500',
  important: 'bg-amber-500',
  normal: 'bg-brand-500',
};

const TYPE_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  circular: 'info',
  news: 'success',
  announcement: 'warning',
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AnnouncementPopup({
  announcement,
  onAcknowledge,
  onDismiss,
  queuePosition,
}: AnnouncementPopupProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const mustAcknowledge = announcement.requireAcknowledgment;

  // Block body scroll and keyboard escape when requiring acknowledgment
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mustAcknowledge) {
        onDismiss(announcement.id);
      }
    };
    document.addEventListener('keydown', handler);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [mustAcknowledge, onDismiss, announcement.id]);

  const title = isRtl ? announcement.titleAr : announcement.titleEn;
  const body = isRtl ? announcement.bodyAr : announcement.bodyEn;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Priority color bar */}
        <div className={`h-1.5 w-full ${PRIORITY_BAR[announcement.priority]}`} />

        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-3">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M16.881 4.345A23.112 23.112 0 0 1 8.25 6H7.5a5.25 5.25 0 0 0-.88 10.427 21.593 21.593 0 0 0 1.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 0 1-.628-1.607c1.918.258 3.88.1 5.706-.498V6a.75.75 0 0 1 .75-.75h.008c.29 0 .573.017.852.047ZM18.5 5.698V17.302a.75.75 0 0 0 1.272.529c.992-.996 1.478-2.448 1.478-5.831s-.486-4.835-1.478-5.83a.75.75 0 0 0-1.272.528Z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={TYPE_BADGE[announcement.type]}>
                {t(`announcements.type_${announcement.type}`)}
              </Badge>
              {announcement.priority !== 'normal' && (
                <Badge variant={announcement.priority === 'urgent' ? 'danger' : 'warning'}>
                  {t(`announcements.priority_${announcement.priority}`)}
                </Badge>
              )}
              {queuePosition && (
                <span className="text-xs text-neutral-400 ms-auto">{queuePosition}</span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-bold text-neutral-900 leading-snug">
              {title}
            </h2>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-3 overflow-y-auto max-h-[50vh]">
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700" dir={isRtl ? 'rtl' : 'ltr'}>
            {body}
          </p>

          {/* Attachments */}
          {announcement.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {announcement.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-neutral-400">
                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 truncate text-neutral-700">{att.fileName}</span>
                  <span className="shrink-0 text-xs text-neutral-400">{formatFileSize(att.sizeBytes)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Survey link */}
          {announcement.surveyId && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-sm font-medium text-brand-700">
                {t('announcements.attachedSurvey')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
          {mustAcknowledge ? (
            <>
              <p className="flex-1 text-xs text-neutral-500">
                {t('announcements.acknowledgmentRequired')}
              </p>
              <Button onClick={() => onAcknowledge(announcement.id)}>
                {t('announcements.iAcknowledge')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onDismiss(announcement.id)}>
                {t('announcements.dismiss')}
              </Button>
              <Button onClick={() => onAcknowledge(announcement.id)}>
                {t('announcements.iAcknowledge')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
