import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PermissionState = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const { get, post, del } = useApi();
  const [permission, setPermission] = useState<PermissionState>(
    () => ('Notification' in window ? (Notification.permission as PermissionState) : 'denied'),
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      })
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') return;

      const vapidData = await get<{ publicKey: string }>('/api/v1/notifications/vapid-public-key');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const json = sub.toJSON();
      await post('/api/v1/notifications/push-subscription', {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      });
      setSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    } finally {
      setLoading(false);
    }
  }, [get, post, del]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await del(
          `/api/v1/notifications/push-subscription?endpoint=${encodeURIComponent(sub.endpoint)}`,
        );
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscription failed:', err);
    } finally {
      setLoading(false);
    }
  }, [get, post, del]);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
