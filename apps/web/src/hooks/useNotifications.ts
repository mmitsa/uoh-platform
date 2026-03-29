import { useState, useEffect, useCallback } from 'react';
import { useSignalR } from './useSignalR';
import { useAuth } from '../app/auth';
import { isDemoMode } from './useApi';
import { DEMO_NOTIFICATIONS } from '../app/demoData';

export interface AppNotification {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr?: string;
  bodyEn?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAtUtc: string;
}

export function useNotifications() {
  const { token, isAuthenticated } = useAuth();
  const connection = useSignalR();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const demo = isDemoMode();

  // Demo mode: load demo notifications on mount
  useEffect(() => {
    if (!demo) return;
    const items = DEMO_NOTIFICATIONS as AppNotification[];
    setNotifications(items);
    setUnreadCount(items.filter(n => !n.isRead).length);
  }, [demo]);

  const fetchUnreadCount = useCallback(async () => {
    if (demo || !isAuthenticated || !token) return;
    try {
      const res = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch { /* ignore */ }
  }, [baseUrl, isAuthenticated, token, demo]);

  const fetchNotifications = useCallback(async () => {
    if (demo || !isAuthenticated || !token) return;
    try {
      const res = await fetch(`${baseUrl}/api/v1/notifications?pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
      }
    } catch { /* ignore */ }
  }, [baseUrl, isAuthenticated, token, demo]);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    if (demo || !connection) return;

    const handler = (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    connection.on('ReceiveNotification', handler);
    return () => {
      connection.off('ReceiveNotification', handler);
    };
  }, [connection, demo]);

  const markAsRead = useCallback(async (id: string) => {
    if (demo) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    if (!token) return;
    try {
      await fetch(`${baseUrl}/api/v1/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, [baseUrl, token, demo]);

  const markAllAsRead = useCallback(async () => {
    if (demo) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return;
    }
    if (!token) return;
    try {
      await fetch(`${baseUrl}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, [baseUrl, token, demo]);

  return { unreadCount, notifications, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
