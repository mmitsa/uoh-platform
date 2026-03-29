import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../app/auth';
import { useChatHub } from '../../hooks/useChatHub';
import { Button, EmptyState, useToast } from '../ui';
import { IconChat, IconArrowLeft } from '../icons';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { getInitials, getConvName, formatDateSeparator, shouldShowDateSeparator } from './helpers';
import type { Conversation, Message, PaginatedResponse } from './types';

interface MessageThreadProps {
  conversation: Conversation;
  onBack: () => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function MessageThread({ conversation, onBack, conversations: _conversations, setConversations }: MessageThreadProps) {
  const { get, post } = useApi();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const isAr = i18n.language === 'ar';

  const { sendMessage: hubSendMessage, markAsRead: hubMarkAsRead, startTyping: hubStartTyping, onMessage, onTyping, onRead } = useChatHub();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, { displayName: string; timeout: ReturnType<typeof setTimeout> }>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const convName = getConvName(conversation, isAr, user?.id);

  /* Load messages */
  const loadMessages = useCallback(async (convId: string, pg: number, append = false) => {
    setLoading(true);
    try {
      const res = await get<PaginatedResponse<Message>>(
        `/api/v1/chat/conversations/${convId}/messages?page=${pg}&pageSize=30`,
      );
      setTotal(res.total);
      setPage(pg);
      if (append) {
        setMessages((prev) => [...res.items.reverse(), ...prev]);
      } else {
        setMessages(res.items.reverse());
      }
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [get, t, toast]);

  /* Initial load + mark as read */
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setTotal(0);
    setTypingUsers(new Map());
    void loadMessages(conversation.id, 1);

    // Mark as read
    void post(`/api/v1/chat/conversations/${conversation.id}/read`, {}).catch(() => {});
    void hubMarkAsRead(conversation.id).catch(() => {});
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  /* Auto-scroll */
  useEffect(() => {
    if (messagesEndRef.current && !loading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  /* Load more */
  const hasMore = messages.length < total;
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const container = containerRef.current;
    const prevH = container?.scrollHeight ?? 0;
    await loadMessages(conversation.id, page + 1, true);
    requestAnimationFrame(() => {
      if (container) container.scrollTop = container.scrollHeight - prevH;
    });
  }, [loading, hasMore, loadMessages, conversation.id, page]);

  /* Send message */
  const handleSend = useCallback(async (content: string, type: string, attachmentFileIds?: string[]) => {
    const newMsg = await post<Message>(`/api/v1/chat/conversations/${conversation.id}/messages`, {
      content,
      type,
      attachmentFileIds: attachmentFileIds ?? null,
    });
    setMessages((prev) => [...prev, newMsg]);
    await hubSendMessage(conversation.id, content, type, attachmentFileIds);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id
          ? {
              ...c,
              lastMessage: { content, senderDisplayName: user?.displayName ?? '', type, createdAtUtc: new Date().toISOString() },
              lastMessageAtUtc: new Date().toISOString(),
            }
          : c,
      ),
    );
  }, [conversation.id, post, hubSendMessage, user, setConversations]);

  /* Typing handler */
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      void hubStartTyping(conversation.id);
    }, 300);
  }, [conversation.id, hubStartTyping]);

  /* Real-time: incoming message */
  useEffect(() => {
    onMessage((msg) => {
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        void post(`/api/v1/chat/conversations/${msg.conversationId}/read`, {}).catch(() => {});
        void hubMarkAsRead(msg.conversationId).catch(() => {});
      }

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              lastMessage: { content: msg.content, senderDisplayName: msg.senderDisplayName, type: msg.type, createdAtUtc: msg.createdAtUtc },
              lastMessageAtUtc: msg.createdAtUtc,
              unreadCount: msg.conversationId === conversation.id ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.lastMessageAtUtc).getTime() - new Date(a.lastMessageAtUtc).getTime());
      });
    });
  }, [onMessage, conversation.id, post, hubMarkAsRead, setConversations]);

  /* Real-time: typing */
  useEffect(() => {
    onTyping((evt) => {
      if (evt.conversationId !== conversation.id || evt.userOid === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existing = next.get(evt.userOid);
        if (existing) clearTimeout(existing.timeout);
        const timeout = setTimeout(() => {
          setTypingUsers((p) => { const n = new Map(p); n.delete(evt.userOid); return n; });
        }, 3000);
        next.set(evt.userOid, { displayName: evt.displayName, timeout });
        return next;
      });
    });
  }, [onTyping, conversation.id, user]);

  /* Real-time: read */
  useEffect(() => { onRead(() => {}); }, [onRead]);

  /* Typing text */
  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values()).map((u) => u.displayName);
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} ${t('chat.typing')}`;
    return `${names.join(', ')} ${t('chat.typing')}`;
  }, [typingUsers, t]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-0 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {getInitials(convName)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-neutral-900">{convName}</h2>
          <p className="text-[11px] text-neutral-500">
            {t('chat.participants')}: {conversation.participants.length}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-3">
        {hasMore && (
          <div className="mb-3 flex justify-center">
            <Button variant="ghost" size="sm" loading={loading} onClick={() => void loadMore()}>
              {t('actions.loadMore', 'Load more')}
            </Button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="space-y-4 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`h-10 animate-pulse rounded-2xl bg-neutral-200 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<IconChat className="h-8 w-8" />}
              title={t('chat.noMessages')}
              description={t('chat.noMessagesDesc')}
            />
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, idx) => {
              const showDate = shouldShowDateSeparator(messages, idx);
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-neutral-200" />
                      <span className="shrink-0 text-xs font-medium text-neutral-400">
                        {formatDateSeparator(msg.createdAtUtc, i18n.language, t('chat.today'), t('chat.yesterday'))}
                      </span>
                      <div className="h-px flex-1 bg-neutral-200" />
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isOwn={msg.senderObjectId === user?.id}
                    isGroup={conversation.type === 'group'}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing */}
      {typingText && (
        <div className="px-3 pb-1">
          <p className="text-xs italic text-neutral-500">{typingText}</p>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
      />
    </div>
  );
}
