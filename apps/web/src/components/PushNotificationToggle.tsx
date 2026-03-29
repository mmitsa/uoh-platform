import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { IconBell } from './icons';

export function PushNotificationToggle() {
  const { t } = useTranslation();
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!('PushManager' in window)) return null;
  if (permission === 'denied') return null;

  return (
    <button
      type="button"
      title={subscribed ? t('pushNotifications.disable') : t('pushNotifications.enable')}
      className={[
        'rounded-md p-2 transition-colors',
        subscribed
          ? 'text-brand-600 bg-brand-50'
          : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
      ].join(' ')}
      onClick={() => void (subscribed ? unsubscribe() : subscribe())}
      disabled={loading}
    >
      <IconBell className="h-4 w-4" />
    </button>
  );
}
