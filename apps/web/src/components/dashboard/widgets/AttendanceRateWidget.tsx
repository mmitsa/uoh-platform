import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function AttendanceRateWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const rate = dashboardStats?.meetingAttendanceRate ?? 0;
  const pct = Math.min(Math.max(rate, 0), 100);

  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-600">
          {t('dashboard.attendanceRate', 'Attendance Rate')}
        </span>
        <span className="text-2xl font-bold text-green-600">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-neutral-400">
        {t('dashboard.attendanceRateDesc', 'Average meeting attendance across all committees')}
      </p>
    </div>
  );
}
