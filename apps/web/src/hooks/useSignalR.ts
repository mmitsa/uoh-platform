import { useState, useEffect } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useAuth } from '../app/auth';
import { isDemoMode } from './useApi';

export function useSignalR() {
  const { token, isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || isDemoMode()) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    conn.start()
      .then(() => setConnection(conn))
      .catch(err => console.warn('SignalR connection failed:', err));

    return () => {
      conn.stop();
    };
  }, [isAuthenticated, token]);

  return connection;
}
