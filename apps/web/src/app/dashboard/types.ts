export interface WidgetDef {
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  category: WidgetCategory;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  iconName?: string;
  configSchema?: string;
}

export type WidgetCategory = 'Statistics' | 'Chart' | 'Committee' | 'External' | 'Rankings' | 'Custom';

export interface WidgetPlacement {
  id: string; // unique instance id
  widgetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export interface DashboardStats {
  totalCommittees: number;
  activeCommittees: number;
  totalMeetings: number;
  meetingsThisMonth: number;
  meetingsLastMonth: number;
  pendingTasks: number;
  overdueTasks: number;
  activeSurveys: number;
  meetingAttendanceRate: number;
  taskCompletionRate: number;
  upcomingMeetings: UpcomingMeeting[];
  recentActivity: RecentActivity[];
  meetingsByMonth: MonthlyMeeting[];
  taskStatusBreakdown: StatusBreakdown[];
  committeeTypeBreakdown: StatusBreakdown[];
  taskPriorityBreakdown: StatusBreakdown[];
  assigneeWorkload: AssigneeWorkload[];
  liveMeetingsNow: number;
  upcomingMeetingsCount: number;
}

export interface AssigneeWorkload {
  displayName: string;
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export interface UpcomingMeeting {
  id: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  status: string;
}

export interface RecentActivity {
  occurredAtUtc: string;
  userDisplayName: string | null;
  httpMethod: string;
  path: string;
  statusCode: number;
}

export interface MonthlyMeeting { month: string; count: number }
export interface StatusBreakdown { label: string; count: number }

export interface WidgetProps {
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
  dashboardStats?: DashboardStats;
}

export interface UniversityRanking {
  source: string;
  rank: number;
  previousRank: number;
  year: number;
  change: number;
}
