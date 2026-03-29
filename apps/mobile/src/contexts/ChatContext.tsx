import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/apiClient';
import type { ChatConversation, ChatMessage, PagedResponse } from '../api/types';
import { useAuth } from './AuthContext';
import { useSignalR } from '../hooks/useSignalR';

/* ---- State ---- */
interface ChatState {
  conversations: ChatConversation[];
  unreadCount: number;
  activeConversationId: string | null;
  isLoading: boolean;
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: ChatConversation[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'RECEIVE_MESSAGE'; payload: ChatMessage }
  | { type: 'MARK_READ'; payload: { conversationId: string } }
  | { type: 'USER_TYPING'; payload: { conversationId: string; userId: string; displayName: string } };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS': {
      const conversations = action.payload;
      const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return { ...state, conversations, unreadCount, isLoading: false };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.payload };
    case 'RECEIVE_MESSAGE': {
      const msg = action.payload;
      const isActive = state.activeConversationId === msg.conversationId;
      const conversations = state.conversations.map(c => {
        if (c.id !== msg.conversationId) return c;
        return {
          ...c,
          lastMessage: msg,
          unreadCount: isActive ? c.unreadCount : c.unreadCount + 1,
          updatedAtUtc: msg.createdAtUtc,
        };
      });
      // Move the updated conversation to the top
      conversations.sort((a, b) => new Date(b.updatedAtUtc).getTime() - new Date(a.updatedAtUtc).getTime());
      const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return { ...state, conversations, unreadCount };
    }
    case 'MARK_READ': {
      const conversations = state.conversations.map(c => {
        if (c.id !== action.payload.conversationId) return c;
        return { ...c, unreadCount: 0 };
      });
      const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return { ...state, conversations, unreadCount };
    }
    case 'USER_TYPING':
      // Typing state is handled locally; no state change needed here
      return state;
    default:
      return state;
  }
}

const initialState: ChatState = {
  conversations: [],
  unreadCount: 0,
  activeConversationId: null,
  isLoading: false,
};

/* ---- Context ---- */
interface ChatContextValue extends ChatState {
  fetchConversations: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  typingUsers: Map<string, string>;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

/* ---- Provider ---- */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const typingUsersRef = useRef<Map<string, string>>(new Map());
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchConversations = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.get<PagedResponse<ChatConversation>>('/api/v1/chat/conversations');
      dispatch({ type: 'SET_CONVERSATIONS', payload: res.items });
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await api.post(`/api/v1/chat/conversations/${conversationId}/read`);
      dispatch({ type: 'MARK_READ', payload: { conversationId } });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
    } catch {
      // silently fail
    }
  }, [queryClient]);

  const setActiveConversation = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
  }, []);

  // SignalR handlers
  const handleReceiveMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'RECEIVE_MESSAGE', payload: message });
    queryClient.invalidateQueries({ queryKey: ['chat-messages', message.conversationId] });
  }, [queryClient]);

  const handleMessageRead = useCallback((data: { conversationId: string; userId: string }) => {
    queryClient.invalidateQueries({ queryKey: ['chat-messages', data.conversationId] });
  }, [queryClient]);

  const handleUserTyping = useCallback((data: { conversationId: string; userId: string; displayName: string }) => {
    const key = `${data.conversationId}:${data.userId}`;
    typingUsersRef.current.set(key, data.displayName);

    // Clear existing timer for this user
    const existingTimer = typingTimersRef.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    // Auto-remove typing indicator after 3 seconds
    const timer = setTimeout(() => {
      typingUsersRef.current.delete(key);
      typingTimersRef.current.delete(key);
    }, 3000);
    typingTimersRef.current.set(key, timer);
  }, []);

  const signalRHandlers = useMemo(() => ({
    ReceiveMessage: handleReceiveMessage,
    MessageRead: handleMessageRead,
    UserTyping: handleUserTyping,
  }), [handleReceiveMessage, handleMessageRead, handleUserTyping]);

  useSignalR('chat', signalRHandlers);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Cleanup typing timers on unmount
  useEffect(() => {
    return () => {
      typingTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const value = useMemo<ChatContextValue>(() => ({
    ...state,
    fetchConversations,
    markAsRead,
    setActiveConversation,
    typingUsers: typingUsersRef.current,
  }), [state, fetchConversations, markAsRead, setActiveConversation]);

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
