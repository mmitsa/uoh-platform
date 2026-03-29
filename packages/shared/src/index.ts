export type Locale = 'ar' | 'en';

export type CommitteeType =
  | 'permanent'
  | 'temporary'
  | 'main'
  | 'sub'
  | 'council'
  | 'self_managed'
  | 'cross_functional';

export type CommitteeStatus = 'draft' | 'pending_approval' | 'active' | 'suspended' | 'closed';

export type MeetingType = 'in_person' | 'online' | 'hybrid';
export type OnlinePlatform = 'teams' | 'zoom';
export type MeetingStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type MomStatus = 'draft' | 'pending_approval' | 'approved';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

