import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardBody,
  Badge,
  DataTable,
  type Column,
  Modal,
  PageHeader,
  useToast,
} from '../../components/ui';
import {
  IconAnnouncement,
  IconPlus,
  IconPencil,
  IconTrash,
  IconEye,
} from '../../components/icons';
import { usePermissions } from '../../app/permissions';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Announcement {
  id: string;
  type: 'circular' | 'news' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  publishDate: string;
  expiryDate: string;
  targetAudience: 'all' | 'specific_roles';
  targetRoles: string[];
  showAsPopup: boolean;
  requireAcknowledgment: boolean;
  surveyId: string | null;
  attachments: { id: string; fileName: string; sizeBytes: number }[];
  createdBy: string;
  createdAtUtc: string;
  acknowledgmentCount: number;
  totalTargetUsers: number;
}

interface AnnouncementFormData {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type: 'circular' | 'news' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  publishDate: string;
  expiryDate: string;
  targetAudience: 'all' | 'specific_roles';
  showAsPopup: boolean;
  requireAcknowledgment: boolean;
  surveyId: string;
}

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

interface SurveyOption {
  id: string;
  titleAr: string;
  titleEn: string;
}

const EMPTY_FORM: AnnouncementFormData = {
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
  type: 'circular',
  priority: 'normal',
  status: 'draft',
  publishDate: '',
  expiryDate: '',
  targetAudience: 'all',
  showAsPopup: false,
  requireAcknowledgment: false,
  surveyId: '',
};

/* -------------------------------------------------------------------------- */
/*  Badge variants                                                            */
/* -------------------------------------------------------------------------- */

const TYPE_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  circular: 'info',
  news: 'success',
  announcement: 'warning',
};

const PRIORITY_BADGE: Record<string, 'default' | 'warning' | 'danger'> = {
  normal: 'default',
  important: 'warning',
  urgent: 'danger',
};

