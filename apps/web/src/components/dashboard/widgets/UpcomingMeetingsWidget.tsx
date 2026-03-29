import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';
import { Badge } from '../../ui/Badge';
import { IconCalendar } from '../../icons';

const statusVariant = (s: string) => {
  switch (s.toLowerCase()) {
    case 'scheduled':
      return 'info' as const;
    case 'in_progress':
      return 'warning' as const;
    case 'completed':
      return 'success' as const;
    case 'cancelled':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
};

export default function UpcomingMeetingsWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const meetings = (dashboardStats?.upcomingMeetings ?? []).slice(0, 5);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (meetings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-400">
        <IconCalendar className="h-8 w-8" />
        <p className="text-sm">{t('dashboard.noUpcomingMeetings', 'No upcoming meetings')}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {meetings.map((m) => (
        <li key={m.id} className="flex items-center gap-3 px-1 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-500">
            <IconCalendar className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">
              {isAr ? m.titleAr : m.titleEn}
            </p>
            <p className="text-xs text-neutral-400">
              {dateFmt.format(new Date(m.startDateTimeUtc))}
            </p>
          </div>
          <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
