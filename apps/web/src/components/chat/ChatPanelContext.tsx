import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface ChatPanelState {
  isOpen: boolean;
  activeConversationId: string | null;
  totalUnread: number;
}

interface ChatPanelActions {
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  selectConversation: (id: string | null) => void;
  setTotalUnread: (n: number) => void;
}

type ChatPanelContextValue = ChatPanelState & ChatPanelActions;

const ChatPanelCtx = createContext<ChatPanelContextValue | null>(null);

const STORAGE_KEY = 'uoh_chat_panel_open';

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, isOpen ? '1' : '0');
    } catch { /* ignore */ }
  }, [isOpen]);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const selectConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
    if (id) setIsOpen(true);
  }, []);

  return (
    <ChatPanelCtx.Provider
      value={{
        isOpen,
        activeConversationId,
        totalUnread,
        openPanel,
        closePanel,
        togglePanel,
        selectConversation,
        setTotalUnread,
      }}
    >
      {children}
    </ChatPanelCtx.Provider>
  );
}

export function useChatPanel(): ChatPanelContextValue {
  const ctx = useContext(ChatPanelCtx);
  if (!ctx) throw new Error('useChatPanel must be used inside ChatPanelProvider');
  return ctx;
}
