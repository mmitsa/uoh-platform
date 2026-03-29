import { useState, useCallback } from 'react';
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

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import {
  PageHeader,
  DataTable,
  Button,
  Card,
  CardBody,
  type Column,
} from '../components/ui';
import { IconReport, IconDownload } from '../components/icons';

/* ---- Types ---- */

type TabKey = 'committee-activity' | 'meeting-attendance' | 'task-performance' | 'survey-analytics';

interface CommitteeActivityRow {
  committeeId: string;
  nameAr: string;
  nameEn: string;
  meetingsCount: number;
  decisionsCount: number;
  tasksCompletedCount: number;
}
interface CommitteeActivityReport {
  rows: CommitteeActivityRow[];
  totalMeetings: number;
  totalDecisions: number;
  totalTasksCompleted: number;
}

interface AttendanceRow {
  meetingId: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  totalInvited: number;
  totalPresent: number;
  attendanceRate: number;
}
interface MeetingAttendanceReport {
  rows: AttendanceRow[];
  overallAttendanceRate: number;
}

interface TaskPerformanceRow {
  assignedToDisplayName: string;
  totalTasks: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
interface TaskPerformanceReport {
  rows: TaskPerformanceRow[];
  overallCompletionRate: number;
  totalOverdue: number;
}

interface SurveyReportRow {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  responseCount: number;
  questionsCount: number;
  startAtUtc: string;
  endAtUtc: string;
}
interface SurveyAnalyticsReport {
  totalSurveys: number;
  totalActive: number;
  totalClosed: number;
  totalResponses: number;
  avgResponsesPerSurvey: number;
  rows: SurveyReportRow[];
}

/* ---- Helpers ---- */

function getDefaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function getDefaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ---- Component ---- */

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const { token } = useAuth();
  const isAr = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<TabKey>('committee-activity');
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report data
  const [committeeData, setCommitteeData] = useState<CommitteeActivityReport | null>(null);
  const [attendanceData, setAttendanceData] = useState<MeetingAttendanceReport | null>(null);
  const [taskData, setTaskData] = useState<TaskPerformanceReport | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyAnalyticsReport | null>(null);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'committee-activity', label: t('reports.committeeActivity') },
    { key: 'meeting-attendance', label: t('reports.meetingAttendance') },
    { key: 'task-performance', label: t('reports.taskPerformance') },
    { key: 'survey-analytics', label: t('reports.surveyAnalytics') },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = `from=${from}&to=${to}`;
      switch (activeTab) {
        case 'committee-activity': {
          const res = await get<CommitteeActivityReport>(`/api/v1/reports/committee-activity?${params}`);
          setCommitteeData(res);
          break;
        }
        case 'meeting-attendance': {
          const res = await get<MeetingAttendanceReport>(`/api/v1/reports/meeting-attendance?${params}`);
          setAttendanceData(res);
          break;
        }
        case 'task-performance': {
          const res = await get<TaskPerformanceReport>(`/api/v1/reports/task-performance?${params}`);
          setTaskData(res);
          break;
        }
        case 'survey-analytics': {
          const res = await get<SurveyAnalyticsReport>(`/api/v1/surveys/report?${params}`);
          setSurveyData(res);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, from, to, get]);

  const downloadExcel = async () => {
    if (!token) return;
    const reportTypeMap: Record<TabKey, string> = {
      'committee-activity': 'CommitteeActivity',
      'meeting-attendance': 'MeetingAttendance',
      'task-performance': 'TaskPerformance',
      'survey-analytics': 'SurveyAnalytics',
    };
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/${reportTypeMap[activeTab]}/export/excel?from=${from}&to=${to}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report_${activeTab}_${from}_${to}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ---- Column definitions ---- */

  const committeeColumns: Column<CommitteeActivityRow>[] = [
    {
      key: 'name',
      header: isAr ? t('committees.nameAr') : t('committees.nameEn'),
      render: (r) => (isAr ? r.nameAr : r.nameEn) || r.nameAr,
    },
    { key: 'meetings', header: t('reports.totalMeetings'), render: (r) => r.meetingsCount },
    { key: 'decisions', header: t('reports.totalDecisions'), render: (r) => r.decisionsCount },
    { key: 'tasks', header: t('reports.totalCompleted'), render: (r) => r.tasksCompletedCount },
  ];

  const attendanceColumns: Column<AttendanceRow>[] = [
    {
      key: 'title',
      header: isAr ? t('meetings.titleAr') : t('meetings.titleEn'),
      render: (r) => (isAr ? r.titleAr : r.titleEn) || r.titleAr,
    },
    {
      key: 'date',
      header: t('meetings.start'),
      render: (r) => new Date(r.startDateTimeUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    { key: 'invited', header: t('meetings.invitees'), render: (r) => r.totalInvited },
    {
      key: 'present',
      header: t('moms.attendance'),
      render: (r) => r.totalPresent,
    },
    {
      key: 'rate',
      header: t('reports.attendanceRate'),
      render: (r) => `${r.attendanceRate}%`,
    },
  ];

  const taskColumns: Column<TaskPerformanceRow>[] = [
    { key: 'assigned', header: t('tasks.assignedTo'), render: (r) => r.assignedToDisplayName },
    { key: 'total', header: t('tasks.taskTitle'), render: (r) => r.totalTasks },
    { key: 'completed', header: t('reports.totalCompleted'), render: (r) => r.completed },
    { key: 'overdue', header: t('reports.overdue'), render: (r) => r.overdue },
    {
      key: 'rate',
      header: t('reports.completionRate'),
      render: (r) => `${r.completionRate}%`,
    },
  ];

  const surveyColumns: Column<SurveyReportRow>[] = [
    {
      key: 'title',
      header: isAr ? t('surveys.titleAr') : t('surveys.titleEn'),
      render: (r) => (isAr ? r.titleAr : r.titleEn) || r.titleAr,
    },
    {
      key: 'status',
      header: t('surveys.status'),
      render: (r) => (
        <span
          className={[
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            r.status === 'active'
              ? 'bg-green-100 text-green-700'
              : r.status === 'closed'
                ? 'bg-neutral-100 text-neutral-600'
                : 'bg-yellow-100 text-yellow-700',
          ].join(' ')}
        >
          {t(`surveys.statuses.${r.status}`, r.status)}
        </span>
      ),
    },
    { key: 'questions', header: t('surveys.questionsCount'), render: (r) => r.questionsCount },
    { key: 'responses', header: t('surveys.responses'), render: (r) => r.responseCount },
    {
      key: 'dateRange',
      header: t('surveys.startDate'),
      render: (r) =>
        `${new Date(r.startAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} - ${new Date(r.endAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}`,
    },
  ];

  /* ---- Chart data ---- */

  const chartData = (() => {
    switch (activeTab) {
      case 'committee-activity':
        return (committeeData?.rows ?? []).map((r) => ({
          name: isAr ? r.nameAr : r.nameEn || r.nameAr,
          [t('reports.totalMeetings')]: r.meetingsCount,
          [t('reports.totalDecisions')]: r.decisionsCount,
          [t('reports.totalCompleted')]: r.tasksCompletedCount,
        }));
      case 'meeting-attendance':
        return (attendanceData?.rows ?? []).slice(0, 10).map((r) => ({
          name: isAr ? r.titleAr : r.titleEn || r.titleAr,
          [t('reports.attendanceRate')]: r.attendanceRate,
        }));
      case 'task-performance':
        return (taskData?.rows ?? []).map((r) => ({
          name: r.assignedToDisplayName,
          [t('reports.totalCompleted')]: r.completed,
          [t('reports.overdue')]: r.overdue,
        }));
      case 'survey-analytics':
        return (surveyData?.rows ?? []).slice(0, 15).map((r) => ({
          name: isAr ? r.titleAr : r.titleEn || r.titleAr,
          [t('surveys.responses')]: r.responseCount,
        }));
      default:
        return [];
    }
  })();

  const hasData =
    (activeTab === 'committee-activity' && committeeData && committeeData.rows.length > 0) ||
    (activeTab === 'meeting-attendance' && attendanceData && attendanceData.rows.length > 0) ||
    (activeTab === 'task-performance' && taskData && taskData.rows.length > 0) ||
    (activeTab === 'survey-analytics' && surveyData && surveyData.rows.length > 0);

  /* ---- Summary cards ---- */

  const renderSummary = () => {
    const cards: { label: string; value: string | number }[] = [];

    switch (activeTab) {
      case 'committee-activity':
        if (committeeData) {
          cards.push(
            { label: t('reports.totalMeetings'), value: committeeData.totalMeetings },
            { label: t('reports.totalDecisions'), value: committeeData.totalDecisions },
            { label: t('reports.totalCompleted'), value: committeeData.totalTasksCompleted },
          );
        }
        break;
      case 'meeting-attendance':
        if (attendanceData) {
          cards.push(
            { label: t('reports.attendanceRate'), value: `${attendanceData.overallAttendanceRate}%` },
            { label: t('reports.totalMeetings'), value: attendanceData.rows.length },
          );
        }
        break;
      case 'task-performance':
        if (taskData) {
          cards.push(
            { label: t('reports.completionRate'), value: `${taskData.overallCompletionRate}%` },
            { label: t('reports.overdue'), value: taskData.totalOverdue },
          );
        }
        break;
      case 'survey-analytics':
        if (surveyData) {
          cards.push(
            { label: t('reports.totalSurveys'), value: surveyData.totalSurveys },
            { label: t('reports.totalActive'), value: surveyData.totalActive },
            { label: t('reports.totalClosed'), value: surveyData.totalClosed },
            { label: t('reports.totalResponses'), value: surveyData.totalResponses },
            { label: t('reports.avgResponses'), value: surveyData.avgResponsesPerSurvey.toFixed(1) },
          );
        }
        break;
    }

    if (cards.length === 0) return null;

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardBody>
              <p className="text-sm text-neutral-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{c.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  /* ---- Render ---- */

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={
          hasData ? (
            <Button variant="secondary" onClick={downloadExcel}>
              <IconDownload className="h-4 w-4" />
              <span className="ms-1.5">{t('reports.exportExcel')}</span>
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-neutral-0 text-brand-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                {t('reports.dateFrom')}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                {t('reports.dateTo')}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? t('common.loading') : t('reports.generate')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      {renderSummary()}

      {/* Chart */}
      {hasData && chartData.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  {activeTab === 'committee-activity' && (
                    <>
                      <Bar dataKey={t('reports.totalMeetings')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={t('reports.totalDecisions')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={t('reports.totalCompleted')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                  {activeTab === 'meeting-attendance' && (
                    <Bar dataKey={t('reports.attendanceRate')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  )}
                  {activeTab === 'task-performance' && (
                    <>
                      <Bar dataKey={t('reports.totalCompleted')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={t('reports.overdue')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                  {activeTab === 'survey-analytics' && (
                    <Bar dataKey={t('surveys.responses')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Data table */}
      <Card>
        <CardBody className="p-0">
          {activeTab === 'committee-activity' && (
            <DataTable
              columns={committeeColumns}
              data={committeeData?.rows ?? []}
              loading={loading}
              keyExtractor={(r) => r.committeeId}
              emptyIcon={<IconReport className="h-10 w-10 text-neutral-400" />}
              emptyTitle={t('reports.noData')}
            />
          )}
          {activeTab === 'meeting-attendance' && (
            <DataTable
              columns={attendanceColumns}
              data={attendanceData?.rows ?? []}
              loading={loading}
              keyExtractor={(r) => r.meetingId}
              emptyIcon={<IconReport className="h-10 w-10 text-neutral-400" />}
              emptyTitle={t('reports.noData')}
            />
          )}
          {activeTab === 'task-performance' && (
            <DataTable
              columns={taskColumns}
              data={taskData?.rows ?? []}
              loading={loading}
              keyExtractor={(r) => r.assignedToDisplayName}
              emptyIcon={<IconReport className="h-10 w-10 text-neutral-400" />}
              emptyTitle={t('reports.noData')}
            />
          )}
          {activeTab === 'survey-analytics' && (
            <DataTable
              columns={surveyColumns}
              data={surveyData?.rows ?? []}
              loading={loading}
              keyExtractor={(r) => r.id}
              emptyIcon={<IconReport className="h-10 w-10 text-neutral-400" />}
              emptyTitle={t('reports.noData')}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
