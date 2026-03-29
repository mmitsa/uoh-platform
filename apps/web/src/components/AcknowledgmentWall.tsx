import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { Button } from './ui';
import { IconAcknowledgment, IconCheckCircle, IconShield } from './icons';

type PendingAcknowledgment = {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  category: string;
  version: number;
  isMandatory: boolean;
};

interface AcknowledgmentWallProps {
  children: React.ReactNode;
}

export function AcknowledgmentWall({ children }: AcknowledgmentWallProps) {
  const { get, post } = useApi();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [pending, setPending] = useState<PendingAcknowledgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSigned, setTotalSigned] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      const data = await get<PendingAcknowledgment[]>('/api/v1/acknowledgments/pending');
      const mandatory = data.filter((a) => a.isMandatory);
      setPending(mandatory);
      setCurrentIndex(0);
    } catch {
      // If 401 or other error, skip wall
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleAcknowledge = useCallback(async () => {
    const current = pending[currentIndex];
    if (!current) return;

    setSigning(true);
    try {
      await post(`/api/v1/acknowledgments/${current.id}/acknowledge`);
      setTotalSigned((prev) => prev + 1);

      if (currentIndex + 1 < pending.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setPending([]);
      }
    } catch {
      // Error handled silently, user can retry
    } finally {
      setSigning(false);
    }
  }, [post, pending, currentIndex]);

  if (loading) return null;
  if (pending.length === 0) return <>{children}</>;

  const current = pending[currentIndex];
  const total = pending.length;
  const completed = totalSigned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 shadow-lg">
            <IconShield className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('acknowledgments.wallTitle')}</h1>
          <p className="mt-2 text-sm text-neutral-300">{t('acknowledgments.wallDescription')}</p>
          <div className="mt-3 text-sm font-medium text-brand-300">
            {t('acknowledgments.wallProgress', { current: completed, total })}
          </div>
          {/* Progress bar */}
          <div className="mx-auto mt-3 h-2 w-64 overflow-hidden rounded-full bg-neutral-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card */}
        {current && (
          <div className="rounded-2xl bg-white shadow-2xl">
            {/* Category badge */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <IconAcknowledgment className="h-5 w-5 text-brand-600" />
                <span className="text-sm font-semibold text-brand-700">
                  {t(`acknowledgments.categories.${current.category}` as any)}
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                {t('acknowledgments.version')} {current.version}
              </span>
            </div>

            {/* Title */}
            <div className="px-6 pt-5">
              <h2 className="text-lg font-bold text-neutral-900">
                {isAr ? current.titleAr : current.titleEn}
              </h2>
            </div>

            {/* Body */}
            <div className="max-h-64 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {isAr ? current.bodyAr : current.bodyEn}
              </div>
            </div>

            {/* Action */}
            <div className="border-t border-neutral-100 px-6 py-4">
              <Button
                variant="primary"
                onClick={handleAcknowledge}
                disabled={signing}
                className="w-full"
              >
                <IconCheckCircle className="h-5 w-5" />
                {signing ? '...' : t('acknowledgments.acknowledge')}
              </Button>
              <p className="mt-3 text-center text-xs text-neutral-400">
                {currentIndex + 1} / {total}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
