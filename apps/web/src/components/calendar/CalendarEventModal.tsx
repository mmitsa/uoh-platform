import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal, Badge, Button } from '../ui';
import { IconCalendar, IconMapPin, IconCommittees } from '../icons';
import type { CalendarEvent } from './types';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  Draft: 'default',
  Scheduled: 'info',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'danger',
};

export function CalendarEventModal({ event, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  const title = isAr ? event.titleAr : event.titleEn;
  const committeeName = isAr ? event.committeeNameAr : event.committeeNameEn;
  const start = new Date(event.startDateTimeUtc);
  const end = new Date(event.endDateTimeUtc);
  const locale = isAr ? 'ar-SA' : 'en-US';

  const dateStr = start.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

  const isMeeting = event.eventKind === 'meeting';

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge variant={isMeeting ? (STATUS_BADGE[event.status] || 'default') : 'info'}>
            {isMeeting ? event.status : t('calendar.allDay')}
          </Badge>
          {isMeeting && (
            <span className="text-xs text-neutral-500 capitalize">{event.type}</span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <IconCalendar className="h-5 w-5 text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-neutral-900">{dateStr}</div>
              {isMeeting && (
                <div className="text-sm text-neutral-500">{timeStr}</div>
              )}
            </div>
          </div>

          {committeeName && (
            <div className="flex items-center gap-3">
              <IconCommittees className="h-5 w-5 text-neutral-400 shrink-0" />
              <span className="text-sm text-neutral-700">{committeeName}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3">
              <IconMapPin className="h-5 w-5 text-neutral-400 shrink-0" />
              <span className="text-sm text-neutral-700">{event.location}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isMeeting && (
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
            <Button variant="ghost" onClick={onClose}>
              {t('actions.close')}
            </Button>
            <Button
              onClick={() => {
                onClose();
                navigate(`/meetings`);
              }}
            >
              {t('calendar.viewMeeting')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
