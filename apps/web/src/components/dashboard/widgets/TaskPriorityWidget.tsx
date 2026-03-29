import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetProps } from '../../../app/dashboard/types';

const PRIORITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
  Critical: '#dc2626',
};

const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];

export default function TaskPriorityWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const data = dashboardStats?.taskPriorityBreakdown ?? [];

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noData', 'No data available')}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={PRIORITY_COLORS[entry.label] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value, t('dashboard.tasks', 'Tasks')]} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
