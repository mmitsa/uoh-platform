import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import {
  PageHeader, Badge, Button, Modal,
  Input, Select, Textarea, DataTable, useToast,
  type Column,
} from '../../components/ui';
import { IconAcknowledgment, IconPlus, IconEye, IconPencil } from '../../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TemplateItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  category: string;
  version: number;
  isMandatory: boolean;
  requiresRenewal: boolean;
  renewalDays: number | null;
  appliesToRoles: string | null;
  status: string;
  createdAtUtc: string;
  publishedAtUtc: string | null;
  signatureCount: number;
};

type TemplateDetail = TemplateItem & {
  bodyAr: string;
  bodyEn: string;
  updatedAtUtc: string;
};

type SignatureItem = {
  id: string;
  userId: string;
  userDisplayNameAr: string;
  userDisplayNameEn: string;
  userEmail: string;
  templateVersion: number;
  acknowledgedAtUtc: string;
  expiresAtUtc: string | null;
  ipAddress: string | null;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'> = {
  Draft: 'default',
  Active: 'success',
  Archived: 'warning',
};

const CATEGORIES = [
  'Confidentiality', 'DataPrivacy', 'CodeOfConduct', 'AcceptableUse',
  'CommitteeCharter', 'IntellectualProperty', 'ConflictOfInterest',
  'SecurityPolicy', 'Custom',
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function AcknowledgementsAdminPage() {
  const { get, post, patch } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const isAr = i18n.language === 'ar';

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [signaturesOpen, setSignaturesOpen] = useState(false);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [signaturesLoading, setSignaturesLoading] = useState(false);

  // Form fields
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [category, setCategory] = useState('Custom');
  const [isMandatory, setIsMandatory] = useState(true);
  const [requiresRenewal, setRequiresRenewal] = useState(false);
  const [renewalDays, setRenewalDays] = useState('');
  const [appliesToRoles, setAppliesToRoles] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<{ items: TemplateItem[] }>('/api/v1/acknowledgments?page=1&pageSize=100');
      setTemplates(data.items);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetForm = () => {
    setTitleAr(''); setTitleEn('');
    setBodyAr(''); setBodyEn('');
    setCategory('Custom'); setIsMandatory(true);
    setRequiresRenewal(false); setRenewalDays('');
    setAppliesToRoles(''); setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = useCallback(async (id: string) => {
    try {
      const detail = await get<TemplateDetail>(`/api/v1/acknowledgments/${id}`);
      setEditingId(id);
      setTitleAr(detail.titleAr);
      setTitleEn(detail.titleEn);
      setBodyAr(detail.bodyAr);
      setBodyEn(detail.bodyEn);
      setCategory(detail.category);
      setIsMandatory(detail.isMandatory);
      setRequiresRenewal(detail.requiresRenewal);
      setRenewalDays(detail.renewalDays?.toString() ?? '');
      setAppliesToRoles(detail.appliesToRoles ?? '');
      setFormOpen(true);
    } catch {
      toast.error(t('errors.generic'));
    }
  }, [get, toast, t]);

  const handleSave = useCallback(async () => {
    if (!titleAr.trim() || !titleEn.trim() || !bodyAr.trim() || !bodyEn.trim()) {
      toast.error(t('errors.required'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleAr, titleEn, bodyAr, bodyEn,
        category, isMandatory, requiresRenewal,
        renewalDays: requiresRenewal && renewalDays ? parseInt(renewalDays) : null,
        appliesToRoles: appliesToRoles.trim() || null,
      };

      if (editingId) {
        await patch(`/api/v1/acknowledgments/${editingId}`, payload);
      } else {
        await post('/api/v1/acknowledgments', payload);
      }

      toast.success(t('actions.save'));
      setFormOpen(false);
      resetForm();
      await fetchTemplates();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }, [titleAr, titleEn, bodyAr, bodyEn, category, isMandatory, requiresRenewal, renewalDays, appliesToRoles, editingId, patch, post, toast, t, fetchTemplates]);

  const handlePublish = useCallback(async (id: string) => {
    try {
      await post(`/api/v1/acknowledgments/${id}/publish`);
      toast.success(t('acknowledgments.publish'));
      await fetchTemplates();
    } catch {
      toast.error(t('errors.generic'));
    }
  }, [post, toast, t, fetchTemplates]);

  const handleArchive = useCallback(async (id: string) => {
    try {
      await post(`/api/v1/acknowledgments/${id}/archive`);
      toast.success(t('acknowledgments.archive'));
      await fetchTemplates();
    } catch {
      toast.error(t('errors.generic'));
    }
  }, [post, toast, t, fetchTemplates]);

  const viewSignatures = useCallback(async (id: string) => {
    setSignaturesOpen(true);
    setSignaturesLoading(true);
    try {
      const data = await get<{ items: SignatureItem[] }>(`/api/v1/acknowledgments/${id}/signatures?page=1&pageSize=100`);
      setSignatures(data.items);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSignaturesLoading(false);
    }
  }, [get, toast, t]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const columns: Column<TemplateItem>[] = [
    {
      key: 'title',
      header: isAr ? t('acknowledgments.titleAr') : t('acknowledgments.titleEn'),
      render: (row) => (
        <div className="font-medium text-neutral-900">
          {isAr ? row.titleAr : row.titleEn}
        </div>
      ),
    },
    {
      key: 'category',
      header: t('acknowledgments.category'),
      render: (row) => (
        <Badge variant="info">{t(`acknowledgments.categories.${row.category}` as any)}</Badge>
      ),
    },
    {
      key: 'mandatory',
      header: t('acknowledgments.mandatory'),
      render: (row) => (
        <Badge variant={row.isMandatory ? 'danger' : 'default'}>
          {row.isMandatory ? t('acknowledgments.mandatory') : t('acknowledgments.optional')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('acknowledgments.status'),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'default'}>
          {t(`acknowledgments.statuses.${row.status}` as any)}
        </Badge>
      ),
    },
    {
      key: 'version',
      header: t('acknowledgments.version'),
      render: (row) => <span className="text-neutral-500">v{row.version}</span>,
    },
    {
      key: 'signatureCount',
      header: t('acknowledgments.signatureCount'),
      render: (row) => (
        <button
          type="button"
          onClick={() => viewSignatures(row.id)}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          {row.signatureCount}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openEdit(row.id)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <IconPencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => viewSignatures(row.id)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <IconEye className="h-4 w-4" />
          </button>
          {row.status === 'Draft' && (
            <Button variant="ghost" onClick={() => handlePublish(row.id)}>
              {t('acknowledgments.publish')}
            </Button>
          )}
          {row.status === 'Active' && (
            <Button variant="ghost" onClick={() => handleArchive(row.id)}>
              {t('acknowledgments.archive')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('acknowledgments.adminTitle')}
        description={t('acknowledgments.adminDescription')}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <IconPlus className="h-4 w-4" />
            {t('acknowledgments.createTemplate')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        emptyIcon={<IconAcknowledgment className="h-12 w-12" />}
        emptyTitle={t('acknowledgments.noTemplates')}
        emptyDescription={t('acknowledgments.noTemplatesDescription')}
        keyExtractor={(row) => row.id}
      />

      {/* Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); resetForm(); }} title={editingId ? t('acknowledgments.editTemplate') : t('acknowledgments.createTemplate')}>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('acknowledgments.titleAr')} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
            <Input label={t('acknowledgments.titleEn')} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <Textarea label={t('acknowledgments.bodyAr')} value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} rows={4} dir="rtl" />
          <Textarea label={t('acknowledgments.bodyEn')} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} rows={4} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('acknowledgments.category')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES.map((c) => ({ value: c, label: t(`acknowledgments.categories.${c}` as any) }))}
            />
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-brand-600" />
                {t('acknowledgments.mandatory')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={requiresRenewal} onChange={(e) => setRequiresRenewal(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-brand-600" />
                {t('acknowledgments.requiresRenewal')}
              </label>
            </div>
          </div>
          {requiresRenewal && (
            <Input label={t('acknowledgments.renewalDays')} type="number" value={renewalDays} onChange={(e) => setRenewalDays(e.target.value)} />
          )}
          <Input
            label={t('acknowledgments.appliesToRoles')}
            value={appliesToRoles}
            onChange={(e) => setAppliesToRoles(e.target.value)}
            placeholder={t('acknowledgments.allRoles')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setFormOpen(false); resetForm(); }}>
              {t('actions.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('actions.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Signatures Modal */}
      <Modal open={signaturesOpen} onClose={() => setSignaturesOpen(false)} title={t('acknowledgments.signatures')}>
        <div className="p-6">
          {signaturesLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            </div>
          ) : signatures.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">{t('acknowledgments.noHistory')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="pb-3 pe-4 text-start font-medium">{t('nav.users')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.version')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.signedAt')}</th>
                    <th className="pb-3 text-start font-medium">{t('acknowledgments.ipAddress')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {signatures.map((sig) => (
                    <tr key={sig.id}>
                      <td className="py-3 pe-4">
                        <div className="font-medium text-neutral-900">{isAr ? sig.userDisplayNameAr : sig.userDisplayNameEn}</div>
                        <div className="text-xs text-neutral-500">{sig.userEmail}</div>
                      </td>
                      <td className="py-3 pe-4 text-neutral-500">v{sig.templateVersion}</td>
                      <td className="py-3 pe-4 text-neutral-500">{formatDate(sig.acknowledgedAtUtc)}</td>
                      <td className="py-3 text-neutral-400 text-xs">{sig.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
