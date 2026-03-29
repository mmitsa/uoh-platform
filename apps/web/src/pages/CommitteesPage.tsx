import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import {
  IconCommittees, IconPlus, IconCheckCircle, IconEye, IconUser, IconTrash,
  IconPencil, IconTarget, IconArrowPath, IconChartBar, IconLink,
  IconFile, IconUpload, IconDownload, IconMeetings, IconTasks, IconChangeRequest,
  IconQrCode,
} from '../components/icons';
import { QrShareModal } from '../components/QrShareModal';
import type { ShareableEntityType } from '../hooks/useShareLink';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type CommitteeListItem = {
  id: string;
  type: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  objectivesAr?: string;
  objectivesEn?: string;
  status: string;
  parentCommitteeId?: string;
  startDate?: string;
  endDate?: string;
  maxMembers?: number;
  memberCount?: number;
  subCommitteeCount?: number;
  createdAtUtc: string;
};

type CommitteeMember = {
  id?: string;
  displayName: string;
  email: string;
  role: string;
};

type CommitteeDetail = CommitteeListItem & {
  members: CommitteeMember[];
};

type AttachmentItem = {
  id: string;
  domain: string;
  entityId: string;
  storedFileId: string;
  title: string;
};

type LinkedMeeting = {
  id: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  status: string;
};

type LinkedTask = {
  id: string;
  titleAr: string;
  titleEn: string;
  dueDateUtc: string;
  status: string;
  priority: string;
  progress: number;
};

type KpiData = {
  meetingsCount: number;
  decisionsCount: number;
  tasksCompletedCount: number;
  attendanceRate: number;
};

type ChangeRequest = {
  id: string;
  committeeId: string;
  requesterObjectId: string;
  requesterDisplayName: string;
  reasonAr: string;
  reasonEn: string;
  changesJson?: string;
  status: string;
  reviewerObjectId?: string;
  reviewerDisplayName?: string;
  reviewNotesAr?: string;
  reviewNotesEn?: string;
  reviewedAtUtc?: string;
  createdAtUtc: string;
};

const CR_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  Pending: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'danger',
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'> = {
  draft: 'default',
  pending_approval: 'warning',
  active: 'success',
  suspended: 'danger',
  closed: 'info',
};

const TYPE_COLORS: Record<string, string> = {
  council: 'bg-purple-50 text-purple-700 border-purple-200',
  permanent: 'bg-blue-50 text-blue-700 border-blue-200',
  temporary: 'bg-amber-50 text-amber-700 border-amber-200',
  main: 'bg-brand-50 text-brand-700 border-brand-200',
  sub: 'bg-teal-50 text-teal-700 border-teal-200',
  self_managed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cross_functional: 'bg-rose-50 text-rose-700 border-rose-200',
};

const TYPE_ICONS: Record<string, string> = {
  council: '\u{1F3DB}\uFE0F',
  permanent: '\u{1F535}',
  temporary: '\u23F1\uFE0F',
  main: '\u{1F3E2}',
  sub: '\u{1F4CE}',
  self_managed: '\u{1F91D}',
  cross_functional: '\u{1F500}',
};

const ALL_TYPES = ['permanent', 'temporary', 'main', 'sub', 'council', 'self_managed', 'cross_functional'] as const;

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
};

const MEETING_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

