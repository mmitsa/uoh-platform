import { useState, useEffect, useCallback, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useAuth } from '../app/auth';
import { isDemoMode } from './useApi';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderObjectId: string;
  senderDisplayName: string;
  content: string;
  type: string;
  createdAtUtc: string;
  attachments?: Array<{
    id: string;
    storedFileId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }>;
}

interface TypingEvent {
  conversationId: string;
  userOid: string;
  displayName: string;
}

interface ReadEvent {
  conversationId: string;
  userOid: string;
}

export function useChatHub() {
  const { token, isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const handlersRef = useRef<{
    onMessage?: (msg: ChatMessage) => void;
    onTyping?: (evt: TypingEvent) => void;
    onRead?: (evt: ReadEvent) => void;
  }>({});

  useEffect(() => {
    if (isDemoMode() || !isAuthenticated || !token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('ReceiveMessage', (msg: ChatMessage) => {
      handlersRef.current.onMessage?.(msg);
    });

    conn.on('UserTyping', (evt: TypingEvent) => {
      handlersRef.current.onTyping?.(evt);
    });

    conn.on('MessageRead', (evt: ReadEvent) => {
      handlersRef.current.onRead?.(evt);
    });

    conn.start()
      .then(() => setConnection(conn))
      .catch(err => console.warn('Chat SignalR connection failed:', err));

    return () => { conn.stop(); };
  }, [isAuthenticated, token]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, type = 'text', attachmentFileIds?: string[]) => {
      if (isDemoMode() || !connection) return;
      await connection.invoke('SendMessage', conversationId, content, type, attachmentFileIds ?? null);
    },
    [connection],
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (isDemoMode() || !connection) return;
      await connection.invoke('MarkAsRead', conversationId);
    },
    [connection],
  );

  const startTyping = useCallback(
    async (conversationId: string) => {
      if (isDemoMode() || !connection) return;
      await connection.invoke('StartTyping', conversationId);
    },
    [connection],
  );

  const onMessage = useCallback((handler: (msg: ChatMessage) => void) => {
    handlersRef.current.onMessage = handler;
  }, []);

  const onTyping = useCallback((handler: (evt: TypingEvent) => void) => {
    handlersRef.current.onTyping = handler;
  }, []);

  const onRead = useCallback((handler: (evt: ReadEvent) => void) => {
    handlersRef.current.onRead = handler;
  }, []);

  return { sendMessage, markAsRead, startTyping, onMessage, onTyping, onRead };
}
