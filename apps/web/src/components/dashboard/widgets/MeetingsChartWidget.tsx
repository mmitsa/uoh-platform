import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function MeetingsChartWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const data = dashboardStats?.meetingsByMonth ?? [];

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noData', 'No data available')}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(label: string) => label}
            formatter={(value: number) => [value, t('dashboard.meetings', 'Meetings')]}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name={t('dashboard.meetings', 'Meetings')}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