/** Returns which status actions are available for a given committee status */
function getStatusActions(status: string): Array<{ action: string; targetStatus: string; variant: 'default' | 'success' | 'warning' | 'danger' }> {
  switch (status) {
    case 'draft':
      return [{ action: 'submit', targetStatus: 'pending_approval', variant: 'warning' }];
    case 'pending_approval':
      return [
        { action: 'approve', targetStatus: 'active', variant: 'success' },
        { action: 'reject', targetStatus: 'draft', variant: 'danger' },
      ];
    case 'active':
      return [
        { action: 'suspend', targetStatus: 'suspended', variant: 'warning' },
        { action: 'close', targetStatus: 'closed', variant: 'danger' },
      ];
    case 'suspended':
      return [
        { action: 'reactivate', targetStatus: 'active', variant: 'success' },
        { action: 'close', targetStatus: 'closed', variant: 'danger' },
      ];
    default:
      return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function CommitteesPage() {
  const { get, post, put, patch } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('SystemAdmin');
  const isAr = i18n.language === 'ar';
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const [items, setItems] = useState<CommitteeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('');

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [type, setType] = useState('permanent');
  const [parentCommitteeId, setParentCommitteeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [objectivesAr, setObjectivesAr] = useState('');
  const [objectivesEn, setObjectivesEn] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailCommittee, setDetailCommittee] = useState<CommitteeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'members' | 'documents' | 'integration' | 'kpis' | 'changeRequests'>('overview');
  const [changingStatus, setChangingStatus] = useState(false);

  // Detail sub-data
  const [documents, setDocuments] = useState<AttachmentItem[]>([]);
  const [linkedMeetings, setLinkedMeetings] = useState<LinkedMeeting[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [uploading, setUploading] = useState(false);

  // Members (in detail view)
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  // Change requests
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [showCrForm, setShowCrForm] = useState(false);
  const [crReasonAr, setCrReasonAr] = useState('');
  const [crReasonEn, setCrReasonEn] = useState('');
  const [crChangesJson, setCrChangesJson] = useState('');
  const [savingCr, setSavingCr] = useState(false);
  const [reviewingCr, setReviewingCr] = useState<ChangeRequest | null>(null);
  const [crReviewNotesAr, setCrReviewNotesAr] = useState('');
  const [crReviewNotesEn, setCrReviewNotesEn] = useState('');

  // QR share
  const [shareTarget, setShareTarget] = useState<{ type: ShareableEntityType; id: string; title: string } | null>(null);

  /* ---------- Computed ---------- */
  const canSave = useMemo(() => {
    const nameValid = nameAr.trim().length > 2 && nameEn.trim().length > 2;
    const subValid = type !== 'sub' || parentCommitteeId !== '';
    const tempValid = type !== 'temporary' || startDate !== '';
    return nameValid && subValid && tempValid;
  }, [nameAr, nameEn, type, parentCommitteeId, startDate]);

  const parentOptions = useMemo(() => {
    return items
      .filter((c) => ['main', 'council', 'permanent'].includes(c.type))
      .map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn }));
  }, [items, isAr]);

  const totalCount = items.length;
  const activeCount = items.filter((c) => c.status === 'active').length;
  const pendingCount = items.filter((c) => c.status === 'pending_approval').length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of items) counts[c.type] = (counts[c.type] || 0) + 1;
    return counts;
  }, [items]);

  /* ---------- Load list ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filterType ? `&type=${filterType}` : '';
      const res = await get<{ items: CommitteeListItem[] }>(`/api/v1/committees?page=1&pageSize=50${typeParam}`);
      setItems(res.items);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [get, filterType, toast, t]);

  useEffect(() => { void load(); }, [load]);

  /* ---------- Open Detail ---------- */
  async function openDetail(c: CommitteeListItem) {
    setDetailTab('overview');
    setDetailLoading(true);
    setDetailCommittee(null);
    setDocuments([]);
    setLinkedMeetings([]);
    setLinkedTasks([]);
    setKpiData(null);
    setChangeRequests([]);

    try {
      const [detail, docs, meetings, tasks, kpis, crs] = await Promise.all([
        get<CommitteeDetail>(`/api/v1/committees/${c.id}`),
        get<AttachmentItem[]>(`/api/v1/attachments?domain=committee&entityId=${c.id}`).catch(() => [] as AttachmentItem[]),
        get<LinkedMeeting[]>(`/api/v1/committees/${c.id}/meetings`).catch(() => [] as LinkedMeeting[]),
        get<LinkedTask[]>(`/api/v1/committees/${c.id}/tasks`).catch(() => [] as LinkedTask[]),
        get<KpiData>(`/api/v1/reports/committee-kpis/${c.id}`).catch(() => null),
        get<{ items: ChangeRequest[] }>(`/api/v1/change-requests?committeeId=${c.id}`).catch(() => ({ items: [] as ChangeRequest[] })),
      ]);
      setDetailCommittee(detail);
      setMembers(detail.members ?? []);
      setDocuments(Array.isArray(docs) ? docs : []);
      setLinkedMeetings(Array.isArray(meetings) ? meetings : []);
      setLinkedTasks(Array.isArray(tasks) ? tasks : []);
      setKpiData(kpis);
      setChangeRequests(crs.items ?? []);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailCommittee(null);
    setDetailLoading(false);
  }

  /* ---------- Status Change ---------- */
  async function changeStatus(targetStatus: string) {
    if (!detailCommittee) return;
    setChangingStatus(true);
    try {
      await patch(`/api/v1/committees/${detailCommittee.id}`, { status: targetStatus });
      toast.success(t('committees.statusChanged'));
      setDetailCommittee({ ...detailCommittee, status: targetStatus });
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setChangingStatus(false);
    }
  }

  /* ---------- Create / Edit Form ---------- */
  function resetForm() {
    setNameAr(''); setNameEn(''); setDescriptionAr(''); setDescriptionEn('');
    setType('permanent'); setParentCommitteeId(''); setStartDate(''); setEndDate('');
    setMaxMembers(''); setObjectivesAr(''); setObjectivesEn(''); setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(c: CommitteeDetail) {
    setEditingId(c.id);
    setNameAr(c.nameAr);
    setNameEn(c.nameEn);
    setDescriptionAr(c.descriptionAr ?? '');
    setDescriptionEn(c.descriptionEn ?? '');
    setType(c.type);
    setParentCommitteeId(c.parentCommitteeId ?? '');
    setStartDate(c.startDate ?? '');
    setEndDate(c.endDate ?? '');
    setMaxMembers(c.maxMembers ? String(c.maxMembers) : '');
    setObjectivesAr(c.objectivesAr ?? '');
    setObjectivesEn(c.objectivesEn ?? '');
    setShowForm(true);
  }

  async function saveForm() {
    if (!canSave) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editingId) {
        // PATCH — only send changed fields
        body.nameAr = nameAr;
        body.nameEn = nameEn;
        if (descriptionAr) body.descriptionAr = descriptionAr;
        if (descriptionEn) body.descriptionEn = descriptionEn;
        if (parentCommitteeId) body.parentCommitteeId = parentCommitteeId;
        if (startDate) body.startDate = startDate;
        if (endDate) body.endDate = endDate;
        if (maxMembers) body.maxMembers = parseInt(maxMembers, 10);
        if (objectivesAr) body.objectivesAr = objectivesAr;
        if (objectivesEn) body.objectivesEn = objectivesEn;
        await patch(`/api/v1/committees/${editingId}`, body);
        toast.success(t('committees.edit') + ' \u2713');
      } else {
        // POST — create
        body.type = type;
        body.nameAr = nameAr;
        body.nameEn = nameEn;
        if (descriptionAr) body.descriptionAr = descriptionAr;
        if (descriptionEn) body.descriptionEn = descriptionEn;
        if (parentCommitteeId) body.parentCommitteeId = parentCommitteeId;
        if (startDate) body.startDate = startDate;
        if (endDate) body.endDate = endDate;
        if (maxMembers) body.maxMembers = parseInt(maxMembers, 10);
        if (objectivesAr) body.objectivesAr = objectivesAr;
        if (objectivesEn) body.objectivesEn = objectivesEn;
        await post('/api/v1/committees', body);
        toast.success(t('committees.create') + ' \u2713');
      }
      resetForm();
      setShowForm(false);
      if (detailCommittee && editingId === detailCommittee.id) {
        closeDetail();
      }
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Members ---------- */
  function addMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setMembers([...members, { displayName: newMemberName, email: newMemberEmail, role: newMemberRole }]);
    setNewMemberName(''); setNewMemberEmail(''); setNewMemberRole('member');
  }

  function removeMember(idx: number) {
    setMembers(members.filter((_, i) => i !== idx));
  }

  async function saveMembers() {
    if (!detailCommittee) return;
    setSavingMembers(true);
    try {
      await put(`/api/v1/committees/${detailCommittee.id}/members`, { members });
      toast.success(t('committees.members') + ' \u2713');
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingMembers(false); }
  }

  /* ---------- Change Requests ---------- */
  async function submitChangeRequest() {
    if (!detailCommittee || !crReasonAr.trim() || !crReasonEn.trim()) return;
    setSavingCr(true);
    try {
      await post('/api/v1/change-requests', {
        committeeId: detailCommittee.id,
        requesterObjectId: '',
        requesterDisplayName: '',
        reasonAr: crReasonAr,
        reasonEn: crReasonEn,
        changesJson: crChangesJson || undefined,
      });
      toast.success(t('changeRequests.create') + ' \u2713');
      setCrReasonAr(''); setCrReasonEn(''); setCrChangesJson(''); setShowCrForm(false);
      const crs = await get<{ items: ChangeRequest[] }>(`/api/v1/change-requests?committeeId=${detailCommittee.id}`).catch(() => ({ items: [] as ChangeRequest[] }));
      setChangeRequests(crs.items ?? []);
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingCr(false); }
  }

  async function reviewChangeRequest(crId: string, decision: 'Approved' | 'Rejected') {
    if (!detailCommittee) return;
    setReviewingCr(null);
    try {
      await patch(`/api/v1/change-requests/${crId}/review`, {
        status: decision,
        reviewNotesAr: crReviewNotesAr || undefined,
        reviewNotesEn: crReviewNotesEn || undefined,
      });
      toast.success(t(`changeRequests.statuses.${decision.toLowerCase()}`) + ' \u2713');
      setCrReviewNotesAr(''); setCrReviewNotesEn('');
      const crs = await get<{ items: ChangeRequest[] }>(`/api/v1/change-requests?committeeId=${detailCommittee.id}`).catch(() => ({ items: [] as ChangeRequest[] }));
      setChangeRequests(crs.items ?? []);
    } catch { toast.error(t('errors.generic')); }
  }

  /* ---------- Document Upload ---------- */
  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!detailCommittee || !e.target.files?.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      // Step 1: presign upload
      const presign = await post<{ fileId: string; url: string; headers: Record<string, string> }>('/api/v1/files/presign-upload', {
        fileName: file.name, contentType: file.type, sizeBytes: file.size,
      });
      // Step 2: upload file (skip in demo)
      if (!presign.url.startsWith('#')) {
        await fetch(presign.url, { method: 'PUT', body: file, headers: presign.headers });
      }
      // Step 3: create attachment record
      await post('/api/v1/attachments', {
        domain: 'committee', entityId: detailCommittee.id,
        storedFileId: presign.fileId, title: file.name,
      });
      // Refresh documents
      const docs = await get<AttachmentItem[]>(`/api/v1/attachments?domain=committee&entityId=${detailCommittee.id}`).catch(() => [] as AttachmentItem[]);
      setDocuments(Array.isArray(docs) ? docs : []);
      toast.success(t('actions.upload') + ' \u2713');
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  /* ---------- Constants for rendering ---------- */
  const stats = [
    { label: t('common.all'), value: totalCount, icon: <IconCommittees className="h-5 w-5" />, color: 'bg-brand-50 text-brand-600' },
    { label: t('committees.statuses.active'), value: activeCount, icon: <IconCheckCircle className="h-5 w-5" />, color: 'bg-green-50 text-green-600' },
    { label: t('committees.statuses.pending_approval'), value: pendingCount, icon: <IconEye className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
  ];

  const typeOptions = ALL_TYPES.map((v) => ({ value: v, label: t(`committees.types.${v}` as any) }));
  const filterOptions = [{ value: '', label: t('committees.allTypes') }, ...typeOptions];
  const memberRoleOptions = [
    { value: 'head', label: t('roles.CommitteeHead') },
    { value: 'secretary', label: t('roles.CommitteeSecretary') },
    { value: 'member', label: t('roles.CommitteeMember') },
    { value: 'observer', label: t('roles.Observer') },
  ];
  const showParentField = type === 'sub';
  const showDateFields = type === 'temporary';

  /* ---------- Detail tabs config ---------- */
  const detailTabs = [
    { key: 'overview' as const, label: t('committees.overview'), icon: <IconEye className="h-4 w-4" /> },
    { key: 'members' as const, label: t('committees.members'), icon: <IconUser className="h-4 w-4" /> },
    { key: 'documents' as const, label: t('committees.documents'), icon: <IconFile className="h-4 w-4" /> },
    { key: 'integration' as const, label: t('committees.integration'), icon: <IconLink className="h-4 w-4" /> },
    { key: 'kpis' as const, label: t('committees.kpis'), icon: <IconChartBar className="h-4 w-4" /> },
    { key: 'changeRequests' as const, label: t('changeRequests.title'), icon: <IconChangeRequest className="h-4 w-4" /> },
  ];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('committees.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('committees.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} options={filterOptions} className="w-48" />
          {isAdmin && (
            <Button icon={<IconPlus className="h-4 w-4" />} onClick={openCreateForm}>
              {t('committees.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Type distribution chips */}
      {Object.keys(typeCounts).length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.filter((tp) => typeCounts[tp]).map((tp) => (
            <button
              key={tp} type="button"
              onClick={() => setFilterType(filterType === tp ? '' : tp)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === tp ? TYPE_COLORS[tp] + ' ring-2 ring-offset-1' : TYPE_COLORS[tp]
              }`}
            >
              <span>{TYPE_ICONS[tp]}</span>
              <span>{t(`committees.types.${tp}` as any)}</span>
              <span className="rounded-full bg-neutral-0/60 px-1.5 text-[10px] font-bold">{typeCounts[tp]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Committee cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <IconCommittees className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('committees.noData')}</h3>
            <p className="mt-1 text-sm text-neutral-500">{t('committees.noDataDesc')}</p>
            {isAdmin && (
              <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={openCreateForm}>
                {t('committees.create')}
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id} className="transition-shadow hover:shadow-md">
              <CardBody>
                <div className="mb-3 flex items-start justify-between">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[c.type]?.split(' ').slice(0, 2).join(' ') ?? 'bg-neutral-50 text-neutral-600'}`}>
                    <span className="text-lg">{TYPE_ICONS[c.type] ?? '\u{1F4CB}'}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[c.status] ?? 'default'}>
                    {t(`committees.statuses.${c.status}` as any) ?? c.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-neutral-900">{isAr ? c.nameAr : c.nameEn}</h3>
                <p className="mt-0.5 text-xs text-neutral-400">{isAr ? c.nameEn : c.nameAr}</p>

                {(c.descriptionAr || c.descriptionEn) && (
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500">
                    {isAr ? c.descriptionAr : c.descriptionEn}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[c.type] ?? ''}`}>
                    <span>{TYPE_ICONS[c.type]}</span>
                    {t(`committees.types.${c.type}` as any) ?? c.type}
                  </span>
                  {c.memberCount !== undefined && c.memberCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                      <IconUser className="h-3 w-3" />
                      {c.memberCount}{c.maxMembers ? `/${c.maxMembers}` : ''}
                    </span>
                  )}
                  {c.subCommitteeCount !== undefined && c.subCommitteeCount > 0 && (
                    <span className="text-[10px] text-neutral-500">
                      {TYPE_ICONS.sub} {c.subCommitteeCount} {t('committees.subCommittees')}
                    </span>
                  )}
                </div>

                {c.type === 'temporary' && c.startDate && (
                  <div className="mt-2 text-[10px] text-neutral-400">
                    {c.startDate}{c.endDate ? ` \u2192 ${c.endDate}` : ''}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">{dateFmt.format(new Date(c.createdAtUtc))}</span>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" icon={<IconEye className="h-3.5 w-3.5" />} onClick={() => void openDetail(c)}>
                    {t('committees.viewDetails')}
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="outline" icon={<IconUser className="h-3.5 w-3.5" />} onClick={() => void openDetail(c)}>
                      {t('committees.members')}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" icon={<IconQrCode className="h-3.5 w-3.5" />} onClick={() => setShareTarget({ type: 'Committee', id: c.id, title: isAr ? c.nameAr : c.nameEn })}>
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
      <Modal open={!!detailCommittee || detailLoading} onClose={closeDetail} title="" className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl">
        {detailLoading ? (
          <div className="space-y-4 py-8">
            <div className="mx-auto h-6 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="grid grid-cols-5 gap-2 pt-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-neutral-100" />)}
            </div>
          </div>
        ) : detailCommittee ? (
          <div className="space-y-5">
            {/* Detail header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[detailCommittee.type]?.split(' ').slice(0, 2).join(' ') ?? 'bg-neutral-50'}`}>
                  <span className="text-2xl">{TYPE_ICONS[detailCommittee.type]}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    {isAr ? detailCommittee.nameAr : detailCommittee.nameEn}
                  </h2>
                  <p className="text-sm text-neutral-500">{isAr ? detailCommittee.nameEn : detailCommittee.nameAr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[detailCommittee.status] ?? 'default'}>
                  {t(`committees.statuses.${detailCommittee.status}` as any)}
                </Badge>
                {isAdmin && (
                  <Button size="sm" variant="outline" icon={<IconPencil className="h-3.5 w-3.5" />} onClick={() => openEditForm(detailCommittee)}>
                    {t('actions.edit')}
                  </Button>
                )}
              </div>
            </div>

            {/* Status change actions */}
            {isAdmin && getStatusActions(detailCommittee.status).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <IconArrowPath className="h-4 w-4 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-600">{t('committees.changeStatus')}:</span>
                {getStatusActions(detailCommittee.status).map((sa) => (
                  <Button
                    key={sa.action}
                    size="sm"
                    variant={sa.variant === 'success' ? 'primary' : 'outline'}
                    onClick={() => void changeStatus(sa.targetStatus)}
                    loading={changingStatus}
                    className={sa.variant === 'danger' ? 'border-red-300 text-red-600 hover:bg-red-50' : sa.variant === 'warning' ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}
                  >
                    {t(`committees.statusActions.${sa.action}` as any)}
                  </Button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 -mx-1 px-1 scrollbar-none">
              {detailTabs.map((tab) => (
                <button
                  key={tab.key} type="button"
                  onClick={() => setDetailTab(tab.key)}
                  className={`flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border-b-2 px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium transition-colors shrink-0 ${
                    detailTab === tab.key
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto">
              {/* ---- Overview Tab ---- */}
              {detailTab === 'overview' && (
                <div className="space-y-5">
                  {/* Type & meta */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-neutral-500">{t('committees.type')}</p>
                      <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TYPE_COLORS[detailCommittee.type]}`}>
                        <span>{TYPE_ICONS[detailCommittee.type]}</span>
                        {t(`committees.types.${detailCommittee.type}` as any)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500">{t('committees.createdAt')}</p>
                      <p className="mt-1 text-sm text-neutral-900">{dateFmt.format(new Date(detailCommittee.createdAtUtc))}</p>
                    </div>
                    {detailCommittee.parentCommitteeId && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500">{t('committees.parentLabel')}</p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {items.find((i) => i.id === detailCommittee.parentCommitteeId)
                            ? isAr
                              ? items.find((i) => i.id === detailCommittee.parentCommitteeId)!.nameAr
                              : items.find((i) => i.id === detailCommittee.parentCommitteeId)!.nameEn
                            : detailCommittee.parentCommitteeId}
                        </p>
                      </div>
                    )}
                    {detailCommittee.maxMembers && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500">{t('committees.maxMembers')}</p>
                        <p className="mt-1 text-sm text-neutral-900">{detailCommittee.maxMembers}</p>
                      </div>
                    )}
                    {detailCommittee.type === 'temporary' && detailCommittee.startDate && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-neutral-500">{t('committees.dateRange')}</p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {detailCommittee.startDate}{detailCommittee.endDate ? ` \u2192 ${detailCommittee.endDate}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {(detailCommittee.descriptionAr || detailCommittee.descriptionEn) && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500">{t('committees.descriptionAr').replace(' (Arabic)', '').replace(' (عربي)', '')}</p>
                      {detailCommittee.descriptionAr && (
                        <p className="mt-1 text-sm text-neutral-700" dir="rtl">{detailCommittee.descriptionAr}</p>
                      )}
                      {detailCommittee.descriptionEn && (
                        <p className="mt-1 text-sm text-neutral-700" dir="ltr">{detailCommittee.descriptionEn}</p>
                      )}
                    </div>
                  )}

                  {/* Objectives */}
                  <div>
                    <div className="flex items-center gap-2">
                      <IconTarget className="h-4 w-4 text-brand-600" />
                      <p className="text-xs font-medium text-neutral-500">{t('committees.objectives')}</p>
                    </div>
                    {detailCommittee.objectivesAr || detailCommittee.objectivesEn ? (
                      <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                        {detailCommittee.objectivesAr && (
                          <p className="text-sm text-neutral-700" dir="rtl">{detailCommittee.objectivesAr}</p>
                        )}
                        {detailCommittee.objectivesEn && (
                          <p className="text-sm text-neutral-700" dir="ltr">{detailCommittee.objectivesEn}</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs italic text-neutral-400">{t('committees.noObjectives')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Members Tab ---- */}
              {detailTab === 'members' && (
                <div className="space-y-4">
                  {/* Member count header */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700">
                      {members.length} {t('committees.members')}
                      {detailCommittee.maxMembers ? ` / ${detailCommittee.maxMembers} ${t('committees.maxMembers')}` : ''}
                    </p>
                  </div>

                  {/* Members list */}
                  {members.length > 0 && (
                    <div className="space-y-2">
                      {members.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                            <IconUser className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">{m.displayName}</p>
                            <p className="text-xs text-neutral-500">
                              {m.email} &middot; <span className="font-medium">{t(`roles.${m.role === 'head' ? 'CommitteeHead' : m.role === 'secretary' ? 'CommitteeSecretary' : m.role === 'observer' ? 'Observer' : 'CommitteeMember'}` as any)}</span>
                            </p>
                          </div>
                          {isAdmin && (
                            <button type="button" onClick={() => removeMember(idx)} className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                              <IconTrash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add member form (admin only) */}
                  {isAdmin && (
                    <div className="rounded-lg border border-dashed border-neutral-300 p-3">
                      <p className="mb-2 text-xs font-medium text-neutral-500">{t('committees.addMember')}</p>
                      <div className="grid gap-2">
                        <Input placeholder={t('committees.memberName')} value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                        <Input placeholder={t('committees.memberEmail')} value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} type="email" />
                        <Select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} options={memberRoleOptions} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={addMember} disabled={!newMemberName.trim() || !newMemberEmail.trim()}>
                            {t('committees.addMember')}
                          </Button>
                          <Button size="sm" onClick={() => void saveMembers()} loading={savingMembers}>
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Documents Tab ---- */}
              {detailTab === 'documents' && (
                <div className="space-y-4">
                  {/* Upload button */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <label className="cursor-pointer">
                        <Button size="sm" icon={<IconUpload className="h-3.5 w-3.5" />} loading={uploading} onClick={() => {}}>
                          {t('committees.uploadDocument')}
                        </Button>
                        <input type="file" className="hidden" onChange={(e) => void handleDocumentUpload(e)} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
                      </label>
                    </div>
                  )}

                  {/* Documents list */}
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-0 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <IconFile className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-900">{doc.title}</p>
                            <p className="text-xs text-neutral-500">{t('committees.documents')}</p>
                          </div>
                          <Button size="sm" variant="outline" icon={<IconDownload className="h-3.5 w-3.5" />} onClick={() => {}}>
                            {t('actions.download')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                        <IconFile className="h-6 w-6 text-neutral-400" />
                      </div>
                      <p className="mt-3 text-sm text-neutral-500">{t('committees.noDocuments')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Integration Tab ---- */}
              {detailTab === 'integration' && (
                <div className="space-y-6">
                  {/* Linked Meetings */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <IconMeetings className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-neutral-900">{t('committees.linkedMeetings')}</h4>
                    </div>
                    {linkedMeetings.length > 0 ? (
                      <div className="space-y-2">
                        {linkedMeetings.map((m) => (
                          <div key={m.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{isAr ? m.titleAr : m.titleEn}</p>
                              <p className="text-xs text-neutral-500">{dateFmt.format(new Date(m.startDateTimeUtc))}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${MEETING_STATUS_COLORS[m.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                              {t(`meetings.statuses.${m.status}` as any)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-neutral-400">{t('committees.noLinkedMeetings')}</p>
                    )}
                  </div>

                  {/* Linked Tasks */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <IconTasks className="h-4 w-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-neutral-900">{t('committees.linkedTasks')}</h4>
                    </div>
                    {linkedTasks.length > 0 ? (
                      <div className="space-y-2">
                        {linkedTasks.map((tk) => (
                          <div key={tk.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">{isAr ? tk.titleAr : tk.titleEn}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <p className="text-xs text-neutral-500">{dateFmt.format(new Date(tk.dueDateUtc))}</p>
                                {/* Progress bar */}
                                <div className="h-1.5 w-20 rounded-full bg-neutral-200">
                                  <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${tk.progress}%` }} />
                                </div>
                                <span className="text-[10px] text-neutral-500">{tk.progress}%</span>
                              </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TASK_STATUS_COLORS[tk.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                              {t(`tasks.statuses.${tk.status}` as any)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-neutral-400">{t('committees.noLinkedTasks')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ---- KPIs Tab ---- */}
              {detailTab === 'kpis' && (
                <div>
                  {kpiData ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <IconMeetings className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{kpiData.meetingsCount}</p>
                        <p className="text-xs text-neutral-500">{t('committees.totalMeetingsHeld')}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                          <IconCheckCircle className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{kpiData.decisionsCount}</p>
                        <p className="text-xs text-neutral-500">{t('committees.totalDecisionsMade')}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                          <IconTasks className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{kpiData.tasksCompletedCount}</p>
                        <p className="text-xs text-neutral-500">{t('committees.tasksCompleted')}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <IconChartBar className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{kpiData.attendanceRate}%</p>
                        <p className="text-xs text-neutral-500">{t('committees.attendanceRate')}</p>
                        {/* Visual bar */}
                        <div className="mx-auto mt-2 h-2 w-full max-w-[120px] rounded-full bg-neutral-200">
                          <div className="h-2 rounded-full bg-amber-500" style={{ width: `${kpiData.attendanceRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                        <IconChartBar className="h-6 w-6 text-neutral-400" />
                      </div>
                      <p className="mt-3 text-sm text-neutral-500">{t('committees.noKpiData')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Change Requests Tab ---- */}
              {detailTab === 'changeRequests' && (
                <div className="space-y-4">
                  {/* Header + Create button */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700">
                      {changeRequests.length} {t('changeRequests.title')}
                    </p>
                    <Button size="sm" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setShowCrForm(true)}>
                      {t('changeRequests.create')}
                    </Button>
                  </div>

                  {/* Create form */}
                  {showCrForm && (
                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 space-y-3">
                      <p className="text-xs font-semibold text-neutral-600">{t('changeRequests.create')}</p>
                      <Input label={t('changeRequests.reasonAr')} value={crReasonAr} onChange={(e) => setCrReasonAr(e.target.value)} dir="rtl" />
                      <Input label={t('changeRequests.reasonEn')} value={crReasonEn} onChange={(e) => setCrReasonEn(e.target.value)} dir="ltr" />
                      <Input label={t('changeRequests.changesJson')} value={crChangesJson} onChange={(e) => setCrChangesJson(e.target.value)} dir="ltr" />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setShowCrForm(false); setCrReasonAr(''); setCrReasonEn(''); setCrChangesJson(''); }}>
                          {t('actions.cancel')}
                        </Button>
                        <Button size="sm" onClick={() => void submitChangeRequest()} loading={savingCr} disabled={!crReasonAr.trim() || !crReasonEn.trim()}>
                          {t('actions.submit')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Change requests list */}
                  {changeRequests.length > 0 ? (
                    <div className="space-y-2">
                      {changeRequests.map((cr) => (
                        <div key={cr.id} className="rounded-lg border border-neutral-200 bg-neutral-0 p-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">{isAr ? cr.reasonAr : cr.reasonEn}</p>
                              <p className="mt-0.5 text-xs text-neutral-400">{isAr ? cr.reasonEn : cr.reasonAr}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                                <IconUser className="h-3 w-3" />
                                <span>{cr.requesterDisplayName}</span>
                                <span>&middot;</span>
                                <span>{dateFmt.format(new Date(cr.createdAtUtc))}</span>
                              </div>
                            </div>
                            <Badge variant={CR_STATUS_VARIANT[cr.status] ?? 'default'}>
                              {t(`changeRequests.statuses.${cr.status.toLowerCase()}` as any)}
                            </Badge>
                          </div>

                          {/* Review notes (if reviewed) */}
                          {cr.reviewedAtUtc && (
                            <div className="mt-2 rounded border border-neutral-100 bg-neutral-50 p-2">
                              <p className="text-xs font-medium text-neutral-500">{t('changeRequests.reviewer')}: {cr.reviewerDisplayName}</p>
                              {(cr.reviewNotesAr || cr.reviewNotesEn) && (
                                <p className="mt-1 text-xs text-neutral-600">{isAr ? cr.reviewNotesAr : cr.reviewNotesEn}</p>
                              )}
                            </div>
                          )}

                          {/* Admin review actions */}
                          {isAdmin && cr.status === 'Pending' && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setReviewingCr(cr); setCrReviewNotesAr(''); setCrReviewNotesEn(''); }}>
                                {t('changeRequests.review')}
                              </Button>
                            </div>
                          )}

                          {/* Inline review form */}
                          {reviewingCr?.id === cr.id && (
                            <div className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                              <p className="text-xs font-semibold text-blue-700">{t('changeRequests.review')}</p>
                              <Input label={t('changeRequests.notesAr')} value={crReviewNotesAr} onChange={(e) => setCrReviewNotesAr(e.target.value)} dir="rtl" />
                              <Input label={t('changeRequests.notesEn')} value={crReviewNotesEn} onChange={(e) => setCrReviewNotesEn(e.target.value)} dir="ltr" />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setReviewingCr(null)}>
                                  {t('actions.cancel')}
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => void reviewChangeRequest(cr.id, 'Rejected')}>
                                  {t('changeRequests.reject')}
                                </Button>
                                <Button size="sm" onClick={() => void reviewChangeRequest(cr.id, 'Approved')}>
                                  {t('changeRequests.approve')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : !showCrForm ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                        <IconChangeRequest className="h-6 w-6 text-neutral-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-neutral-900">{t('changeRequests.noData')}</p>
                      <p className="mt-1 text-xs text-neutral-500">{t('changeRequests.noDataDesc')}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ============================================================ */}
      {/*  CREATE / EDIT MODAL                                          */}
      {/* ============================================================ */}
      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingId ? t('committees.edit') : t('committees.create')}>
        <div className="grid gap-4">
          {/* Type selector (only for create) */}
          {!editingId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t('committees.type')}</label>
              <div className="grid grid-cols-1 gap-2">
                {ALL_TYPES.map((tp) => (
                  <button
                    key={tp} type="button"
                    onClick={() => {
                      setType(tp);
                      if (tp !== 'sub') setParentCommitteeId('');
                      if (tp !== 'temporary') { setStartDate(''); setEndDate(''); }
                    }}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-start transition-all ${
                      type === tp ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xl">{TYPE_ICONS[tp]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{t(`committees.types.${tp}` as any)}</p>
                      <p className="text-xs text-neutral-500">{t(`committees.typeDescriptions.${tp}` as any)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name fields */}
          <Input label={t('committees.nameAr')} value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          <Input label={t('committees.nameEn')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />

          {/* Description */}
          <Input label={t('committees.descriptionAr')} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" />
          <Input label={t('committees.descriptionEn')} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} dir="ltr" />

          {/* Parent committee */}
          {showParentField && (
            <Select
              label={t('committees.parentCommittee')}
              value={parentCommitteeId}
              onChange={(e) => setParentCommitteeId(e.target.value)}
              options={[{ value: '', label: t('committees.selectParent') }, ...parentOptions]}
            />
          )}

          {/* Dates (temporary) */}
          {showDateFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('committees.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label={t('committees.endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}

          {/* Max members */}
          <Input label={t('committees.maxMembers')} type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} min="1" />

          {/* Objectives */}
          <Input label={t('committees.objectivesAr')} value={objectivesAr} onChange={(e) => setObjectivesAr(e.target.value)} dir="rtl" />
          <Input label={t('committees.objectivesEn')} value={objectivesEn} onChange={(e) => setObjectivesEn(e.target.value)} dir="ltr" />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => void saveForm()} disabled={!canSave} loading={saving}>
              {editingId ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Share Modal */}
      <QrShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        entityType={shareTarget?.type ?? 'Committee'}
        entityId={shareTarget?.id ?? ''}
        entityTitle={shareTarget?.title ?? ''}
      />
    </div>
  );
}
