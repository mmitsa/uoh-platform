import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../app/auth';
import { isDemoMode, useApi } from '../../hooks/useApi';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileSidebar } from './MobileSidebar';
import { ChatPanelProvider, useChatPanel } from '../chat/ChatPanelContext';
import { ChatPanel } from '../chat/ChatPanel';
import { ChatFloatingBubble } from '../chat/ChatFloatingBubble';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';
import { PWAInstallPrompt } from '../PWAInstallPrompt';
import { AnnouncementPopup, type PopupAnnouncement } from '../announcements/AnnouncementPopup';
import { AcknowledgmentWall } from '../AcknowledgmentWall';

interface AppLayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const isDemo = isAuthenticated && isDemoMode();
  const { isOpen: chatOpen } = useChatPanel();

  const { get, post } = useApi();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  /* ---- Announcement popup queue ---- */
  const [popupQueue, setPopupQueue] = useState<PopupAnnouncement[]>([]);
  const [currentPopupIdx, setCurrentPopupIdx] = useState(0);
  const [popupsLoaded, setPopupsLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || popupsLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await get<PopupAnnouncement[]>('/api/v1/announcements/popup-queue');
        if (cancelled) return;
        // Filter out already-acknowledged items via localStorage
        const unacked = data.filter(
          (a) => !localStorage.getItem(`uoh_ann_ack_${a.id}`),
        );
        setPopupQueue(unacked);
        setCurrentPopupIdx(0);
      } catch {
        /* silently ignore */
      } finally {
        if (!cancelled) setPopupsLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, popupsLoaded, get]);

  const handleAcknowledge = useCallback(async (id: string) => {
    localStorage.setItem(`uoh_ann_ack_${id}`, new Date().toISOString());
    try {
      await post(`/api/v1/announcements/${id}/acknowledge`, {});
    } catch { /* ignore */ }
    setCurrentPopupIdx((prev) => prev + 1);
  }, [post]);

  const handleDismiss = useCallback((id: string) => {
    // Mark as seen in localStorage so it won't show again this session
    localStorage.setItem(`uoh_ann_ack_${id}`, new Date().toISOString());
    setCurrentPopupIdx((prev) => prev + 1);
  }, []);

  const currentPopup = popupQueue[currentPopupIdx] ?? null;

  // Public routes, login, and live survey render without the sidebar
  const isLiveSurvey = /^\/surveys\/[^/]+\/live\//.test(location.pathname);
  if (location.pathname.startsWith('/public/') || location.pathname === '/login' || !isAuthenticated || isLiveSurvey) {
    return <>{children}</>;
  }

  return (
    <AcknowledgmentWall>
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-sidebar shrink-0 lg:block border-e border-neutral-200 shadow-sm">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onClose={closeMobile} />

      {/* Chat panel */}
      <ChatPanel />
      <ChatFloatingBubble />

      {/* Main column — push right when chat panel is open on desktop */}
      <div
        className={[
          'flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out',
          chatOpen ? 'lg:me-[var(--uoh-chat-panel-width)]' : '',
        ].join(' ')}
      >
        {/* Demo banner */}
        {isDemo && (
          <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t('admin.demoNotice')}
          </div>
        )}

        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <PWAUpdatePrompt />
      <PWAInstallPrompt />

      {/* Announcement popup queue */}
      {currentPopup && (
        <AnnouncementPopup
          announcement={currentPopup}
          onAcknowledge={handleAcknowledge}
          onDismiss={handleDismiss}
          queuePosition={popupQueue.length > 1 ? `${currentPopupIdx + 1} / ${popupQueue.length}` : undefined}
        />
      )}
    </div>
    </AcknowledgmentWall>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ChatPanelProvider>
      <LayoutInner>{children}</LayoutInner>
    </ChatPanelProvider>
  );
}
