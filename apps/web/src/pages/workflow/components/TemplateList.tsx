import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Card,
  CardBody,
  Modal,
  useToast,
  type Column,
} from '../../../components/ui';
import { IconWorkflow, IconPlus } from '../../../components/icons';
import type { BackendTemplate } from '../types';

interface TemplateListProps {
  onEdit: (template: BackendTemplate) => void;
  onNew: () => void;
}

export function TemplateList({ onEdit, onNew }: TemplateListProps) {
  const { t, i18n } = useTranslation();
  const { get, post, del } = useApi();
  const toast = useToast();
  const isAr = i18n.language === 'ar';

  const [items, setItems] = useState<BackendTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await get<BackendTemplate[]>('/api/v1/workflow/templates');
      setItems(res);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleDuplicate(id: string) {
    try {
      await post(`/api/v1/workflow/templates/${id}/duplicate`);
      toast.success(t('workflow.duplicated'));
      await load();
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await del(`/api/v1/workflow/templates/${deleteId}`);
      toast.success(t('workflow.deleted'));
      setDeleteId(null);
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setDeleting(false);
    }
  }

  function getStepCount(definitionJson: string): number {
    try {
      const def = JSON.parse(definitionJson);
      const states = new Set<string>();
      states.add(def.initialState ?? 'draft');
      for (const t of def.transitions ?? []) {
        states.add(t.from);
        states.add(t.to);
      }
      return states.size;
    } catch { return 0; }
  }

  const columns: Column<BackendTemplate>[] = [
    {
      key: 'name',
      header: t('workflow.templateName'),
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <IconWorkflow className="h-4 w-4" />
          </div>
          <span className="font-medium text-neutral-900">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'domain',
      header: t('workflow.domain'),
      render: (r) => <Badge variant="brand">{r.domain}</Badge>,
    },
    {
      key: 'steps',
      header: isAr ? 'الخطوات' : 'Steps',
      render: (r) => getStepCount(r.definitionJson),
    },
    {
      key: 'created',
      header: t('common.createdAt'),
      render: (r) => new Date(r.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(r)}
            className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
          >
            {t('actions.edit')}
          </button>
          <button
            type="button"
            onClick={() => handleDuplicate(r.id)}
            className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            {isAr ? 'نسخ' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(r.id)}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            {t('actions.delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('workflow.title')}
        description={t('workflow.description')}
        actions={
          <Button onClick={onNew} icon={<IconPlus className="h-4 w-4" />}>
            {t('workflow.createTemplate')}
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            keyExtractor={(r) => r.id}
            emptyIcon={<IconWorkflow className="h-10 w-10 text-neutral-400" />}
            emptyTitle={t('workflow.noData')}
            emptyDescription={t('workflow.noDataDesc')}
          />
        </CardBody>
      </Card>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900">
            {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {isAr ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this template? This action cannot be undone.'}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t('actions.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
