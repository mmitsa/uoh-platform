import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '../../../app/dashboard/types';
import { useApi } from '../../../hooks/useApi';
import { Card, CardBody } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import {
  IconCommittees,
  IconMeetings,
  IconTasks,
  IconSurveys,
  IconCalendar,
  IconChevronRight,
  IconEye,
} from '../../icons';

/* ------------------------------------------------------------------ */
/*  Shared clickable stat card wrapper                                 */
/* ------------------------------------------------------------------ */
function StatCard({
  icon,
  iconBg,
  value,
  label,
  subText,
  pulse,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  subText?: React.ReactNode;
  pulse?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card className="h-full">
      <CardBody>
        <div
          className={`flex items-center gap-4 ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
            {pulse && (
              <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-sm font-medium text-neutral-500">{label}</p>
            {subText && <div className="text-xs text-neutral-400">{subText}</div>}
          </div>
          {onClick && (
            <IconChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal list item                                                    */
/* ------------------------------------------------------------------ */
function ModalListItem({
  title,
  badges,
  meta,
  onNavigate,
}: {
  title: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-3 ${onNavigate ? 'cursor-pointer transition-colors hover:bg-brand-50/50 hover:border-brand-200' : ''}`}
      onClick={onNavigate}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 line-clamp-1">{title}</p>
        {badges && <div className="mt-1 flex flex-wrap gap-1.5">{badges}</div>}
        {meta && <div className="mt-1 text-xs text-neutral-500">{meta}</div>}
      </div>
      {onNavigate && (
        <IconEye className="h-4 w-4 shrink-0 text-neutral-400" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Committees                                                    */
/* ------------------------------------------------------------------ */
type CommitteeListItem = { id: string; nameAr: string; nameEn: string; type: string; status: string; memberCount: number };

const COMMITTEE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  active: 'success',
  pending_approval: 'warning',
  draft: 'default',
  archived: 'danger',
};

export function StatCommitteesWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const total = dashboardStats?.totalCommittees ?? 0;
  const active = dashboardStats?.activeCommittees ?? 0;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommitteeListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: CommitteeListItem[] }>('/api/v1/committees?page=1&pageSize=50');
      setItems(res.items);
    } catch { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && items.length === 0) void fetchData();
  }, [open, items.length, fetchData]);

  return (
    <>
      <StatCard
        icon={<IconCommittees className="h-6 w-6" />}
        iconBg="bg-indigo-50 text-indigo-600"
        value={total}
        label={t('dashboard.totalCommittees', 'Total Committees')}
        subText={<>{active} {t('dashboard.active', 'Active')}</>}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.totalCommittees', 'Total Committees')} className="max-w-2xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="info">{t('dashboard.total', 'Total')}: {total}</Badge>
          <Badge variant="success">{t('dashboard.active', 'Active')}: {active}</Badge>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => (
              <ModalListItem
                key={c.id}
                title={isAr ? c.nameAr : c.nameEn}
                badges={
                  <>
                    <Badge variant={COMMITTEE_STATUS_VARIANT[c.status] ?? 'default'}>
                      {t(`committees.status_${c.status}` as any, c.status)}
                    </Badge>
                    <Badge>{t(`committees.type_${c.type}` as any, c.type)}</Badge>
                  </>
                }
                meta={<>{c.memberCount} {t('committees.members', 'members')}</>}
                onNavigate={() => { setOpen(false); navigate(`/committees/${c.id}`); }}
              />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setOpen(false); navigate('/committees'); }}
          >
            {t('dashboard.viewAll', 'View All')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Meetings                                                      */
/* ------------------------------------------------------------------ */
type MeetingListItem = { id: string; titleAr: string; titleEn: string; status: string; startDateTimeUtc: string; type?: string };

const MEETING_STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger',
  draft: 'default',
  in_progress: 'warning',
};

