import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function AssigneeWorkloadWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const data = dashboardStats?.assigneeWorkload ?? [];

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noData', 'No data available')}
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-3">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="displayName" width={100} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="completed" fill="#10b981" name={t('dashboard.completed', 'Completed')} stackId="a" />
          <Bar dataKey="overdue" fill="#ef4444" name={t('dashboard.overdue', 'Overdue')} stackId="a" />
          <Bar dataKey="total" fill="#3b82f6" name={t('dashboard.total', 'Total')} />
        </BarChart>
      </ResponsiveContainer>

      {/* Tabular summary below chart */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-1 text-start font-medium">{t('dashboard.assignee', 'Assignee')}</th>
              <th className="py-1 text-center font-medium">{t('dashboard.total', 'Total')}</th>
              <th className="py-1 text-center font-medium">{t('dashboard.completed', 'Completed')}</th>
              <th className="py-1 text-center font-medium">{t('dashboard.overdue', 'Overdue')}</th>
              <th className="py-1 text-center font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.displayName} className="border-b border-neutral-100">
                <td className="py-1 font-medium text-neutral-700">{row.displayName}</td>
                <td className="py-1 text-center">{row.total}</td>
                <td className="py-1 text-center text-green-600">{row.completed}</td>
                <td className="py-1 text-center text-red-600">{row.overdue}</td>
                <td className="py-1 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${row.completionRate >= 80 ? 'bg-green-50 text-green-700' : row.completionRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {row.completionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
