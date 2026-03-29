import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import { IconDirective, IconPlus, IconSearch, IconEye, IconCheckCircle, IconQrCode } from '../components/icons';
import { QrShareModal } from '../components/QrShareModal';
import type { ShareableEntityType } from '../hooks/useShareLink';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type DirectiveItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  issuedBy: string;
  referenceNumber: string;
  issueDateUtc: string;
  status: string;
  createdAtUtc: string;
};

type DirectiveDetail = DirectiveItem;

type DecisionItem = {
  id: string;
  directiveId: string;
  titleAr: string;
  titleEn: string;
  notesAr: string;
  notesEn: string;
  status: string;
  committeeId: string | null;
};

type CommitteeOption = {
  id: string;
  nameAr: string;
  nameEn: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const DIRECTIVE_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'> = {
  Draft: 'default',
  Active: 'success',
  Closed: 'danger',
};

const DIRECTIVE_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-neutral-100 text-neutral-700',
  Active: 'bg-green-100 text-green-700',
  Closed: 'bg-red-100 text-red-700',
};

const DECISION_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-neutral-100 text-neutral-700',
  PendingApproval: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Implemented: 'bg-blue-100 text-blue-700',
};

const DIRECTIVE_STATUSES = ['', 'Draft', 'Active', 'Closed'] as const;
const DECISION_STATUSES = ['Draft', 'PendingApproval', 'Approved', 'Rejected', 'Implemented'] as const;

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function DirectivesPage() {
  const { get, post, put } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const canCreate = hasRole('CommitteeSecretary', 'SystemAdmin');
  const isAr = i18n.language === 'ar';
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  /* ---------- List state ---------- */
  const [items, setItems] = useState<DirectiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  /* ---------- Create modal ---------- */
  const [showCreate, setShowCreate] = useState(false);
  const [createTitleAr, setCreateTitleAr] = useState('');
  const [createTitleEn, setCreateTitleEn] = useState('');
  const [createDescAr, setCreateDescAr] = useState('');
  const [createDescEn, setCreateDescEn] = useState('');
  const [createIssuedBy, setCreateIssuedBy] = useState('');
  const [createRefNumber, setCreateRefNumber] = useState('');
  const [createIssueDate, setCreateIssueDate] = useState('');
  const [saving, setSaving] = useState(false);

  /* ---------- Detail modal ---------- */
  const [detailDirective, setDetailDirective] = useState<DirectiveDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  /* ---------- Add decision (inside detail) ---------- */
  const [showAddDecision, setShowAddDecision] = useState(false);
  const [decTitleAr, setDecTitleAr] = useState('');
  const [decTitleEn, setDecTitleEn] = useState('');
  const [decNotesAr, setDecNotesAr] = useState('');
  const [decNotesEn, setDecNotesEn] = useState('');
  const [decCommitteeId, setDecCommitteeId] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  /* ---------- Committees for selector ---------- */
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);
  const [committeesLoaded, setCommitteesLoaded] = useState(false);

  /* ---------- Decision status change ---------- */
  const [changingDecisionId, setChangingDecisionId] = useState<string | null>(null);

  // QR share
  const [shareTarget, setShareTarget] = useState<{ type: ShareableEntityType; id: string; title: string } | null>(null);

  /* ---------- Computed ---------- */
  const canSaveCreate = useMemo(() => {
    return (
      createTitleAr.trim().length > 1 &&
      createTitleEn.trim().length > 1 &&
      createIssuedBy.trim().length > 0 &&
      createRefNumber.trim().length > 0 &&
      createIssueDate.length > 0
    );
  }, [createTitleAr, createTitleEn, createIssuedBy, createRefNumber, createIssueDate]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterStatus) {
      result = result.filter((d) => d.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.titleAr.toLowerCase().includes(q) ||
          d.titleEn.toLowerCase().includes(q) ||
          d.referenceNumber.toLowerCase().includes(q) ||
          d.issuedBy.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, filterStatus, searchQuery]);

  /* ---------- Load list ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<{ items: DirectiveItem[] }>('/api/v1/directives');
      setItems(res.items);
    } catch {
      setError(t('errors.loadFailed'));
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [get, toast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------- Load committees (lazy) ---------- */
  const loadCommittees = useCallback(async () => {
    if (committeesLoaded) return;
    try {
      const res = await get<{ items: CommitteeOption[] }>('/api/v1/committees?page=1&pageSize=100');
      setCommittees(res.items);
      setCommitteesLoaded(true);
    } catch {
      /* silently ignore */
    }
  }, [get, committeesLoaded]);

  /* ---------- Open detail ---------- */
  async function openDetail(item: DirectiveItem) {
    setDetailDirective(null);
    setDecisions([]);
    setDetailLoading(true);
    setShowAddDecision(false);

    try {
      const [detail, decs] = await Promise.all([
        get<DirectiveDetail>(`/api/v1/directives/${item.id}`),
        get<DecisionItem[]>(`/api/v1/directives/${item.id}/decisions`).catch(() => [] as DecisionItem[]),
      ]);
      setDetailDirective(detail);
      setDecisions(Array.isArray(decs) ? decs : []);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailDirective(null);
    setDetailLoading(false);
    setDecisions([]);
    setShowAddDecision(false);
  }

  /* ---------- Reload decisions ---------- */
  async function reloadDecisions(directiveId: string) {
    setDecisionsLoading(true);
    try {
      const decs = await get<DecisionItem[]>(`/api/v1/directives/${directiveId}/decisions`);
      setDecisions(Array.isArray(decs) ? decs : []);
    } catch {
      /* silently ignore */
    } finally {
      setDecisionsLoading(false);
    }
  }

  /* ---------- Change directive status ---------- */
  async function changeDirectiveStatus(targetStatus: string) {
    if (!detailDirective) return;
    setChangingStatus(true);
    try {
      await put(`/api/v1/directives/${detailDirective.id}`, { status: targetStatus });
      toast.success(t('directives.status') + ' \u2713');
      setDetailDirective({ ...detailDirective, status: targetStatus });
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setChangingStatus(false);
    }
  }

  /* ---------- Create directive ---------- */
  function resetCreateForm() {
    setCreateTitleAr('');
    setCreateTitleEn('');
    setCreateDescAr('');
    setCreateDescEn('');
    setCreateIssuedBy('');
    setCreateRefNumber('');
    setCreateIssueDate('');
  }

  async function saveCreate() {
    if (!canSaveCreate) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        titleAr: createTitleAr,
        titleEn: createTitleEn,
        issuedBy: createIssuedBy,
        referenceNumber: createRefNumber,
        issueDateUtc: createIssueDate,
      };
      if (createDescAr.trim()) body.descriptionAr = createDescAr;
      if (createDescEn.trim()) body.descriptionEn = createDescEn;

      await post('/api/v1/directives', body);
      toast.success(t('directives.create') + ' \u2713');
      resetCreateForm();
      setShowCreate(false);
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Add decision ---------- */
  function resetDecisionForm() {
    setDecTitleAr('');
    setDecTitleEn('');
    setDecNotesAr('');
    setDecNotesEn('');
    setDecCommitteeId('');
  }

  function openAddDecision() {
    resetDecisionForm();
    setShowAddDecision(true);
    void loadCommittees();
  }

  async function saveDecision() {
    if (!detailDirective || !decTitleAr.trim() || !decTitleEn.trim()) return;
    setSavingDecision(true);
    try {
      const body: Record<string, unknown> = {
        titleAr: decTitleAr,
        titleEn: decTitleEn,
        notesAr: decNotesAr,
        notesEn: decNotesEn,
      };
      if (decCommitteeId) body.committeeId = decCommitteeId;

      await post(`/api/v1/directives/${detailDirective.id}/decisions`, body);
      toast.success(t('directives.addDecision') + ' \u2713');
      resetDecisionForm();
      setShowAddDecision(false);
      await reloadDecisions(detailDirective.id);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSavingDecision(false);
    }
  }

  /* ---------- Change decision status ---------- */
  async function changeDecisionStatus(decision: DecisionItem, targetStatus: string) {
    if (!detailDirective) return;
    setChangingDecisionId(decision.id);
    try {
      await put(`/api/v1/directives/${detailDirective.id}/decisions`, {
        id: decision.id,
        status: targetStatus,
      });
      toast.success(t('directives.status') + ' \u2713');
      await reloadDecisions(detailDirective.id);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setChangingDecisionId(null);
    }
  }

  /* ---------- Filter options ---------- */
  const statusFilterOptions = [
    { value: '', label: t('common.all') },
    { value: 'Draft', label: t('directives.statuses.draft') },
    { value: 'Active', label: t('directives.statuses.active') },
    { value: 'Closed', label: t('directives.statuses.closed') },
  ];

  const committeeOptions = [
    { value: '', label: t('directives.selectCommittee') },
    ...committees.map((c) => ({
      value: c.id,
      label: isAr ? c.nameAr : c.nameEn,
    })),
  ];

  const decisionStatusOptions = DECISION_STATUSES.map((s) => ({
    value: s,
    label: t(`directives.decisionStatuses.${s === 'PendingApproval' ? 'pending_approval' : s.toLowerCase()}` as any),
  }));

  /* ---------- Directive status actions ---------- */
  function getDirectiveStatusActions(status: string): Array<{ targetStatus: string; label: string; variant: 'default' | 'success' | 'danger' }> {
    switch (status) {
      case 'Draft':
        return [{ targetStatus: 'Active', label: t('directives.statuses.active'), variant: 'success' }];
      case 'Active':
        return [{ targetStatus: 'Closed', label: t('directives.statuses.closed'), variant: 'danger' }];
      default:
        return [];
    }
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('directives.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('directives.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Button icon={<IconPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
              {t('directives.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter bar */}
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <IconSearch className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('directives.title') + '...'}
              className="w-full rounded-md border border-neutral-300 bg-neutral-0 py-2 pe-3 ps-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusFilterOptions}
            className="w-48"
          />
        </CardBody>
      </Card>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {DIRECTIVE_STATUSES.map((s) => {
          const label = s === '' ? t('common.all') : t(`directives.statuses.${s.toLowerCase()}` as any);
          const count = s === '' ? items.length : items.filter((d) => d.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filterStatus === s
                  ? 'bg-brand-700 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              {label}
              <span className={[
                'rounded-full px-1.5 text-[10px] font-bold',
                filterStatus === s ? 'bg-neutral-0/20' : 'bg-neutral-200/60',
              ].join(' ')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Directive cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
                </div>
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-400">
              <IconDirective className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">{error}</h3>
            <Button className="mt-4" variant="outline" onClick={() => void load()}>
              {t('actions.retry') ?? 'Retry'}
            </Button>
          </CardBody>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <IconDirective className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('directives.noData')}</h3>
            <p className="mt-1 text-sm text-neutral-500">{t('directives.noDataDesc')}</p>
            {canCreate && (
              <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                {t('directives.create')}
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((d) => (
            <Card key={d.id} className="transition-shadow hover:shadow-md">
              <CardBody>
                {/* Status badge */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <IconDirective className="h-5 w-5" />
                  </div>
                  <Badge variant={DIRECTIVE_STATUS_VARIANT[d.status] ?? 'default'} dot>
                    {t(`directives.statuses.${d.status.toLowerCase()}` as any) ?? d.status}
                  </Badge>
                </div>

                {/* Titles (bilingual) */}
                <h3 className="font-semibold text-neutral-900 text-start">{isAr ? d.titleAr : d.titleEn}</h3>
                <p className="mt-0.5 text-xs text-neutral-400 text-start">{isAr ? d.titleEn : d.titleAr}</p>

                {/* Description preview */}
                {(d.descriptionAr || d.descriptionEn) && (
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500 text-start">
                    {isAr ? d.descriptionAr : d.descriptionEn}
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    {t('directives.issuedBy')}: {d.issuedBy}
                  </span>
                  <span className="text-neutral-300">|</span>
                  <span>{t('directives.referenceNumber')}: {d.referenceNumber}</span>
                </div>

                {/* Dates */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{t('directives.issueDate')}: {dateFmt.format(new Date(d.issueDateUtc))}</span>
                  <span>{dateFmt.format(new Date(d.createdAtUtc))}</span>
                </div>

                {/* Action */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<IconEye className="h-3.5 w-3.5" />}
                    onClick={() => void openDetail(d)}
                  >
                    {t('directives.viewDetails')}
                  </Button>
                  <Button size="sm" variant="outline" icon={<IconQrCode className="h-3.5 w-3.5" />} onClick={() => setShareTarget({ type: 'Directive', id: d.id, title: isAr ? d.titleAr : d.titleEn })}>
                    {t('share.qrCode')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/*  DETAIL MODAL                                                 */}
      {/* ============================================================ */}
      <Modal
        open={!!detailDirective || detailLoading}
        onClose={closeDetail}
        title=""
        className="sm:max-w-2xl lg:max-w-3xl"
      >
        {detailLoading ? (
          <div className="space-y-4 py-8">
            <div className="mx-auto h-6 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="space-y-2 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-neutral-100" />
              ))}
            </div>
          </div>
        ) : detailDirective ? (
          <div className="space-y-5">
            {/* Detail header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <IconDirective className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 text-start">
                    {isAr ? detailDirective.titleAr : detailDirective.titleEn}
                  </h2>
                  <p className="text-sm text-neutral-500 text-start">
                    {isAr ? detailDirective.titleEn : detailDirective.titleAr}
                  </p>
                </div>
              </div>
              <Badge variant={DIRECTIVE_STATUS_VARIANT[detailDirective.status] ?? 'default'} dot>
                {t(`directives.statuses.${detailDirective.status.toLowerCase()}` as any) ?? detailDirective.status}
              </Badge>
            </div>

            {/* Status change actions */}
            {canCreate && getDirectiveStatusActions(detailDirective.status).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <span className="text-xs font-medium text-neutral-600">{t('directives.status')}:</span>
                {getDirectiveStatusActions(detailDirective.status).map((sa) => (
                  <Button
                    key={sa.targetStatus}
                    size="sm"
                    variant={sa.variant === 'success' ? 'primary' : 'outline'}
                    onClick={() => void changeDirectiveStatus(sa.targetStatus)}
                    loading={changingStatus}
                    className={sa.variant === 'danger' ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}
                  >
                    {sa.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Directive info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('directives.issuedBy')}</p>
                <p className="mt-1 text-sm text-neutral-900">{detailDirective.issuedBy}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('directives.referenceNumber')}</p>
                <p className="mt-1 text-sm text-neutral-900">{detailDirective.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('directives.issueDate')}</p>
                <p className="mt-1 text-sm text-neutral-900">{dateFmt.format(new Date(detailDirective.issueDateUtc))}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('directives.status')}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${DIRECTIVE_STATUS_COLORS[detailDirective.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                  {t(`directives.statuses.${detailDirective.status.toLowerCase()}` as any) ?? detailDirective.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {(detailDirective.descriptionAr || detailDirective.descriptionEn) && (
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('directives.description')}</p>
                {detailDirective.descriptionAr && (
                  <p className="mt-1 text-sm text-neutral-700" dir="rtl">{detailDirective.descriptionAr}</p>
                )}
                {detailDirective.descriptionEn && (
                  <p className="mt-1 text-sm text-neutral-700" dir="ltr">{detailDirective.descriptionEn}</p>
                )}
              </div>
            )}

            {/* Decisions section */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCheckCircle className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">{t('directives.decisions')}</h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                    {decisions.length}
                  </span>
                </div>
                {canCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<IconPlus className="h-3.5 w-3.5" />}
                    onClick={openAddDecision}
                  >
                    {t('directives.addDecision')}
                  </Button>
                )}
              </div>

              {/* Decisions list */}
              <div className="max-h-[35vh] space-y-2 overflow-y-auto">
                {decisionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />
                    ))}
                  </div>
                ) : decisions.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                      <IconCheckCircle className="h-6 w-6 text-neutral-400" />
                    </div>
                    <p className="mt-3 text-sm text-neutral-500">{t('directives.noDecisions')}</p>
                  </div>
                ) : (
                  decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-0 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 text-start">
                            {isAr ? dec.titleAr : dec.titleEn}
                          </p>
                          <p className="text-xs text-neutral-400 text-start">
                            {isAr ? dec.titleEn : dec.titleAr}
                          </p>
                          {(dec.notesAr || dec.notesEn) && (
                            <p className="mt-1 line-clamp-2 text-xs text-neutral-500 text-start">
                              {isAr ? dec.notesAr : dec.notesEn}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            DECISION_STATUS_COLORS[dec.status] ?? 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {t(`directives.decisionStatuses.${dec.status === 'PendingApproval' ? 'pending_approval' : dec.status.toLowerCase()}` as any) ?? dec.status}
                        </span>
                      </div>

                      {/* Decision status changer */}
                      {canCreate && (
                        <div className="mt-2 flex items-center gap-1.5 border-t border-neutral-100 pt-2">
                          <span className="text-[10px] font-medium text-neutral-500">{t('directives.status')}:</span>
                          <select
                            value={dec.status}
                            onChange={(e) => void changeDecisionStatus(dec, e.target.value)}
                            disabled={changingDecisionId === dec.id}
                            className="rounded border border-neutral-200 bg-neutral-0 px-1.5 py-0.5 text-[10px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {decisionStatusOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          {changingDecisionId === dec.id && (
                            <span className="h-3 w-3 animate-spin rounded-full border border-brand-600 border-t-transparent" />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add decision inline form */}
              {showAddDecision && (
                <div className="mt-3 rounded-lg border border-dashed border-neutral-300 p-4">
                  <p className="mb-3 text-xs font-semibold text-neutral-700">{t('directives.addDecision')}</p>
                  <div className="grid gap-3">
                    <Input
                      label={t('directives.decisionTitleAr')}
                      value={decTitleAr}
                      onChange={(e) => setDecTitleAr(e.target.value)}
                      dir="rtl"
                    />
                    <Input
                      label={t('directives.decisionTitleEn')}
                      value={decTitleEn}
                      onChange={(e) => setDecTitleEn(e.target.value)}
                      dir="ltr"
                    />
                    <Input
                      label={t('directives.notesAr')}
                      value={decNotesAr}
                      onChange={(e) => setDecNotesAr(e.target.value)}
                      dir="rtl"
                    />
                    <Input
                      label={t('directives.notesEn')}
                      value={decNotesEn}
                      onChange={(e) => setDecNotesEn(e.target.value)}
                      dir="ltr"
                    />
                    <Select
                      label={t('directives.linkedCommittee')}
                      value={decCommitteeId}
                      onChange={(e) => setDecCommitteeId(e.target.value)}
                      options={committeeOptions}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddDecision(false);
                          resetDecisionForm();
                        }}
                      >
                        {t('actions.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void saveDecision()}
                        loading={savingDecision}
                        disabled={!decTitleAr.trim() || !decTitleEn.trim()}
                      >
                        {t('actions.save')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ============================================================ */}
      {/*  CREATE DIRECTIVE MODAL                                       */}
      {/* ============================================================ */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetCreateForm();
        }}
        title={t('directives.create')}
      >
        <div className="grid gap-4">
          <Input
            label={t('directives.titleAr')}
            value={createTitleAr}
            onChange={(e) => setCreateTitleAr(e.target.value)}
            dir="rtl"
          />
          <Input
            label={t('directives.titleEn')}
            value={createTitleEn}
            onChange={(e) => setCreateTitleEn(e.target.value)}
            dir="ltr"
          />
          <Input
            label={t('directives.descriptionAr')}
            value={createDescAr}
            onChange={(e) => setCreateDescAr(e.target.value)}
            dir="rtl"
          />
          <Input
            label={t('directives.descriptionEn')}
            value={createDescEn}
            onChange={(e) => setCreateDescEn(e.target.value)}
            dir="ltr"
          />
          <Input
            label={t('directives.issuedBy')}
            value={createIssuedBy}
            onChange={(e) => setCreateIssuedBy(e.target.value)}
          />
          <Input
            label={t('directives.referenceNumber')}
            value={createRefNumber}
            onChange={(e) => setCreateRefNumber(e.target.value)}
          />
          <Input
            label={t('directives.issueDate')}
            type="date"
            value={createIssueDate}
            onChange={(e) => setCreateIssueDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                resetCreateForm();
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={() => void saveCreate()}
              disabled={!canSaveCreate}
              loading={saving}
            >
              {t('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Share Modal */}
      <QrShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        entityType={shareTarget?.type ?? 'Directive'}
        entityId={shareTarget?.id ?? ''}
        entityTitle={shareTarget?.title ?? ''}
      />
    </div>
  );
}
