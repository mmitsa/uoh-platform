import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

export function PWAUpdatePrompt() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [updateFn, setUpdateFn] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUpdateFn(() => detail.update);
      setShow(true);
    };
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  const handleUpdate = useCallback(() => {
    void updateFn?.(true);
  }, [updateFn]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 start-4 end-4 z-50 mx-auto max-w-md rounded-xl border border-brand-200 bg-white p-4 shadow-lg flex items-center gap-3">
      <p className="flex-1 text-sm text-neutral-700">{t('pwa.updateAvailable')}</p>
      <Button size="sm" onClick={handleUpdate}>{t('pwa.update')}</Button>
      <Button variant="ghost" size="sm" onClick={() => setShow(false)}>{t('pwa.dismiss')}</Button>
    </div>
  );
}
