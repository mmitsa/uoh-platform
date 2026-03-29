import { useEffect, useRef } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { connectHub, disconnectHub } from '../services/signalr';
import { useAuth } from '../contexts/AuthContext';

type HubName = 'notifications' | 'chat' | 'live-survey';

export function useSignalR(
  hub: HubName,
  handlers?: Record<string, (...args: any[]) => void>,
) {
  const { user, isDemo } = useAuth();
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!user || isDemo) return;

    let mounted = true;

    (async () => {
      const conn = await connectHub(hub);
      if (!mounted || !conn) return;
      connectionRef.current = conn;

      if (handlers) {
        for (const [event, handler] of Object.entries(handlers)) {
          conn.on(event, handler);
        }
      }
    })();

    return () => {
      mounted = false;
      const conn = connectionRef.current;
      if (conn && handlers) {
        for (const event of Object.keys(handlers)) {
          conn.off(event);
        }
      }
      disconnectHub(hub);
    };
  }, [user, isDemo, hub]);

  return connectionRef;
}
