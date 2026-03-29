import { useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { useChatPanel } from './ChatPanelContext';
import { IconChat } from '../icons';

export function ChatFloatingBubble() {
  const { isOpen, togglePanel, totalUnread, setTotalUnread } = useChatPanel();
  const { get } = useApi();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await get<{ count: number }>('/api/v1/chat/unread-count');
        setTotalUnread(res.count);
      } catch {
        // silent
      }
    };

    void fetchUnread();
    timerRef.current = setInterval(() => void fetchUnread(), 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [get, setTotalUnread]);

  return (
    <button
      type="button"
      onClick={togglePanel}
      className={[
        'fixed bottom-6 end-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition-all hover:bg-brand-800 hover:shadow-xl',
        // Hide on desktop when panel is open (it's already visible)
        isOpen ? 'lg:hidden' : '',
      ].join(' ')}
      aria-label="Chat"
    >
      <IconChat className="h-6 w-6" />
      {totalUnread > 0 && (
        <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </button>
  );
}