export function StatMeetingsWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const total = dashboardStats?.totalMeetings ?? 0;
  const thisMonth = dashboardStats?.meetingsThisMonth ?? 0;
  const lastMonth = dashboardStats?.meetingsLastMonth ?? 0;
  const diff = thisMonth - lastMonth;
  const arrow = diff > 0 ? '+' : '';

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: MeetingListItem[] }>('/api/v1/meetings?page=1&pageSize=50');
      setItems(res.items);
    } catch { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && items.length === 0) void fetchData();
  }, [open, items.length, fetchData]);

  return (
    <>
      <StatCard
        icon={<IconMeetings className="h-6 w-6" />}
        iconBg="bg-blue-50 text-blue-600"
        value={total}
        label={t('dashboard.totalMeetings', 'Total Meetings')}
        subText={
          <>
            {thisMonth} {t('dashboard.thisMonth', 'this month')}{' '}
            {lastMonth > 0 && (
              <span className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>({arrow}{diff})</span>
            )}
          </>
        }
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.totalMeetings', 'Total Meetings')} className="max-w-2xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="info">{t('dashboard.total', 'Total')}: {total}</Badge>
          <Badge variant="success">{t('dashboard.thisMonth', 'This Month')}: {thisMonth}</Badge>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((m) => (
              <ModalListItem
                key={m.id}
                title={isAr ? m.titleAr : m.titleEn}
                badges={
                  <Badge variant={MEETING_STATUS_VARIANT[m.status] ?? 'default'}>
                    {t(`meetings.status_${m.status}` as any, m.status)}
                  </Badge>
                }
                meta={new Intl.DateTimeFormat(i18n.language, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }).format(new Date(m.startDateTimeUtc))}
                onNavigate={() => { setOpen(false); navigate(`/meetings/${m.id}`); }}
              />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setOpen(false); navigate('/meetings'); }}
          >
            {t('dashboard.viewAll', 'View All')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Tasks                                                         */
/* ------------------------------------------------------------------ */
type TaskListItem = { id: string; titleAr: string; titleEn: string; status: string; priority: string; dueDateUtc: string; progress: number };

const TASK_STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  overdue: 'danger',
};

const TASK_PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