const STATUS_BADGE: Record<string, 'default' | 'success' | 'info'> = {
  draft: 'default',
  published: 'success',
  archived: 'info',
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AnnouncementsPage() {
  const { t, i18n } = useTranslation();
  const { get, post, put, del } = useApi();
  const { success, error } = useToast();
  usePermissions();
  const isRtl = i18n.language === 'ar';

  /* ---- State: table ---- */
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* ---- State: create / edit modal ---- */
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ---- State: delete confirmation ---- */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- State: results modal ---- */
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsItem, setResultsItem] = useState<Announcement | null>(null);

  /* ---- State: surveys list for dropdown ---- */
  const [surveys, setSurveys] = useState<SurveyOption[]>([]);

  /* ------------------------------------------------------------------------ */
  /*  Data fetching                                                           */
  /* ------------------------------------------------------------------------ */

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const data = await get<PaginatedResponse<Announcement>>(
        `/api/v1/announcements?${params.toString()}`,
      );
      setItems(data.items);
      setTotal(data.total);
    } catch {
      error(t('announcements.noAnnouncements'));
    } finally {
      setLoading(false);
    }
  }, [get, page, pageSize, search, filterType, filterStatus, error, t]);

  const fetchSurveys = useCallback(async () => {
    try {
      const data = await get<PaginatedResponse<SurveyOption>>(
        '/api/v1/surveys?page=1&pageSize=100&status=Active',
      );
      setSurveys(data.items);
    } catch {
      /* silently ignore — survey dropdown will just be empty */
    }
  }, [get]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  /* ------------------------------------------------------------------------ */
  /*  Create / Edit helpers                                                   */
  /* ------------------------------------------------------------------------ */

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      bodyAr: item.bodyAr,
      bodyEn: item.bodyEn,
      type: item.type,
      priority: item.priority,
      status: item.status,
      publishDate: item.publishDate ? item.publishDate.slice(0, 10) : '',
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
      targetAudience: item.targetAudience,
      showAsPopup: item.showAsPopup,
      requireAcknowledgment: item.requireAcknowledgment,
      surveyId: item.surveyId ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        surveyId: formData.surveyId || null,
      };

      if (editingItem) {
        await put(`/api/v1/announcements/${editingItem.id}`, payload);
      } else {
        await post('/api/v1/announcements', payload);
      }
      success(t('announcements.saved'));
      closeModal();
      fetchItems();
    } catch {
      error(t('actions.save'));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Delete helpers                                                          */
  /* ------------------------------------------------------------------------ */

  const openDeleteModal = (item: Announcement) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingItem(null);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await del(`/api/v1/announcements/${deletingItem.id}`);
      success(t('announcements.deleted'));
      closeDeleteModal();
      fetchItems();
    } catch {
      error(t('actions.delete'));
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Results modal                                                           */
  /* ------------------------------------------------------------------------ */

  const openResultsModal = (item: Announcement) => {
    setResultsItem(item);
    setShowResultsModal(true);
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
    setResultsItem(null);
  };

  /* ------------------------------------------------------------------------ */
  /*  Helpers                                                                 */
  /* ------------------------------------------------------------------------ */

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const set = (key: keyof AnnouncementFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* ------------------------------------------------------------------------ */
  /*  Table columns                                                           */
  /* ------------------------------------------------------------------------ */

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      header: t('announcements.titleAr'),
      render: (item) => (
        <div className="max-w-[280px]">
          <div className="truncate font-medium text-neutral-900">
            {isRtl ? item.titleAr : item.titleEn}
          </div>
          <div className="truncate text-xs text-neutral-500 mt-0.5">
            {isRtl ? item.titleEn : item.titleAr}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('announcements.type'),
      render: (item) => (
        <Badge variant={TYPE_BADGE[item.type]}>
          {t(`announcements.type_${item.type}`)}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: t('announcements.priority'),
      render: (item) => (
        <Badge variant={PRIORITY_BADGE[item.priority]}>
          {t(`announcements.priority_${item.priority}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('announcements.status'),
      render: (item) => (
        <Badge variant={STATUS_BADGE[item.status]}>
          {t(`announcements.status_${item.status}`)}
        </Badge>
      ),
    },
    {
      key: 'dateRange',
      header: t('announcements.publishDate'),
      render: (item) => (
        <div className="text-xs text-neutral-600">
          <div>{formatDate(item.publishDate)}</div>
          <div className="text-neutral-400">{formatDate(item.expiryDate)}</div>
        </div>
      ),
    },
    {
      key: 'popup',
      header: '',
      render: (item) =>
        item.showAsPopup ? (
          <span title={t('announcements.showAsPopup')} className="text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 016.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.75 10zm14.5 0a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM6.112 14.89a.75.75 0 011.06 0l-1.06 1.06a.75.75 0 01-1.062-1.061l1.061-1.06zm7.776 0a.75.75 0 011.061 1.06l-1.06 1.062a.75.75 0 01-1.062-1.062l1.061-1.06zM10 17a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 17z" />
            </svg>
          </span>
        ) : null,
    },
    {
      key: 'acknowledgment',
      header: t('announcements.totalAcknowledged'),
      render: (item) =>
        item.requireAcknowledgment ? (
          <button
            onClick={() => openResultsModal(item)}
            className="text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline"
          >
            {item.acknowledgmentCount}/{item.totalTargetUsers}
          </button>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(item)}
            title={t('announcements.editAnnouncement')}
          >
            <IconPencil className="h-4 w-4" />
          </Button>

          {(item.requireAcknowledgment || item.surveyId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openResultsModal(item)}
              title={t('announcements.viewResults')}
            >
              <IconEye className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(item)}
            title={t('announcements.deleteAnnouncement')}
            className="text-red-500 hover:text-red-700"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <PageHeader
        title={t('announcements.title')}
        description={t('announcements.description')}
        actions={
          <Button onClick={openCreateModal}>
            <IconPlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('announcements.createAnnouncement')}
          </Button>
        }
      />

      {/* ---- Filters ---- */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-64">
              <Input
                label={t('actions.search')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('actions.search')}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                label={t('announcements.type')}
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                placeholder={t('actions.filter')}
                options={[
                  { value: 'circular', label: t('announcements.type_circular') },
                  { value: 'news', label: t('announcements.type_news') },
                  { value: 'announcement', label: t('announcements.type_announcement') },
                ]}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                label={t('announcements.status')}
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                placeholder={t('actions.filter')}
                options={[
                  { value: 'draft', label: t('announcements.status_draft') },
                  { value: 'published', label: t('announcements.status_published') },
                  { value: 'archived', label: t('announcements.status_archived') },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ---- Data table ---- */}
      <Card>
        <CardBody>
          <DataTable<Announcement>
            columns={columns}
            data={items}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyIcon={<IconAnnouncement className="mx-auto h-12 w-12 text-gray-400" />}
            emptyTitle={t('announcements.noAnnouncements')}
            emptyDescription={t('announcements.noAnnouncementsDesc')}
          />
        </CardBody>

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
            <p className="text-xs text-neutral-500">
              {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} / ${total}`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                &laquo;
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                &raquo;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ================================================================== */}
      {/*  Create / Edit Modal                                               */}
      {/* ================================================================== */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingItem ? t('announcements.editAnnouncement') : t('announcements.createAnnouncement')}
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {/* Title — bilingual two-column */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('announcements.titleAr')}
              value={formData.titleAr}
              onChange={(e) => set('titleAr', e.target.value)}
              dir="rtl"
              required
            />
            <Input
              label={t('announcements.titleEn')}
              value={formData.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              dir="ltr"
              required
            />
          </div>

          {/* Body — bilingual */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Textarea
              label={t('announcements.bodyAr')}
              value={formData.bodyAr}
              onChange={(e) => set('bodyAr', e.target.value)}
              dir="rtl"
              rows={4}
              required
            />
            <Textarea
              label={t('announcements.bodyEn')}
              value={formData.bodyEn}
              onChange={(e) => set('bodyEn', e.target.value)}
              dir="ltr"
              rows={4}
              required
            />
          </div>

          {/* Type / Priority / Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label={t('announcements.type')}
              value={formData.type}
              onChange={(e) => set('type', e.target.value)}
              options={[
                { value: 'circular', label: t('announcements.type_circular') },
                { value: 'news', label: t('announcements.type_news') },
                { value: 'announcement', label: t('announcements.type_announcement') },
              ]}
            />
            <Select
              label={t('announcements.priority')}
              value={formData.priority}
              onChange={(e) => set('priority', e.target.value)}
              options={[
                { value: 'normal', label: t('announcements.priority_normal') },
                { value: 'important', label: t('announcements.priority_important') },
                { value: 'urgent', label: t('announcements.priority_urgent') },
              ]}
            />
            <Select
              label={t('announcements.status')}
              value={formData.status}
              onChange={(e) => set('status', e.target.value)}
              options={[
                { value: 'draft', label: t('announcements.status_draft') },
                { value: 'published', label: t('announcements.status_published') },
                { value: 'archived', label: t('announcements.status_archived') },
              ]}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('announcements.publishDate')}
              type="date"
              value={formData.publishDate}
              onChange={(e) => set('publishDate', e.target.value)}
              required
            />
            <Input
              label={t('announcements.expiryDate')}
              type="date"
              value={formData.expiryDate}
              onChange={(e) => set('expiryDate', e.target.value)}
              required
            />
          </div>

          {/* Target audience */}
          <Select
            label={t('announcements.targetAudience')}
            value={formData.targetAudience}
            onChange={(e) => set('targetAudience', e.target.value)}
            options={[
              { value: 'all', label: t('announcements.target_all') },
              { value: 'specific_roles', label: t('announcements.target_specific_roles') },
            ]}
          />

          {/* Checkboxes: popup + acknowledgment */}
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={formData.showAsPopup}
                onChange={(e) => set('showAsPopup', e.target.checked)}
              />
              <span className="text-sm text-neutral-700">
                {t('announcements.showAsPopup')}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={formData.requireAcknowledgment}
                onChange={(e) => set('requireAcknowledgment', e.target.checked)}
              />
              <span className="text-sm text-neutral-700">
                {t('announcements.requireAcknowledgment')}
              </span>
            </label>
          </div>

          {/* Optional survey */}
          <Select
            label={t('announcements.attachedSurvey')}
            value={formData.surveyId}
            onChange={(e) => set('surveyId', e.target.value)}
            placeholder={t('announcements.noneSurvey')}
            options={surveys.map((s) => ({
              value: s.id,
              label: isRtl ? s.titleAr : s.titleEn,
            }))}
          />

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.titleAr || !formData.titleEn}
              loading={saving}
            >
              {editingItem ? t('actions.save') : t('announcements.createAnnouncement')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/*  Delete Confirmation Modal                                         */}
      {/* ================================================================== */}
      <Modal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        title={t('announcements.deleteAnnouncement')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('announcements.confirmDelete')}{' '}
            <strong>{deletingItem && (isRtl ? deletingItem.titleAr : deletingItem.titleEn)}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
            >
              {t('announcements.deleteAnnouncement')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/*  Results / Acknowledgment Modal                                    */}
      {/* ================================================================== */}
      <Modal
        open={showResultsModal}
        onClose={closeResultsModal}
        title={t('announcements.viewResults')}
        className="sm:max-w-lg"
      >
        {resultsItem && (
          <div className="space-y-5">
            {/* Announcement title */}
            <div>
              <h3 className="font-semibold text-neutral-900">
                {isRtl ? resultsItem.titleAr : resultsItem.titleEn}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {isRtl ? resultsItem.titleEn : resultsItem.titleAr}
              </p>
            </div>

            {/* Acknowledgment progress */}
            {resultsItem.requireAcknowledgment && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-neutral-700">
                    {t('announcements.acknowledgmentProgress')}
                  </span>
                  <span className="font-semibold text-brand-600">
                    {resultsItem.acknowledgmentCount}/{resultsItem.totalTargetUsers}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{
                      width: `${resultsItem.totalTargetUsers > 0
                        ? Math.round((resultsItem.acknowledgmentCount / resultsItem.totalTargetUsers) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {resultsItem.totalTargetUsers > 0
                    ? `${Math.round((resultsItem.acknowledgmentCount / resultsItem.totalTargetUsers) * 100)}%`
                    : '0%'}{' '}
                  {t('announcements.totalAcknowledged')}
                </p>
              </div>
            )}

            {/* Survey responses info */}
            {resultsItem.surveyId && (
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-500">
                    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                  </svg>
                  {t('announcements.surveyResponses')}
                </div>
                <p className="text-xs text-neutral-500">
                  {t('announcements.noSurveyResults')}
                </p>
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-500">{t('announcements.type')}</span>
                <div className="mt-1">
                  <Badge variant={TYPE_BADGE[resultsItem.type]}>
                    {t(`announcements.type_${resultsItem.type}`)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-neutral-500">{t('announcements.priority')}</span>
                <div className="mt-1">
                  <Badge variant={PRIORITY_BADGE[resultsItem.priority]}>
                    {t(`announcements.priority_${resultsItem.priority}`)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-neutral-500">{t('announcements.publishDate')}</span>
                <div className="mt-1 font-medium text-neutral-700">{formatDate(resultsItem.publishDate)}</div>
              </div>
              <div>
                <span className="text-neutral-500">{t('announcements.expiryDate')}</span>
                <div className="mt-1 font-medium text-neutral-700">{formatDate(resultsItem.expiryDate)}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={closeResultsModal}>
                {t('actions.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
