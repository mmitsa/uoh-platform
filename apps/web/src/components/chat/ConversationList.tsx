import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../app/auth';
import { Button, EmptyState, useToast } from '../ui';
import { IconChat, IconPlus, IconSearch } from '../icons';
import { ConversationItem } from './ConversationItem';
import type { Conversation, PaginatedResponse } from './types';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function ConversationList({
  activeConversationId,
  onSelect,
  onNewChat,
  conversations,
  setConversations,
}: ConversationListProps) {
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const isAr = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<PaginatedResponse<Conversation>>('/api/v1/chat/conversations?page=1&pageSize=50');
      setConversations(res.items);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [get, t, toast, setConversations]);

  useEffect(() => {
    void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const name = isAr ? c.nameAr : c.nameEn;
      const altName = isAr ? c.nameEn : c.nameAr;
      return (
        name?.toLowerCase().includes(q) ||
        altName?.toLowerCase().includes(q) ||
        c.participants.some((p) => p.displayName.toLowerCase().includes(q)) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, isAr]);

  return (
    <div className="flex h-full flex-col">
      {/* Search + New */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3">
        <div className="relative flex-1">
          <IconSearch className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('chat.searchPlaceholder')}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pe-3 ps-8 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<IconPlus className="h-4 w-4" />}
          onClick={onNewChat}
        >
          <span className="sr-only lg:not-sr-only">{t('chat.newChat')}</span>
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<IconChat className="h-8 w-8" />}
            title={t('chat.noConversations')}
            description={t('chat.noConversationsDesc')}
            actionLabel={t('chat.newChat')}
            onAction={onNewChat}
          />
        ) : (
          <div className="space-y-0.5 p-1.5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                isAr={isAr}
                lang={i18n.language}
                currentUserId={user?.id}
                yesterdayLabel={t('chat.yesterday')}
                onClick={() => onSelect(conv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
