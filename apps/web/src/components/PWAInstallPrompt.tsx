import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa-install-dismissed') === '1',
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function install() {
    await deferredPrompt!.prompt();
    const { outcome } = await deferredPrompt!.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  }

  function dismiss() {
    sessionStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 start-4 end-4 z-50 mx-auto max-w-md rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4 shadow-lg flex items-center gap-3">
      <p className="flex-1 text-sm font-medium text-neutral-800">{t('pwa.installPrompt')}</p>
      <Button size="sm" onClick={() => void install()}>{t('pwa.install')}</Button>
      <Button variant="ghost" size="sm" onClick={dismiss}>{t('pwa.dismiss')}</Button>
    </div>
  );
}
