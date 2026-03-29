import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Button, Input, Select, useToast } from '../components/ui';
import { IconAttachments, IconUpload, IconDownload, IconFile, IconTrash } from '../components/icons';

type Attachment = { id: string; domain: string; entityId: string; storedFileId: string; title: string };

function getFileIcon(title: string): string {
  const ext = title.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return 'bg-red-50 text-red-600';
  if (['doc', 'docx'].includes(ext)) return 'bg-blue-50 text-blue-600';
  if (['xls', 'xlsx'].includes(ext)) return 'bg-green-50 text-green-600';
  if (['ppt', 'pptx'].includes(ext)) return 'bg-amber-50 text-amber-600';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'bg-purple-50 text-purple-600';
  return 'bg-neutral-50 text-neutral-600';
}

export function AttachmentsPage() {
  const { get, post, del } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [domain, setDomain] = useState<'meeting' | 'mom' | 'committee'>('meeting');
  const [entityId, setEntityId] = useState('');
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    if (!entityId.trim()) return;
    setLoading(true);
    try { const res = await get<Attachment[]>(`/api/v1/attachments?domain=${domain}&entityId=${entityId}`); setItems(res); }
    catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function uploadAndAttach(file: File) {
    if (!entityId.trim()) return;
    setUploading(true);
    try {
      const presign = await post<any>('/api/v1/files/presign-upload', {
        fileName: file.name, contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size, classification: 'internal', prefix: `${domain}/${entityId}`,
      });
      await fetch(presign.url, { method: 'PUT', headers: presign.headers, body: file });
      await post('/api/v1/attachments', { domain, entityId, storedFileId: presign.fileId, title: file.name });
      toast.success(t('attachments.upload') + ' ✓');
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setUploading(false); }
  }

  async function openDownload(storedFileId: string) {
    try { const presign = await get<any>(`/api/v1/files/${storedFileId}/download`); window.open(presign.url, '_blank'); }
    catch { toast.error(t('errors.generic')); }
  }

  async function deleteAttachment(id: string) {
    setDeleting(id);
    try {
      await del(`/api/v1/attachments/${id}`);
      toast.success(t('actions.delete') + ' ✓');
      setItems(items.filter((a) => a.id !== id));
    } catch { toast.error(t('errors.generic')); }
    finally { setDeleting(null); }
  }

  const domainOptions = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'mom', label: 'MOM' },
    { value: 'committee', label: 'Committee' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('attachments.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('attachments.description')}</p>
        </div>
        {hasRole('CommitteeSecretary') && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAndAttach(f); }} />
            <Button icon={<IconUpload className="h-4 w-4" />} onClick={() => fileRef.current?.click()} loading={uploading} disabled={!entityId.trim()}>
              {t('attachments.upload')}
            </Button>
          </div>
        )}
      </div>

      {/* Search card */}
      <Card className="border-brand-100 bg-brand-50/30">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Select label={t('attachments.domainLabel')} value={domain} onChange={(e) => setDomain(e.target.value as any)} options={domainOptions} />
            </div>
            <div className="flex-1">
              <Input label={t('attachments.entityIdPlaceholder')} value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => void load()}>{t('actions.load')}</Button>
          </div>
        </CardBody>
      </Card>

      {/* File cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardBody className="flex flex-col items-center py-6">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-neutral-200" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
            </CardBody></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><IconAttachments className="h-8 w-8" /></div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('attachments.noData')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('attachments.noDataDesc')}</p>
        </CardBody></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((a) => (
            <Card key={a.id} className="group transition-shadow hover:shadow-md">
              <CardBody className="flex flex-col items-center py-6 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${getFileIcon(a.title)}`}>
                  <IconFile className="h-6 w-6" />
                </div>
                <p className="mt-3 w-full truncate text-sm font-medium text-neutral-900">{a.title}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openDownload(a.storedFileId)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-600 hover:bg-brand-50"
                  >
                    <IconDownload className="h-3 w-3" />
                    {t('attachments.download')}
                  </button>
                  {hasRole('CommitteeSecretary') && (
                    <button
                      type="button"
                      onClick={() => void deleteAttachment(a.id)}
                      disabled={deleting === a.id}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <IconTrash className="h-3 w-3" />
                      {t('actions.delete')}
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
