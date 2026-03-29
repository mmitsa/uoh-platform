import 'text-encoding-polyfill';
import 'event-target-polyfill';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { getToken } from '../api/apiClient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5062';

let connection: HubConnection | null = null;

export async function getSignalRConnection(): Promise<HubConnection> {
  if (connection) return connection;

  const token = await getToken();
  if (!token || token.startsWith('demo-token-')) {
    throw new Error('SignalR not available in demo mode');
  }

  connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/notifications`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  return connection;
}

export async function startSignalR(): Promise<void> {
  try {
    const conn = await getSignalRConnection();
    if (conn.state === 'Disconnected') {
      await conn.start();
    }
  } catch {
    // ignore in demo mode
  }
}

export async function stopSignalR(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
