import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type AppRole } from '../../app/auth';
import { usePermissions } from '../../app/permissions';
import { useChatPanel } from '../chat/ChatPanelContext';
import {
  IconDashboard,
  IconCommittees,
  IconMeetings,
  IconMom,
  IconTasks,
  IconVoting,
  IconWorkflow,
  IconSurveys,
  IconAttachments,
  IconReport,
  IconAdmin,
  IconChat,
  IconCalendar,
  IconArchive,
  IconUser,
  IconDirective,
  IconEvaluation,
  IconChevronDown,
  IconShield,
  IconFile,
  IconSync,
  IconMapPin,
  IconBuilding,
  IconTrophy,
  IconAnnouncement,
  IconAcknowledgment,
} from '../icons';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  requiredRole?: AppRole | AppRole[];
  requiredPermission?: string;
  isChatAction?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

interface SidebarProps {
  onMobileClose?: () => void;
}

const SESSION_KEY = 'uoh_sidebar_groups';

export function Sidebar({ onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const { user, hasRole, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { togglePanel, totalUnread } = useChatPanel();
  const location = useLocation();

  // ── Top-level items (always visible) ──
  const topItems: NavItem[] = [
    { to: '/', icon: <IconDashboard />, label: t('nav.dashboard') },
    { to: '/committees', icon: <IconCommittees />, label: t('nav.committees') },
    { to: '/meetings', icon: <IconMeetings />, label: t('nav.meetings') },
    { to: '/calendar', icon: <IconCalendar />, label: t('nav.calendar') },
    { to: '/locations', icon: <IconMapPin />, label: t('nav.locations') },
    { to: '/room-booking', icon: <IconBuilding />, label: t('nav.roomBooking') },
    { to: '/tasks', icon: <IconTasks />, label: t('nav.tasks') },
    { to: '#chat', icon: <IconChat />, label: t('nav.chat'), isChatAction: true },
  ];

  // ── Collapsible groups ──
  const groups: NavGroup[] = [
    {
      key: 'governance',
      label: t('nav.governance'),
      icon: <IconShield />,
      items: [
        { to: '/moms', icon: <IconMom />, label: t('nav.moms') },
        { to: '/votes', icon: <IconVoting />, label: t('nav.votes') },
        { to: '/directives', icon: <IconDirective />, label: t('nav.directives') },
        { to: '/evaluations', icon: <IconEvaluation />, label: t('nav.evaluations') },
        { to: '/competitions', icon: <IconTrophy />, label: t('nav.competitions') },
        { to: '/acknowledgments', icon: <IconAcknowledgment />, label: t('nav.acknowledgments') },
      ],
    },
    {
      key: 'documents',
      label: t('nav.documents'),
      icon: <IconFile />,
      items: [
        { to: '/surveys', icon: <IconSurveys />, label: t('nav.surveys') },
        { to: '/attachments', icon: <IconAttachments />, label: t('nav.attachments') },
        { to: '/reports', icon: <IconReport />, label: t('nav.reports') },
        { to: '/my-archive', icon: <IconArchive />, label: t('nav.myArchive') },
      ],
    },
    {
      key: 'administration',
      label: t('nav.administration'),
      icon: <IconAdmin />,
      items: [
        { to: '/workflow', icon: <IconWorkflow />, label: t('nav.workflow'), requiredPermission: 'workflow.view', requiredRole: 'SystemAdmin' },
        { to: '/admin', icon: <IconAdmin />, label: t('nav.admin'), requiredPermission: 'admin.view', requiredRole: 'SystemAdmin' },
        { to: '/admin/users', icon: <IconUser />, label: t('nav.users', 'Users'), requiredPermission: 'admin.users.view' },
        { to: '/admin/roles', icon: <IconAdmin />, label: t('nav.roles', 'Roles'), requiredPermission: 'admin.roles.view' },
        { to: '/admin/announcements', icon: <IconAnnouncement />, label: t('nav.announcements'), requiredPermission: 'admin.announcements.view' },
        { to: '/admin/acknowledgments', icon: <IconAcknowledgment />, label: t('nav.acknowledgments'), requiredRole: 'SystemAdmin' },
        { to: '/admin/ad-sync', icon: <IconSync />, label: t('nav.adSync', 'AD Sync'), requiredPermission: 'admin.adsync.configure' },
      ],
    },
  ];

  // ── Visibility filter ──
  const isItemVisible = useCallback((item: NavItem) => {
    if (item.requiredPermission) return hasPermission(item.requiredPermission);
    if (item.requiredRole) {
      const roles = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
      return hasRole(...roles);
    }
    return true;
  }, [hasPermission, hasRole]);

  // Filter groups: only show groups that have at least one visible item
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter(isItemVisible) }))
    .filter((g) => g.items.length > 0);

  // ── Open/close state ──
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...openGroups]));
  }, [openGroups]);

  // Auto-open group when navigating to one of its children
  useEffect(() => {
    for (const group of visibleGroups) {
      const match = group.items.some((item) =>
        item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
      );
      if (match) {
        setOpenGroups((prev) => {
          if (prev.has(group.key)) return prev;
          const next = new Set(prev);
          next.add(group.key);
          return next;
        });
      }
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const roleLabel = user?.roles[0] ?? '';

  // Check if a nav item path is active
  const isPathActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="flex h-full flex-col bg-neutral-0">
      {/* ── Logo Header ── */}
      <div className="shrink-0 border-b border-neutral-200 bg-neutral-0 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-bold text-neutral-900 truncate">{t('appName')}</div>
            <div className="text-[10px] text-neutral-500">{t('university')}</div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {/* Top-level items */}
        <ul className="flex flex-col gap-0.5">
          {topItems.map((item) => (
            <li key={item.to}>
              {item.isChatAction ? (
                <button
                  type="button"
                  onClick={() => {
                    togglePanel();
                    onMobileClose?.();
                  }}
                  className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <span className="shrink-0 transition-transform duration-150 group-hover:scale-110">{item.icon}</span>
                  <span className="flex-1 text-start">{item.label}</span>
                  {totalUnread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm animate-in fade-in zoom-in-50">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    [
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-brand-600" />
                      )}
                      <span className={`shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-110'}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {/* ── Divider ── */}
        {visibleGroups.length > 0 && (
          <div className="mx-2 my-3 border-t border-neutral-200" />
        )}

        {/* ── Collapsible groups ── */}
        {visibleGroups.length > 0 && (
          <div className="flex flex-col gap-2">
            {visibleGroups.map((group) => {
              const isOpen = openGroups.has(group.key);
              const hasActiveChild = group.items.some((item) => isPathActive(item.to));

              return (
                <div key={group.key}>
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className={[
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150',
                      hasActiveChild && !isOpen
                        ? 'text-brand-700'
                        : 'text-neutral-400 hover:text-neutral-600',
                    ].join(' ')}
                  >
                    <span className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{group.icon}</span>
                    <span className="flex-1 text-start">{group.label}</span>
                    {/* Active dot indicator when collapsed with active child */}
                    {hasActiveChild && !isOpen && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    )}
                    <span
                      className={[
                        'shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-0' : 'ltr:-rotate-90 rtl:rotate-90',
                      ].join(' ')}
                    >
                      <IconChevronDown className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Group children */}
                  <div
                    className={[
                      'overflow-hidden transition-all duration-200 ease-in-out',
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                    ].join(' ')}
                  >
                    <ul className="ms-4 mt-0.5 flex flex-col gap-0.5 border-s-2 border-neutral-200 ps-2">
                      {group.items.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onMobileClose}
                            className={({ isActive }) =>
                              [
                                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                                isActive
                                  ? 'bg-brand-50 text-brand-800'
                                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
                              ].join(' ')
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <span className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-brand-600" />
                                )}
                                <span className={`shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-110'}`}>{item.icon}</span>
                                <span>{item.label}</span>
                              </>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── User section ── */}
      {user && (
        <div className="border-t border-neutral-200 p-3">
          <NavLink
            to="/profile"
            onClick={onMobileClose}
            className={({ isActive }) => [
              'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'bg-brand-50'
                : 'hover:bg-neutral-50',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold shadow-sm">
              {user.displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-neutral-900">{user.displayName}</div>
              <div className="truncate text-[11px] text-neutral-500">{t(`roles.${roleLabel}` as any) || roleLabel}</div>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => { logout(); onMobileClose?.(); }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {t('actions.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
