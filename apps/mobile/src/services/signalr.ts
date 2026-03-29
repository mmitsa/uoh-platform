import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { getToken, isDemoMode } from '../api/apiClient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5062';

type HubName = 'notifications' | 'chat' | 'live-survey';

const connections = new Map<HubName, HubConnection>();

function buildConnection(hub: HubName, token: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/${hub}`, { accessTokenFactory: () => token })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function connectHub(hub: HubName): Promise<HubConnection | null> {
  if (isDemoMode()) return null;

  const existing = connections.get(hub);
  if (existing && existing.state === HubConnectionState.Connected) return existing;

  const token = await getToken();
  if (!token) return null;

  const connection = buildConnection(hub, token);
  connections.set(hub, connection);

  try {
    await connection.start();
  } catch (err) {
    console.warn(`[SignalR] Failed to connect to ${hub}:`, err);
  }

  return connection;
}

export async function disconnectHub(hub: HubName): Promise<void> {
  const connection = connections.get(hub);
  if (connection) {
    try { await connection.stop(); } catch { /* ignore */ }
    connections.delete(hub);
  }
}

export async function disconnectAll(): Promise<void> {
  const hubs: HubName[] = ['notifications', 'chat', 'live-survey'];
  await Promise.all(hubs.map(h => disconnectHub(h)));
}

export function getHub(hub: HubName): HubConnection | null {
  return connections.get(hub) ?? null;
}
