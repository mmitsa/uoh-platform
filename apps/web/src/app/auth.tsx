import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

export type AppRole = 'SystemAdmin' | 'CommitteeHead' | 'CommitteeSecretary' | 'CommitteeMember' | 'Observer' | (string & {});

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  roles: AppRole[];
  permissions?: string[];
}

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: AppRole) => void;
  logout: () => void;
  hasRole: (...roles: AppRole[]) => boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'uoh_auth';

function loadPersistedUser(): { user: AppUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user && parsed?.token) return parsed;
  } catch { /* corrupted */ }
  return null;
}

function persistUser(user: AppUser, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
}

function clearPersistedUser() {
  localStorage.removeItem(STORAGE_KEY);
}

const DEMO_USERS: Record<AppRole, AppUser> = {
  SystemAdmin: {
    id: 'demo-admin',
    displayName: 'م. خالد المهندس',
    email: 'sysadmin@uoh.edu.sa',
    roles: ['SystemAdmin'],
  },
  CommitteeHead: {
    id: 'demo-head',
    displayName: 'د. فهد العميد',
    email: 'dean.fahad@uoh.edu.sa',
    roles: ['CommitteeHead'],
  },
  CommitteeSecretary: {
    id: 'demo-secretary',
    displayName: 'أ. نورة الكاتبة',
    email: 'secretary.noura@uoh.edu.sa',
    roles: ['CommitteeSecretary'],
  },
  CommitteeMember: {
    id: 'demo-member',
    displayName: 'د. أحمد الباحث',
    email: 'member.ahmed@uoh.edu.sa',
    roles: ['CommitteeMember'],
  },
  Observer: {
    id: 'demo-observer',
    displayName: 'أ. ريم المراقبة',
    email: 'auditor.reem@uoh.edu.sa',
    roles: ['Observer'],
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => loadPersistedUser()?.user ?? null);
  const [token, setToken] = useState<string | null>(() => loadPersistedUser()?.token ?? null);

  useEffect(() => {
    if (user && token) {
      persistUser(user, token);
    }
  }, [user, token]);

  const login = useCallback(async (email: string, password: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Login failed (${res.status})`);
    }
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    persistUser(data.user, data.token);
  }, []);

  const demoLogin = useCallback((role: AppRole) => {
    const demoUser = DEMO_USERS[role];
    const demoToken = `demo-token-${role}-${Date.now()}`;
    setUser(demoUser);
    setToken(demoToken);
    persistUser(demoUser, demoToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearPersistedUser();
  }, []);

  const hasRole = useCallback(
    (...roles: AppRole[]) => {
      if (!user) return false;
      if (user.roles.includes('SystemAdmin')) return true;
      return roles.some((r) => user.roles.includes(r));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, login, demoLogin, logout, hasRole, token }),
    [user, token, login, demoLogin, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
