import { Badge } from '../ui';
import { getInitials, formatConvTime, getConvName } from './helpers';
import type { Conversation } from './types';

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  isAr: boolean;
  lang: string;
  currentUserId?: string;
  yesterdayLabel: string;
  onClick: () => void;
}

export function ConversationItem({
  conv,
  isActive,
  isAr,
  lang,
  currentUserId,
  yesterdayLabel,
  onClick,
}: ConversationItemProps) {
  const name = getConvName(conv, isAr, currentUserId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors',
        isActive ? 'bg-brand-50' : 'hover:bg-neutral-50',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          isActive ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-neutral-600',
        ].join(' ')}
      >
        {getInitials(name)}
      </div>

      {/* Name + last message */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={[
              'truncate text-sm',
              conv.unreadCount > 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-800',
            ].join(' ')}
          >
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-neutral-400">
            {formatConvTime(conv.lastMessageAtUtc, lang, yesterdayLabel)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-neutral-500">
            {conv.lastMessage
              ? conv.lastMessage.type === 'text'
                ? conv.lastMessage.content
                : `[${conv.lastMessage.type}]`
              : '\u00A0'}
          </p>
          {conv.unreadCount > 0 && (
            <Badge variant="brand" className="shrink-0 tabular-nums">
              {conv.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