export function StatTasksWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const pending = dashboardStats?.pendingTasks ?? 0;
  const overdue = dashboardStats?.overdueTasks ?? 0;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: TaskListItem[] }>('/api/v1/tasks?page=1&pageSize=50');
      setItems(res.items);
    } catch { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && items.length === 0) void fetchData();
  }, [open, items.length, fetchData]);

  return (
    <>
      <StatCard
        icon={<IconTasks className="h-6 w-6" />}
        iconBg="bg-amber-50 text-amber-600"
        value={pending}
        label={t('dashboard.pendingTasks', 'Pending Tasks')}
        subText={
          <>
            {overdue > 0 && <span className="text-red-500">{overdue} {t('dashboard.overdue', 'overdue')}</span>}
            {overdue === 0 && <span>{t('dashboard.noOverdue', 'No overdue')}</span>}
          </>
        }
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.pendingTasks', 'Pending Tasks')} className="max-w-2xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="warning">{t('dashboard.pending', 'Pending')}: {pending}</Badge>
          {overdue > 0 && <Badge variant="danger">{t('dashboard.overdue', 'Overdue')}: {overdue}</Badge>}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((task) => (
              <ModalListItem
                key={task.id}
                title={isAr ? task.titleAr : task.titleEn}
                badges={
                  <>
                    <Badge variant={TASK_STATUS_VARIANT[task.status] ?? 'default'}>
                      {t(`tasks.status_${task.status}` as any, task.status)}
                    </Badge>
                    <Badge variant={TASK_PRIORITY_VARIANT[task.priority] ?? 'default'}>
                      {t(`tasks.priority_${task.priority}` as any, task.priority)}
                    </Badge>
                  </>
                }
                meta={
                  <div className="flex items-center gap-3">
                    <span>
                      {new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(task.dueDateUtc))}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                        <span
                          className={`block h-full rounded-full ${task.progress >= 100 ? 'bg-green-500' : task.progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </span>
                      <span>{task.progress}%</span>
                    </span>
                  </div>
                }
                onNavigate={() => { setOpen(false); navigate(`/tasks/${task.id}`); }}
              />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setOpen(false); navigate('/tasks'); }}
          >
            {t('dashboard.viewAll', 'View All')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Surveys                                                       */
/* ------------------------------------------------------------------ */
type SurveyListItem = { id: string; titleAr: string; titleEn: string; status: string; responseCount: number; questionCount: number };

const SURVEY_STATUS_VARIANT: Record<string, 'success' | 'default' | 'danger' | 'warning'> = {
  active: 'success',
  draft: 'default',
  closed: 'danger',
};

export function StatSurveysWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const active = dashboardStats?.activeSurveys ?? 0;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: SurveyListItem[] }>('/api/v1/surveys?page=1&pageSize=50');
      setItems(res.items);
    } catch { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && items.length === 0) void fetchData();
  }, [open, items.length, fetchData]);

  return (
    <>
      <StatCard
        icon={<IconSurveys className="h-6 w-6" />}
        iconBg="bg-emerald-50 text-emerald-600"
        value={active}
        label={t('dashboard.activeSurveys', 'Active Surveys')}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.activeSurveys', 'Active Surveys')} className="max-w-2xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="success">{t('dashboard.active', 'Active')}: {active}</Badge>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <ModalListItem
                key={s.id}
                title={isAr ? s.titleAr : s.titleEn}
                badges={
                  <Badge variant={SURVEY_STATUS_VARIANT[s.status] ?? 'default'}>
                    {t(`surveys.status_${s.status}` as any, s.status)}
                  </Badge>
                }
                meta={
                  <>
                    {s.responseCount} {t('surveys.responses', 'responses')} &middot; {s.questionCount} {t('surveys.questions', 'questions')}
                  </>
                }
                onNavigate={() => { setOpen(false); navigate(`/surveys/${s.id}`); }}
              />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setOpen(false); navigate('/surveys'); }}
          >
            {t('dashboard.viewAll', 'View All')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Live Meetings Now                                             */
/* ------------------------------------------------------------------ */
export function StatLiveMeetingsWidget({ dashboardStats }: WidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const count = dashboardStats?.liveMeetingsNow ?? 0;

  return (
    <StatCard
      icon={<IconMeetings className="h-6 w-6" />}
      iconBg="bg-red-50 text-red-600"
      value={count}
      label={t('dashboard.liveMeetingsNow', 'Live Meetings Now')}
      pulse={count > 0}
      onClick={() => navigate('/meetings')}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Upcoming Meetings Count                                       */
/* ------------------------------------------------------------------ */
export function StatUpcomingCountWidget({ dashboardStats }: WidgetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const count = dashboardStats?.upcomingMeetingsCount ?? 0;
  const upcoming = dashboardStats?.upcomingMeetings ?? [];

  const [open, setOpen] = useState(false);

  return (
    <>
      <StatCard
        icon={<IconCalendar className="h-6 w-6" />}
        iconBg="bg-teal-50 text-teal-600"
        value={count}
        label={t('dashboard.upcomingMeetingsCount', 'Upcoming (7 days)')}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.upcomingMeetingsCount', 'Upcoming (7 days)')} className="max-w-2xl">
        <div className="mb-4">
          <Badge variant="info">{count} {t('dashboard.upcoming', 'upcoming')}</Badge>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            {t('dashboard.noUpcomingMeetings', 'No upcoming meetings')}
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <ModalListItem
                key={m.id}
                title={isAr ? m.titleAr : m.titleEn}
                badges={
                  <Badge variant={MEETING_STATUS_VARIANT[m.status] ?? 'default'}>
                    {t(`meetings.status_${m.status}` as any, m.status)}
                  </Badge>
                }
                meta={new Intl.DateTimeFormat(i18n.language, {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }).format(new Date(m.startDateTimeUtc))}
                onNavigate={() => { setOpen(false); navigate(`/meetings/${m.id}`); }}
              />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setOpen(false); navigate('/calendar'); }}
          >
            {t('dashboard.viewCalendar', 'View Calendar')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
