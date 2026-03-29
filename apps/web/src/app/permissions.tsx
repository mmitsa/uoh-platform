import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './auth';
import { apiFetch } from './api';

interface PermissionContextValue {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (...keys: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const isDemoMode = user?.id?.startsWith('demo-');

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions(new Set());
      return;
    }

    // Demo mode: SystemAdmin gets wildcard, others get basic
    if (isDemoMode) {
      if (user?.roles.includes('SystemAdmin')) {
        setPermissions(new Set(['*']));
      } else {
        // Give demo users reasonable defaults based on their role
        const basePerms = [
          'dashboard.view', 'committees.view', 'meetings.view', 'moms.view',
          'tasks.view', 'votes.view', 'surveys.view', 'attachments.view',
          'reports.view', 'chat.view', 'myarchive.view',
        ];
        setPermissions(new Set(basePerms));
      }
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ permissions: string[] }>('/api/v1/users/me/permissions');
      setPermissions(new Set(res.permissions));
    } catch {
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDemoMode, user]);

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (key: string) => {
      if (permissions.has('*')) return true;
      return permissions.has(key);
    },
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (...keys: string[]) => keys.some((k) => hasPermission(k)),
    [hasPermission],
  );

  const value = useMemo<PermissionContextValue>(
    () => ({ permissions, loading, hasPermission, hasAnyPermission, refreshPermissions: fetchPermissions }),
    [permissions, loading, hasPermission, hasAnyPermission, fetchPermissions],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
}
