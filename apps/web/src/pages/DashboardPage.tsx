import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../app/auth';
import { useApi } from '../hooks/useApi';
import { Badge, Skeleton, Card, CardBody, Button, Select } from '../components/ui';
import { DashboardProvider, useDashboard } from '../app/dashboard/DashboardContext';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { DashboardToolbar } from '../components/dashboard/DashboardToolbar';
import { WidgetLibrary } from '../components/dashboard/WidgetLibrary';
import { IconCommittees, IconCheckCircle, IconXCircle, IconClock, IconMeetings, IconMom, IconChangeRequest, IconChevronDown, IconUser, IconCalendar } from '../components/icons';

/* ---------- Welcome header (kept from original) ---------- */

function WelcomeHeader({ name, role, t, i18n }: { name: string; role: string; t: (k: string) => string; i18n: { language: string } }) {
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greetText = t(`dashboard.greet_${greetKey}`);
  const dateStr = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="mb-6 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-lg">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{greetText}، {name}</h1>
          <p className="mt-1 text-sm text-brand-200">{dateStr}</p>
        </div>
        <Badge variant="brand" className="mt-2 w-fit border border-white/20 bg-neutral-0/15 text-white sm:mt-0">
          {t(`roles.${role}` as any) || role}
        </Badge>
      </div>
    </div>
  );
}

/* ---------- Committee filter ---------- */

type CommitteeOption = { id: string; nameAr: string; nameEn: string };

function CommitteeFilter() {
  const { t, i18n } = useTranslation();
  const { get } = useApi();
  const { committeeFilter, setCommitteeFilter } = useDashboard();
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    void (async () => {
      try {
        const res = await get<{ items: CommitteeOption[] }>('/api/v1/committees?page=1&pageSize=100&status=active');
        setCommittees(res.items);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = [
    { value: '', label: t('dashboard.allCommittees') },
    ...committees.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn })),
  ];

  return (
    <div className="flex items-center gap-2">
      <IconCommittees className="h-4 w-4 text-neutral-400" />
      <Select
        value={committeeFilter ?? ''}
        onChange={(e) => setCommitteeFilter(e.target.value || null)}
        options={options}
      />
    </div>
  );
}

/* ---------- Loading skeleton ---------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardBody><Skeleton className="h-64 w-full" /></CardBody></Card>
        <Card><CardBody><Skeleton className="h-64 w-full" /></CardBody></Card>
      </div>
    </div>
  );
}

/* ---------- Pending Approvals widget ---------- */

type PendingApprovalItem = {
  id: string;
  type: 'meeting' | 'mom' | 'committee' | 'changeRequest';
  titleAr: string;
  titleEn: string;
  status: string;
  requestedAtUtc: string;
  requestedBy: string;
};

const TYPE_BADGE_VARIANT: Record<PendingApprovalItem['type'], 'info' | 'warning' | 'brand' | 'danger'> = {
  meeting: 'info',
  mom: 'warning',
  committee: 'brand',
  changeRequest: 'danger',
};

const TYPE_ICON: Record<PendingApprovalItem['type'], React.FC<{ className?: string }>> = {
  meeting: IconMeetings,
  mom: IconMom,
  committee: IconCommittees,
  changeRequest: IconChangeRequest,
};

const TYPE_BORDER_COLOR: Record<PendingApprovalItem['type'], string> = {
  meeting: 'border-s-blue-400',
  mom: 'border-s-amber-400',
  committee: 'border-s-brand-400',
  changeRequest: 'border-s-red-400',
};

const TYPE_ICON_BG: Record<PendingApprovalItem['type'], string> = {
  meeting: 'bg-blue-50 text-blue-600',
  mom: 'bg-amber-50 text-amber-600',
  committee: 'bg-brand-50 text-brand-600',
  changeRequest: 'bg-red-50 text-red-600',
};

function PendingApprovalsWidget() {
  const { t, i18n } = useTranslation();
  const { get, post } = useApi();
  const isAr = i18n.language === 'ar';

  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchPendingApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<PendingApprovalItem[]>('/api/v1/approvals/pending');
      setItems(res);
    } catch { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void fetchPendingApprovals(); }, [fetchPendingApprovals]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionInProgress(id);
    try {
      await post(`/api/v1/approvals/${id}/${action}`, {});
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch { /* ignore */ }
    setActionInProgress(null);
  };

  /* Group counts by type */
  const typeCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Card>
        <CardBody className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardBody>
      </Card>
    );
  }

  /* Empty state — render nothing */
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      {/* ── Header bar ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-start transition-colors hover:from-amber-100 hover:to-orange-100"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <IconClock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              {t('dashboard.pendingApprovals')}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {items.length} {items.length === 1
                ? t('dashboard.pendingItem' as any) || 'item'
                : t('dashboard.pendingItems' as any) || 'items'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Type summary pills */}
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge key={type} variant={TYPE_BADGE_VARIANT[type as PendingApprovalItem['type']] ?? 'default'}>
                {t(`dashboard.approvalTypes.${type}` as any)} ({count})
              </Badge>
            ))}
          </div>
          <IconChevronDown
            className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Collapsible items list ── */}
      {expanded && (
        <div className="max-h-[420px] divide-y divide-neutral-100 overflow-y-auto">
          {items.map((item) => {
            const TypeIcon = TYPE_ICON[item.type];
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 border-s-4 ${TYPE_BORDER_COLOR[item.type]} px-5 py-4 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between`}
              >
                {/* Left: icon + info */}
                <div className="flex items-start gap-3 sm:items-center">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_ICON_BG[item.type]}`}>
                    <TypeIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-neutral-900 line-clamp-1">
                        {isAr ? item.titleAr : item.titleEn}
                      </span>
                      <Badge variant={TYPE_BADGE_VARIANT[item.type]}>
                        {t(`dashboard.approvalTypes.${item.type}` as any)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <IconUser className="h-3 w-3" />
                        {item.requestedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3" />
                        {new Intl.DateTimeFormat(i18n.language, {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        }).format(new Date(item.requestedAtUtc))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex shrink-0 gap-2 ps-12 sm:ps-0">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<IconCheckCircle className="h-4 w-4" />}
                    disabled={actionInProgress === item.id}
                    onClick={() => handleAction(item.id, 'approve')}
                  >
                    {t('dashboard.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<IconXCircle className="h-4 w-4" />}
                    disabled={actionInProgress === item.id}
                    onClick={() => handleAction(item.id, 'reject')}
                  >
                    {t('dashboard.reject')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Inner dashboard content ---------- */

function DashboardContent() {
  const { t, i18n } = useTranslation();
  const { user, hasRole } = useAuth();
  const { isLoading } = useDashboard();

  const canSeeApprovals = hasRole('CommitteeHead', 'CommitteeSecretary', 'SystemAdmin');

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      {user && <WelcomeHeader name={user.displayName} role={user.roles[0] ?? ''} t={t} i18n={i18n} />}

      {/* Committee filter + Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CommitteeFilter />
        <DashboardToolbar />
      </div>

      {/* Widget grid */}
      <DashboardGrid />

      {/* Pending Approvals (visible to heads, secretaries, admins) */}
      {canSeeApprovals && <PendingApprovalsWidget />}

      {/* Widget library slide-out panel */}
      <WidgetLibrary />
    </div>
  );
}

/* ---------- Main export ---------- */

export function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
