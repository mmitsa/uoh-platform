import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '../app/auth';
import { useApi } from '../hooks/useApi';
import { Card, CardBody, Badge, Alert } from '../components/ui';
import {
  IconAdmin,
  IconUser,
  IconCommittees,
  IconMeetings,
  IconTasks,
  IconSurveys,
  IconCheckCircle,
  IconInfo,
  IconSync,
  IconRoles,
  IconShield,
  IconAlertTriangle,
  IconClock,
  IconChartBar,
  IconLock,
} from '../components/icons';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface PlatformStats {
  totalCommittees: number;
  activeCommittees: number;
  totalMeetings: number;
  meetingsThisMonth: number;
  pendingTasks: number;
  overdueTasks: number;
  activeSurveys: number;
  meetingAttendanceRate: number;
  taskCompletionRate: number;
  liveMeetingsNow: number;
  upcomingMeetingsCount: number;
}

interface SystemHealth {
  status: string;
  checks: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AdminPage() {
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isDemo = user?.id?.startsWith('demo-');

  /* ---- Fetch Stats ---- */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await get<PlatformStats>('/api/v1/dashboard/stats');
      setStats(res);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setStatsLoading(false);
    }
  }, [get]);

  /* ---- Fetch Health ---- */
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await get<SystemHealth>('/health');
      setHealth(res);
    } catch {
      setHealth({ status: 'unreachable', checks: {} });
    } finally {
      setHealthLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchStats();
    fetchHealth();
  }, [fetchStats, fetchHealth]);

  /* ---- Stat Cards ---- */
  const statCards = stats
    ? [
        {
          label: t('admin.stats.committees'),
          value: stats.activeCommittees,
          total: stats.totalCommittees,
          icon: <IconCommittees className="h-5 w-5" />,
          color: 'text-purple-600 bg-purple-50',
        },
        {
          label: t('admin.stats.meetings'),
          value: stats.meetingsThisMonth,
          total: stats.totalMeetings,
          icon: <IconMeetings className="h-5 w-5" />,
          color: 'text-blue-600 bg-blue-50',
        },
        {
          label: t('admin.stats.tasks'),
          value: stats.pendingTasks,
          extra: stats.overdueTasks > 0 ? `${stats.overdueTasks} ${t('admin.stats.overdue')}` : undefined,
          icon: <IconTasks className="h-5 w-5" />,
          color: 'text-amber-600 bg-amber-50',
          warn: stats.overdueTasks > 0,
        },
        {
          label: t('admin.stats.surveys'),
          value: stats.activeSurveys,
          icon: <IconSurveys className="h-5 w-5" />,
          color: 'text-green-600 bg-green-50',
        },
        {
          label: t('admin.stats.attendance'),
          value: `${Math.round(stats.meetingAttendanceRate)}%`,
          icon: <IconCheckCircle className="h-5 w-5" />,
          color: 'text-teal-600 bg-teal-50',
        },
        {
          label: t('admin.stats.completion'),
          value: `${Math.round(stats.taskCompletionRate)}%`,
          icon: <IconChartBar className="h-5 w-5" />,
          color: 'text-indigo-600 bg-indigo-50',
        },
      ]
    : [];

  /* ---- Quick Links ---- */
  const quickLinks = [
    {
      to: '/admin/users',
      icon: <IconUser className="h-6 w-6" />,
      label: t('admin.nav.users'),
      desc: t('admin.nav.usersDesc'),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      to: '/admin/roles',
      icon: <IconRoles className="h-6 w-6" />,
      label: t('admin.nav.roles'),
      desc: t('admin.nav.rolesDesc'),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      to: '/admin/permissions',
      icon: <IconShield className="h-6 w-6" />,
      label: t('admin.nav.permissions'),
      desc: t('admin.nav.permissionsDesc'),
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      to: '/admin/ad-sync',
      icon: <IconSync className="h-6 w-6" />,
      label: t('admin.nav.adSync'),
      desc: t('admin.nav.adSyncDesc'),
      color: 'bg-teal-50 text-teal-600',
    },
    {
      to: '/workflow',
      icon: <IconChartBar className="h-6 w-6" />,
      label: t('admin.nav.workflow'),
      desc: t('admin.nav.workflowDesc'),
      color: 'bg-amber-50 text-amber-600',
    },
    {
      to: '/admin/ad-sync',
      icon: <IconLock className="h-6 w-6" />,
      label: t('admin.nav.adSettings'),
      desc: t('admin.nav.adSettingsDesc'),
      color: 'bg-red-50 text-red-600',
    },
  ];

  /* ---- Health helpers ---- */
  const healthColor = (status: string) => {
    if (status === 'ok' || status === 'healthy') return 'text-green-600';
    if (status === 'degraded' || status === 'not_connected') return 'text-amber-600';
    return 'text-red-600';
  };

  const healthBadge = (status: string) => {
    if (status === 'ok' || status === 'healthy')
      return <Badge variant="success">{t('admin.health.healthy')}</Badge>;
    if (status === 'degraded')
      return <Badge variant="warning">{t('admin.health.degraded')}</Badge>;
    return <Badge variant="danger">{t('admin.health.down')}</Badge>;
  };

  const healthDot = (status: string) => {
    if (status === 'ok') return 'bg-green-500';
    if (status === 'not_connected') return 'bg-amber-400';
    return 'bg-red-500';
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/*  Header                                                            */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md">
            <IconAdmin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t('admin.title')}</h1>
            <p className="text-sm text-neutral-500">{t('admin.description')}</p>
          </div>
        </div>
        {/* Current Admin */}
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-0 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <IconUser className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{user?.displayName ?? '—'}</p>
            <div className="flex flex-wrap gap-1">
              {user?.roles.map((role) => (
                <Badge key={role} variant="brand" className="text-[10px]">
                  {t(`roles.${role}` as any)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <Alert variant="danger" dismissible onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      )}
      {isDemo && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <IconInfo className="h-4 w-4 shrink-0" />
            <span>{t('admin.demoNotice')}</span>
          </div>
        </Alert>
      )}

      {/* ================================================================== */}
      {/*  System Health Bar                                                 */}
      {/* ================================================================== */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                health?.status === 'healthy'
                  ? 'bg-green-50 text-green-600'
                  : health?.status === 'degraded'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {healthLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : health?.status === 'healthy' ? (
                <IconCheckCircle className="h-5 w-5" />
              ) : (
                <IconAlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-900">{t('admin.health.title')}</h3>
                {!healthLoading && health && healthBadge(health.status)}
              </div>
              <p className="text-xs text-neutral-500">{t('admin.health.subtitle')}</p>
            </div>
          </div>

          {!healthLoading && health && (
            <div className="flex flex-wrap gap-4">
              {Object.entries(health.checks).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${healthDot(status)}`} />
                  <span className="text-xs font-medium text-neutral-600 capitalize">{service}</span>
                  <span className={`text-xs font-medium ${healthColor(status)}`}>{status}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-neutral-600">API</span>
                <span className="text-xs font-medium text-green-600">ok</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ================================================================== */}
      {/*  Statistics Grid                                                   */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardBody className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
                    <div className="h-6 w-12 animate-pulse rounded bg-neutral-200" />
                  </div>
                </CardBody>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label}>
                <CardBody className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                  >
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-neutral-500">{card.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-neutral-900">{card.value}</span>
                      {'total' in card && card.total != null && (
                        <span className="text-xs text-neutral-400">/ {card.total}</span>
                      )}
                    </div>
                    {'extra' in card && card.extra && (
                      <p
                        className={`text-xs ${card.warn ? 'font-medium text-red-500' : 'text-neutral-400'}`}
                      >
                        <IconAlertTriangle className="me-0.5 inline h-3 w-3" />
                        {card.extra}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      {/* ================================================================== */}
      {/*  Quick Actions                                                     */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('admin.quickActions')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              to={link.to}
              className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4 transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.color} transition-transform group-hover:scale-110`}
              >
                {link.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 transition-colors group-hover:text-brand-700">
                  {link.label}
                </p>
                <p className="truncate text-xs text-neutral-400">{link.desc}</p>
              </div>
              <svg
                className={`h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:text-brand-500 ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  Platform Info + Live Status                                       */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Platform Info */}
        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">{t('admin.platformInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                <span className="text-xs text-neutral-500">{t('admin.platform')}</span>
                <span className="text-sm font-semibold text-neutral-900">{t('appName')}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                <span className="text-xs text-neutral-500">{t('admin.version')}</span>
                <Badge variant="brand" className="font-mono text-xs">
                  v1.0.0
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                <span className="text-xs text-neutral-500">{t('admin.environment')}</span>
                {isDemo ? (
                  <Badge variant="warning">{t('admin.demoMode')}</Badge>
                ) : (
                  <Badge variant="success">{t('admin.production')}</Badge>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                <span className="text-xs text-neutral-500">{t('admin.sessionType')}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <span
                    className={`h-2 w-2 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-green-500'}`}
                  />
                  {isDemo ? t('admin.demoMode') : t('admin.production')}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Live Status */}
        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">{t('admin.liveStatus')}</h3>
            <div className="space-y-3">
              {stats && (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                      </span>
                      <span className="text-xs text-neutral-500">{t('admin.live.meetings')}</span>
                    </div>
                    <span className="text-lg font-bold text-neutral-900">
                      {stats.liveMeetingsNow}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-500">{t('admin.live.upcoming')}</span>
                    </div>
                    <span className="text-lg font-bold text-neutral-900">
                      {stats.upcomingMeetingsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <IconTasks className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-500">{t('admin.live.pendingTasks')}</span>
                    </div>
                    <span
                      className={`text-lg font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-neutral-900'}`}
                    >
                      {stats.pendingTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <IconSurveys className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-500">{t('admin.live.surveys')}</span>
                    </div>
                    <span className="text-lg font-bold text-neutral-900">{stats.activeSurveys}</span>
                  </div>
                </>
              )}
              {statsLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-lg bg-neutral-100" />
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  System Modules                                                    */}
      {/* ================================================================== */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">{t('admin.modules')}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                key: 'committees',
                icon: <IconCommittees className="h-5 w-5" />,
                color: 'bg-purple-50 text-purple-600',
                count: stats?.activeCommittees,
              },
              {
                key: 'meetings',
                icon: <IconMeetings className="h-5 w-5" />,
                color: 'bg-blue-50 text-blue-600',
                count: stats?.totalMeetings,
              },
              {
                key: 'tasks',
                icon: <IconTasks className="h-5 w-5" />,
                color: 'bg-amber-50 text-amber-600',
                count: stats?.pendingTasks,
              },
              {
                key: 'surveys',
                icon: <IconSurveys className="h-5 w-5" />,
                color: 'bg-green-50 text-green-600',
                count: stats?.activeSurveys,
              },
            ].map((mod) => (
              <div
                key={mod.key}
                className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mod.color}`}
                >
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {t(`nav.${mod.key}` as any)}
                  </p>
                  {mod.count != null && (
                    <p className="text-xs text-neutral-400">
                      {mod.count} {t('admin.active')}
                    </p>
                  )}
                </div>
                <Badge variant="success" className="shrink-0 text-[10px]">
                  {t('admin.active')}
                </Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
