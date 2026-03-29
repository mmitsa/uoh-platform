import { lazy, type ComponentType } from 'react';
import type { WidgetProps } from './types';

type WidgetComponent = ComponentType<WidgetProps>;

const registry: Record<string, () => Promise<{ default: WidgetComponent }>> = {
  'stat-committees':       () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatCommitteesWidget })),
  'stat-meetings':         () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatMeetingsWidget })),
  'stat-tasks':            () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatTasksWidget })),
  'stat-surveys':          () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatSurveysWidget })),
  'stat-live-meetings':    () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatLiveMeetingsWidget })),
  'stat-upcoming-count':   () => import('../../components/dashboard/widgets/StatWidget').then(m => ({ default: m.StatUpcomingCountWidget })),
  'chart-meetings-monthly': () => import('../../components/dashboard/widgets/MeetingsChartWidget'),
  'chart-task-status':     () => import('../../components/dashboard/widgets/TaskStatusWidget'),
  'chart-committee-types': () => import('../../components/dashboard/widgets/CommitteeTypesWidget'),
  'upcoming-meetings':     () => import('../../components/dashboard/widgets/UpcomingMeetingsWidget'),
  'recent-activity':       () => import('../../components/dashboard/widgets/RecentActivityWidget'),
  'attendance-rate':       () => import('../../components/dashboard/widgets/AttendanceRateWidget'),
  'completion-rate':       () => import('../../components/dashboard/widgets/CompletionRateWidget'),
  'task-overview':         () => import('../../components/dashboard/widgets/TaskOverviewWidget'),
  'university-rankings':   () => import('../../components/dashboard/widgets/UniversityRankingsWidget'),
  'external-kpi':          () => import('../../components/dashboard/widgets/ExternalKpiWidget'),
  'custom-note':           () => import('../../components/dashboard/widgets/CustomNoteWidget'),
  'custom-kpi':            () => import('../../components/dashboard/widgets/CustomKpiWidget'),
  'quick-links':           () => import('../../components/dashboard/widgets/QuickLinksWidget'),
  'chart-task-priority':   () => import('../../components/dashboard/widgets/TaskPriorityWidget'),
  'assignee-workload':     () => import('../../components/dashboard/widgets/AssigneeWorkloadWidget'),
  'announcements-board':   () => import('../../components/dashboard/widgets/AnnouncementsBoardWidget'),
};

const componentCache = new Map<string, React.LazyExoticComponent<WidgetComponent>>();

export function getWidgetComponent(key: string): React.LazyExoticComponent<WidgetComponent> | null {
  if (componentCache.has(key)) return componentCache.get(key)!;
  const loader = registry[key];
  if (!loader) return null;
  const component = lazy(loader);
  componentCache.set(key, component);
  return component;
}

export function isWidgetRegistered(key: string): boolean {
  return key in registry;
}
