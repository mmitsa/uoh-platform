import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { PageHeader, Card, CardBody, Badge, Button, useToast } from '../components/ui';
import { IconAcknowledgment, IconCheckCircle, IconCheck } from '../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type PendingItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  category: string;
  version: number;
  isMandatory: boolean;
};

type HistoryItem = {
  id: string;
  templateId: string;
  templateTitleAr: string;
  templateTitleEn: string;
  category: string;
  templateVersion: number;
  acknowledgedAtUtc: string;
  expiresAtUtc: string | null;
  isActive: boolean;
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function AcknowledgementsPage() {
  const { get, post } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const isAr = i18n.language === 'ar';

  const [pending, setPending] = useState<PendingItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        get<PendingItem[]>('/api/v1/acknowledgments/pending'),
        get<HistoryItem[]>('/api/v1/acknowledgments/my-history'),
      ]);
      setPending(p);
      setHistory(h);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcknowledge = useCallback(async (id: string) => {
    setSigningId(id);
    try {
      await post(`/api/v1/acknowledgments/${id}/acknowledge`);
      toast.success(t('acknowledgments.acknowledged'));
      await fetchData();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSigningId(null);
    }
  }, [post, toast, t, fetchData]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('acknowledgments.title')}
        description={t('acknowledgments.description')}
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={[
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
            tab === 'pending' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
          ].join(' ')}
        >
          {t('acknowledgments.pending')}
          {pending.length > 0 && (
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {pending.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={[
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
            tab === 'history' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
          ].join(' ')}
        >
          {t('acknowledgments.history')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <Card>
            <CardBody>
              <div className="flex flex-col items-center py-12 text-center">
                <IconCheckCircle className="h-12 w-12 text-green-400" />
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{t('acknowledgments.noPending')}</h3>
                <p className="mt-1 text-sm text-neutral-500">{t('acknowledgments.noPendingDescription')}</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <Card key={item.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={item.isMandatory ? 'danger' : 'default'}>
                          {item.isMandatory ? t('acknowledgments.mandatory') : t('acknowledgments.optional')}
                        </Badge>
                        <Badge variant="info">
                          {t(`acknowledgments.categories.${item.category}` as any)}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? item.titleAr : item.titleEn}
                      </h3>
                      <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700 whitespace-pre-wrap">
                        {isAr ? item.bodyAr : item.bodyEn}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => handleAcknowledge(item.id)}
                      disabled={signingId === item.id}
                    >
                      <IconCheck className="h-4 w-4" />
                      {signingId === item.id ? '...' : t('acknowledgments.acknowledge')}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center py-12 text-center">
              <IconAcknowledgment className="h-12 w-12 text-neutral-300" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">{t('acknowledgments.noHistory')}</h3>
              <p className="mt-1 text-sm text-neutral-500">{t('acknowledgments.noHistoryDescription')}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.category')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{isAr ? t('acknowledgments.titleAr') : t('acknowledgments.titleEn')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.version')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.signedAt')}</th>
                    <th className="pb-3 pe-4 text-start font-medium">{t('acknowledgments.expiresAt')}</th>
                    <th className="pb-3 text-start font-medium">{t('acknowledgments.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pe-4">
                        <Badge variant="info">{t(`acknowledgments.categories.${item.category}` as any)}</Badge>
                      </td>
                      <td className="py-3 pe-4 font-medium text-neutral-900">
                        {isAr ? item.templateTitleAr : item.templateTitleEn}
                      </td>
                      <td className="py-3 pe-4 text-neutral-500">v{item.templateVersion}</td>
                      <td className="py-3 pe-4 text-neutral-500">{formatDate(item.acknowledgedAtUtc)}</td>
                      <td className="py-3 pe-4 text-neutral-500">
                        {item.expiresAtUtc ? formatDate(item.expiresAtUtc) : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={item.isActive ? 'success' : 'warning'}>
                          {item.isActive ? t('acknowledgments.acknowledged') : t('acknowledgments.expired')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
