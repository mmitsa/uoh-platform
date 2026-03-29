/* Shared API types for the UOH Meeting Platform mobile app */

/* ---- Pagination ---- */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/* ---- Auth ---- */
export type AppRole = 'SystemAdmin' | 'CommitteeHead' | 'CommitteeSecretary' | 'CommitteeMember' | 'Observer';

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  roles: AppRole[];
}

export interface LoginResponse {
  user: AppUser;
  token: string;
}

/* ---- Committees ---- */
export type CommitteeType = 'council' | 'permanent' | 'temporary' | 'main' | 'sub' | 'self_managed' | 'cross_functional';
export type CommitteeStatus = 'draft' | 'pending_approval' | 'active' | 'suspended' | 'closed';

export interface CommitteeItem {
  id: string;
  type: CommitteeType | string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: CommitteeStatus | string;
  parentCommitteeId?: string;
  startDate?: string;
  endDate?: string;
  maxMembers?: number;
  memberCount?: number;
  subCommitteeCount?: number;
  createdAtUtc: string;
}

/* ---- Meetings ---- */
export type MeetingType = 'in_person' | 'online' | 'hybrid';
export type MeetingStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MeetingRoom {
  id: string;
  nameAr: string;
  nameEn: string;
  building?: string;
  floor?: string;
  capacity: number;
  hasVideoConference: boolean;
  hasProjector: boolean;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
}

export interface MeetingItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type: MeetingType | string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: MeetingStatus | string;
  committeeId?: string;
  locationAr?: string;
  locationEn?: string;
  onlineLink?: string;
  meetingRoomId?: string;
  meetingRoom?: MeetingRoom;
}

/* ---- Tasks ---- */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface SubTaskItem {
  id?: string;
  title: string;
  status: TaskStatus | string;
  dueDateUtc?: string;
  progress: number;
}

export interface TaskItem {
  id: string;
  titleAr: string;
  titleEn: string;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  dueDateUtc: string;
  priority: TaskPriority | string;
  status: TaskStatus | string;
  progressPercent?: number;
  progress?: number;
  meetingId?: string;
  committeeId?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  subTasks?: SubTaskItem[];
}

/* ---- Vote Sessions ---- */
export type VoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';

export interface VoteOption {
  id: string;
  labelAr: string;
  labelEn: string;
  votesCount: number;
}

export interface VoteSession {
  id: string;
  meetingId: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: VoteStatus | string;
  options?: VoteOption[];
  totalVotes?: number;
  createdAtUtc?: string;
}

/* ---- Surveys ---- */
export type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface SurveyItem {
  id: string;
  titleAr: string;
  titleEn: string;
  targetAudience: string;
  status: SurveyStatus | string;
  startAtUtc: string;
  endAtUtc: string;
  totalResponses?: number;
  questionsCount?: number;
}

/* ---- MoM ---- */
export type MomStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  userId: string;
  userDisplayName: string;
  status: string;
}

export interface Decision {
  id: string;
  meetingId: string;
  textAr: string;
  textEn: string;
  status: string;
}

export interface Mom {
  id: string;
  meetingId: string;
  meetingTitleAr?: string;
  meetingTitleEn?: string;
  status: MomStatus | string;
  preparedByDisplayName?: string;
  approvedByDisplayName?: string;
  summaryAr?: string;
  summaryEn?: string;
  attendance?: AttendanceRecord[];
  decisions?: Decision[];
  createdAtUtc: string;
}

/* ---- Notifications ---- */
export interface NotificationItem {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr?: string;
  bodyEn?: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAtUtc: string;
}

/* ---- Workflow Templates ---- */
export interface WorkflowTemplate {
  id: string;
  name: string;
  domain: string;
  definitionJson: string;
}

/* ---- Attachments ---- */
export interface Attachment {
  id: string;
  domain: string;
  entityId: string;
  title: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAtUtc?: string;
}

/* ---- Dashboard Stats ---- */
export interface DashboardStats {
  totalCommittees: number;
  activeCommittees: number;
  totalMeetings: number;
  meetingsThisMonth: number;
  pendingTasks: number;
  overdueTasks: number;
  activeSurveys: number;
  meetingAttendanceRate: number;
  taskCompletionRate: number;
  upcomingMeetings: { id: string; titleAr: string; titleEn: string; startDateTimeUtc: string; status: string }[];
  recentActivity: { occurredAtUtc: string; userDisplayName: string; httpMethod: string; path: string; statusCode: number }[];
  meetingsByMonth: { label?: string; count: number }[];
  taskStatusBreakdown: { label?: string; count: number }[];
  committeeTypeBreakdown: { label?: string; count: number }[];
  liveMeetingsNow: number;
  upcomingMeetingsCount: number;
}

/* ---- Calendar Event ---- */
export interface CalendarEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: string;
  type: string;
  eventKind: 'meeting' | 'committee';
  committeeId: string | null;
  committeeNameAr: string | null;
  committeeNameEn: string | null;
  location: string | null;
}

/* ---- Reports ---- */
export interface CommitteeActivityReport {
  rows: { committeeId: string; nameAr: string; nameEn: string; meetingsCount: number; decisionsCount: number; tasksCompletedCount: number }[];
  totalMeetings: number;
  totalDecisions: number;
  totalTasksCompleted: number;
}

export interface MeetingAttendanceReport {
  rows: { meetingId: string; titleAr: string; titleEn: string; startDateTimeUtc: string; totalInvited: number; totalPresent: number; attendanceRate: number }[];
  overallAttendanceRate: number;
}

export interface TaskPerformanceReport {
  rows: { assignedToDisplayName: string; totalTasks: number; completed: number; overdue: number; completionRate: number }[];
  overallCompletionRate: number;
  totalOverdue: number;
}
