import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function TaskOverviewWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const pending = dashboardStats?.pendingTasks ?? 0;
  const overdue = dashboardStats?.overdueTasks ?? 0;

  // Derive completed count from taskStatusBreakdown if available
  const completedEntry = dashboardStats?.taskStatusBreakdown?.find(
    (s) => s.label === 'Completed',
  );
  const completed = completedEntry?.count ?? 0;

  const cards = [
    {
      label: t('dashboard.pending', 'Pending'),
      value: pending,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    {
      label: t('dashboard.overdue', 'Overdue'),
      value: overdue,
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    {
      label: t('dashboard.completed', 'Completed'),
      value: completed,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
  ];

  return (
    <div className="grid h-full grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`flex flex-col items-center justify-center rounded-lg border ${c.border} ${c.bg} p-3`}
        >
          <span className={`text-2xl font-bold ${c.text}`}>{c.value}</span>
          <span className="mt-1 text-xs font-medium text-neutral-600">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
