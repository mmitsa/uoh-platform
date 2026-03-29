import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, setToken, getToken, isDemoMode } from '../api/apiClient';
import type { AppRole, AppUser, LoginResponse } from '../api/types';

const DEMO_USERS: Record<string, AppUser> = {
  SystemAdmin: { id: 'demo-admin', displayName: 'Admin User', email: 'admin@demo.uoh.edu.sa', roles: ['SystemAdmin'] },
  CommitteeHead: { id: 'demo-head', displayName: 'Committee Head', email: 'head@demo.uoh.edu.sa', roles: ['CommitteeHead'] },
  CommitteeSecretary: { id: 'demo-sec', displayName: 'Committee Secretary', email: 'secretary@demo.uoh.edu.sa', roles: ['CommitteeSecretary'] },
  CommitteeMember: { id: 'demo-member', displayName: 'Committee Member', email: 'member@demo.uoh.edu.sa', roles: ['CommitteeMember'] },
  Observer: { id: 'demo-observer', displayName: 'Observer', email: 'observer@demo.uoh.edu.sa', roles: ['Observer'] },
};

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isDemo: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: AppRole) => Promise<void>;
  biometricLogin: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isDemo: false });

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token?.startsWith('demo-token-')) {
        const role = token.replace('demo-token-', '');
        const user = DEMO_USERS[role];
        if (user) {
          setState({ user, isLoading: false, isDemo: true });
          return;
        }
      }
      if (token) {
        try {
          const user = await api.get<AppUser>('/api/v1/auth/me');
          setState({ user, isLoading: false, isDemo: false });
          return;
        } catch {
          await setToken(null);
        }
      }
      setState({ user: null, isLoading: false, isDemo: false });
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/api/v1/auth/login', { email, password });
    await setToken(res.token);
    setState({ user: res.user, isLoading: false, isDemo: false });
  }, []);

  const demoLogin = useCallback(async (role: AppRole) => {
    const user = DEMO_USERS[role];
    if (!user) throw new Error('Invalid demo role');
    await setToken(`demo-token-${role}`);
    setState({ user, isLoading: false, isDemo: true });
  }, []);

  const biometricLogin = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) throw new Error('NO_BIOMETRIC_HARDWARE');
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) throw new Error('NO_BIOMETRIC_ENROLLED');
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate' });
    if (!result.success) throw new Error('BIOMETRIC_FAILED');
    const token = await getToken();
    if (!token) throw new Error('NO_STORED_TOKEN');
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setState({ user: null, isLoading: false, isDemo: false });
  }, []);

  const hasRole = useCallback((role: AppRole) => {
    return state.user?.roles.includes(role) ?? false;
  }, [state.user]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    demoLogin,
    biometricLogin,
    logout,
    hasRole,
  }), [state, login, demoLogin, biometricLogin, logout, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
