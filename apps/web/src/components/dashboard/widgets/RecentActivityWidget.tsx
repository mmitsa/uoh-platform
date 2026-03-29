import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';
import { Badge } from '../../ui/Badge';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'default';

const methodVariant: Record<string, BadgeVariant> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
};

const statusVariant = (code: number): BadgeVariant => {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 400 && code < 500) return 'warning';
  if (code >= 500) return 'danger';
  return 'default';
};

export default function RecentActivityWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const activities = (dashboardStats?.recentActivity ?? []).slice(0, 8);

  const timeFmt = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noRecentActivity', 'No recent activity')}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {activities.map((a, idx) => (
        <li key={idx} className="flex items-center gap-2 px-1 py-2">
          <Badge variant={methodVariant[a.httpMethod] ?? 'default'} className="w-14 justify-center text-[10px]">
            {a.httpMethod}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-neutral-700">{a.path}</p>
            <p className="text-[11px] text-neutral-400">
              {a.userDisplayName ?? t('dashboard.system', 'System')} &middot;{' '}
              {timeFmt.format(new Date(a.occurredAtUtc))}
            </p>
          </div>
          <Badge variant={statusVariant(a.statusCode)} className="text-[10px]">
            {a.statusCode}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
