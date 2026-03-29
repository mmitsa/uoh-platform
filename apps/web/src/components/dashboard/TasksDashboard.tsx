import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { Card, CardBody, Badge } from '../ui';
import { IconTasks, IconCheckCircle, IconClock, IconAlertTriangle } from '../icons';

type DashboardData = {
  totalTasks: number;
  averageProgress: number;
  statusBreakdown: { pending: number; inProgress: number; completed: number; overdue: number };
  priorityBreakdown: { low: number; medium: number; high: number; critical: number };
  completionTrend: { date: string; completedCount: number }[];
  overdueByAssignee: { name: string; count: number }[];
  upcomingDeadlines: {
    id: string; titleAr: string; titleEn: string;
    dueDate: string; progress: number; assignee: string; priority: string;
  }[];
};

const STATUS_COLORS = ['#94a3b8', '#f59e0b', '#22c55e', '#ef4444'];
const PRIORITY_COLORS = ['#3b82f6', '#94a3b8', '#f59e0b', '#ef4444'];

export function TasksDashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { get } = useApi();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<DashboardData>('/api/v1/tasks/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [get]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const statusData = [
    { name: t('tasks.statuses.pending'), value: data.statusBreakdown.pending },
    { name: t('tasks.statuses.in_progress'), value: data.statusBreakdown.inProgress },
    { name: t('tasks.statuses.completed'), value: data.statusBreakdown.completed },
    { name: t('tasks.statuses.overdue'), value: data.statusBreakdown.overdue },
  ];

  const priorityData = [
    { name: t('tasks.priorities.low'), value: data.priorityBreakdown.low },
    { name: t('tasks.priorities.medium'), value: data.priorityBreakdown.medium },
    { name: t('tasks.priorities.high'), value: data.priorityBreakdown.high },
    { name: t('tasks.priorities.critical'), value: data.priorityBreakdown.critical },
  ];

  const summaryCards = [
    { label: t('tasksDashboard.totalTasks'), value: data.totalTasks, icon: <IconTasks className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: t('tasksDashboard.averageProgress'), value: `${data.averageProgress}%`, icon: <IconClock className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
    { label: t('tasksDashboard.completedTasks'), value: data.statusBreakdown.completed, icon: <IconCheckCircle className="h-5 w-5" />, color: 'text-green-600 bg-green-50' },
    { label: t('tasksDashboard.overdueTasks'), value: data.statusBreakdown.overdue, icon: <IconAlertTriangle className="h-5 w-5" />, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardBody className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
                <p className="text-xs text-neutral-500">{card.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status pie chart */}
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('tasksDashboard.statusDistribution')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Priority pie chart */}
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('tasksDashboard.priorityDistribution')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Completion trend */}
      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('tasksDashboard.completionTrend')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.completionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="completedCount" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Overdue by assignee */}
      {data.overdueByAssignee.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('tasksDashboard.overdueByAssignee')}</h3>
            <ResponsiveContainer width="100%" height={Math.max(150, data.overdueByAssignee.length * 40)}>
              <BarChart data={data.overdueByAssignee} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Upcoming deadlines */}
      {data.upcomingDeadlines.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('tasksDashboard.upcomingDeadlines')}</h3>
            <div className="space-y-2">
              {data.upcomingDeadlines.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {isAr ? task.titleAr : task.titleEn}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {task.assignee} &middot; {new Date(task.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant={task.priority === 'Critical' || task.priority === 'High' ? 'danger' : 'default'}>
                    {task.priority}
                  </Badge>
                  <div className="w-20">
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          task.progress >= 100 ? 'bg-green-500' : task.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, task.progress)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 text-center mt-0.5">{task.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
