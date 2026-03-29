import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useChatPanel } from './ChatPanelContext';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { NewChatModal } from './NewChatModal';
import { IconX, IconChat } from '../icons';
import type { Conversation } from './types';

export function ChatPanel() {
  const { t } = useTranslation();
  const { isOpen, closePanel, activeConversationId, selectConversation } = useChatPanel();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  // Sync activeConversationId from context → local state
  useEffect(() => {
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) setActiveConv(found);
    }
  }, [activeConversationId, conversations]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    selectConversation(conv.id);
  }, [selectConversation]);

  const handleBack = useCallback(() => {
    setActiveConv(null);
    selectConversation(null);
  }, [selectConversation]);

  const handleNewChatCreated = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    handleSelectConversation(conv);
  }, [handleSelectConversation]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, closePanel]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-30 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          onClick={closePanel}
          aria-hidden
        />,
        document.body,
      )}

      {/* Panel */}
      <div
        className={[
          'fixed inset-y-0 end-0 z-30 flex flex-col border-s border-neutral-200 bg-neutral-0 shadow-lg transition-transform duration-300 ease-in-out',
          // Width: full on mobile, 400px on desktop
          'w-full sm:w-[360px] lg:w-chat-panel',
          // Transform: visible when open, hidden slides off-screen to the end side
          isOpen
            ? 'translate-x-0'
            : 'ltr:translate-x-full rtl:-translate-x-full',
        ].join(' ')}
      >
        {/* Panel header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <div className="flex items-center gap-2">
            <IconChat className="h-5 w-5 text-brand-600" />
            <h2 className="text-sm font-bold text-neutral-900">{t('chat.title')}</h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            title={t('chat.closeChat')}
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeConv ? (
            <MessageThread
              conversation={activeConv}
              onBack={handleBack}
              conversations={conversations}
              setConversations={setConversations}
            />
          ) : (
            <ConversationList
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
              onNewChat={() => setShowNewChat(true)}
              conversations={conversations}
              setConversations={setConversations}
            />
          )}
        </div>
      </div>

      {/* New chat modal */}
      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={handleNewChatCreated}
      />
    </>
  );
}
