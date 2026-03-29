import type {
  CommitteeItem, MeetingItem, TaskItem, VoteSession, SurveyItem, Mom,
  NotificationItem, WorkflowTemplate, DashboardStats, PagedResponse,
  CommitteeMember, ChatConversation, ChatMessage, Directive, DirectiveDecision,
  Evaluation, EvaluationTemplate, AcknowledgmentTemplate, UserAcknowledgment,
  Location, MeetingRoom, RoomAvailability, ApprovalItem, ChangeRequest,
  AdminUser, Role, Announcement, ShareLink,
} from './types';

const committees: CommitteeItem[] = [
  { id: 'c1', type: 'permanent', nameAr: 'لجنة الشؤون الأكاديمية', nameEn: 'Academic Affairs Committee', status: 'active', memberCount: 3, createdAtUtc: '2025-01-15T10:00:00Z' },
  { id: 'c2', type: 'temporary', nameAr: 'لجنة التخطيط الاستراتيجي', nameEn: 'Strategic Planning Committee', status: 'active', startDate: '2025-02-20', endDate: '2025-12-31', memberCount: 4, createdAtUtc: '2025-02-20T08:00:00Z' },
  { id: 'c3', type: 'council', nameAr: 'مجلس الجامعة', nameEn: 'University Council', status: 'active', memberCount: 8, subCommitteeCount: 1, createdAtUtc: '2024-09-01T07:00:00Z' },
  { id: 'c4', type: 'sub', nameAr: 'لجنة الجودة', nameEn: 'Quality Committee', status: 'draft', parentCommitteeId: 'c3', createdAtUtc: '2025-03-01T09:00:00Z' },
  { id: 'c5', type: 'main', nameAr: 'لجنة تقنية المعلومات', nameEn: 'IT Committee', status: 'active', memberCount: 5, subCommitteeCount: 1, createdAtUtc: '2025-04-01T08:00:00Z' },
  { id: 'c6', type: 'self_managed', nameAr: 'فريق التحول الرقمي', nameEn: 'Digital Transformation Team', descriptionAr: 'فريق ذاتي الإدارة للتحول الرقمي', descriptionEn: 'Self-managed digital transformation team', status: 'active', memberCount: 6, maxMembers: 8, createdAtUtc: '2025-05-15T10:00:00Z' },
  { id: 'c7', type: 'cross_functional', nameAr: 'فريق تطوير الخدمات', nameEn: 'Service Development Team', descriptionAr: 'فريق متعدد الوظائف', descriptionEn: 'Cross-functional service development team', status: 'active', memberCount: 7, maxMembers: 10, createdAtUtc: '2025-06-01T09:00:00Z' },
];

const meetings: MeetingItem[] = [
  { id: 'm1', titleAr: 'اجتماع دوري - الشؤون الأكاديمية', titleEn: 'Regular Meeting - Academic Affairs', type: 'in_person', startDateTimeUtc: '2025-12-20T09:00:00Z', endDateTimeUtc: '2025-12-20T11:00:00Z', status: 'scheduled', committeeId: 'c1', locationAr: 'قاعة الاجتماعات الرئيسية', locationEn: 'Main Meeting Hall' },
  { id: 'm2', titleAr: 'ورشة التخطيط', titleEn: 'Planning Workshop', type: 'hybrid', startDateTimeUtc: '2025-12-22T13:00:00Z', endDateTimeUtc: '2025-12-22T16:00:00Z', status: 'draft', committeeId: 'c2', onlineLink: 'https://meet.example.com/abc' },
  { id: 'm3', titleAr: 'جلسة مجلس الجامعة', titleEn: 'University Council Session', type: 'in_person', startDateTimeUtc: '2025-12-18T10:00:00Z', endDateTimeUtc: '2025-12-18T12:00:00Z', status: 'completed', committeeId: 'c3' },
];

const tasks: TaskItem[] = [
  { id: 't1', titleAr: 'إعداد تقرير الأداء', titleEn: 'Prepare Performance Report', dueDateUtc: '2025-12-25T23:59:00Z', priority: 'high', status: 'in_progress', progressPercent: 60, assignedToDisplayName: 'Ahmad Ali' },
  { id: 't2', titleAr: 'مراجعة الخطة الاستراتيجية', titleEn: 'Review Strategic Plan', dueDateUtc: '2025-12-28T23:59:00Z', priority: 'medium', status: 'pending', progressPercent: 0, assignedToDisplayName: 'Sara Khalid' },
  { id: 't3', titleAr: 'تحديث سياسات الجودة', titleEn: 'Update Quality Policies', dueDateUtc: '2025-12-15T23:59:00Z', priority: 'critical', status: 'overdue', progressPercent: 30, assignedToDisplayName: 'Mohammad Hassan' },
  { id: 't4', titleAr: 'إرسال الدعوات', titleEn: 'Send Invitations', dueDateUtc: '2025-12-20T10:00:00Z', priority: 'low', status: 'completed', progressPercent: 100, assignedToDisplayName: 'Fatimah Omar' },
];

const voteSessions: VoteSession[] = [
  { id: 'v1', meetingId: 'm3', titleAr: 'التصويت على ميزانية 2026', titleEn: 'Vote on 2026 Budget', status: 'closed', options: [{ id: 'vo1', labelAr: 'موافق', labelEn: 'Approve', votesCount: 8 }, { id: 'vo2', labelAr: 'رفض', labelEn: 'Reject', votesCount: 2 }, { id: 'vo3', labelAr: 'امتناع', labelEn: 'Abstain', votesCount: 1 }], totalVotes: 11 },
];

const surveys: SurveyItem[] = [
  { id: 's1', titleAr: 'استبيان رضا الأعضاء', titleEn: 'Member Satisfaction Survey', targetAudience: 'committee_members', status: 'active', startAtUtc: '2025-12-01T00:00:00Z', endAtUtc: '2025-12-31T23:59:00Z', totalResponses: 23, questionsCount: 10 },
];

const moms: Mom[] = [
  { id: 'mom1', meetingId: 'm3', meetingTitleAr: 'جلسة مجلس الجامعة', meetingTitleEn: 'University Council Session', status: 'approved', preparedByDisplayName: 'Sara Khalid', approvedByDisplayName: 'Dr. Ahmad', summaryAr: 'تمت مناقشة الميزانية والموافقة عليها', summaryEn: 'Budget was discussed and approved', createdAtUtc: '2025-12-18T14:00:00Z' },
];

const notifications: NotificationItem[] = [
  { id: 'n1', type: 'meeting_invitation', titleAr: 'دعوة لاجتماع', titleEn: 'Meeting Invitation', bodyAr: 'تمت دعوتك لحضور اجتماع الشؤون الأكاديمية', bodyEn: 'You have been invited to Academic Affairs meeting', isRead: false, entityType: 'meeting', entityId: 'm1', createdAtUtc: '2025-12-19T08:00:00Z' },
  { id: 'n2', type: 'task_assigned', titleAr: 'مهمة جديدة', titleEn: 'New Task Assigned', bodyAr: 'تم تعيين مهمة جديدة لك', bodyEn: 'A new task has been assigned to you', isRead: true, entityType: 'task', entityId: 't1', createdAtUtc: '2025-12-18T10:00:00Z' },
];

const workflowTemplates: WorkflowTemplate[] = [
  { id: 'wf1', name: 'Committee Approval', domain: 'committee', definitionJson: '{"initialState":"draft","transitions":[{"from":"draft","to":"pending_approval","action":"submit","requiredRole":"CommitteeSecretary"},{"from":"pending_approval","to":"active","action":"approve","requiredRole":"CommitteeHead"}]}' },
];

/* ---- Committee Members ---- */

const committeeMembers: CommitteeMember[] = [
  { userId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa', role: 'head', joinedAtUtc: '2025-01-15T10:00:00Z' },
  { userId: 'u2', displayName: 'سارة خالد', email: 'sara@uoh.edu.sa', role: 'secretary', joinedAtUtc: '2025-01-15T10:00:00Z' },
  { userId: 'u3', displayName: 'محمد حسن', email: 'mohammed@uoh.edu.sa', role: 'member', joinedAtUtc: '2025-02-01T08:00:00Z' },
  { userId: 'u4', displayName: 'فاطمة عمر', email: 'fatimah@uoh.edu.sa', role: 'member', joinedAtUtc: '2025-02-10T09:00:00Z' },
  { userId: 'u5', displayName: 'خالد إبراهيم', email: 'khalid@uoh.edu.sa', role: 'observer', joinedAtUtc: '2025-03-01T07:00:00Z' },
];

/* ---- Chat ---- */

const conversations: ChatConversation[] = [
  {
    id: 'conv1', type: 'direct', createdAtUtc: '2025-12-15T10:00:00Z',
    participants: [
      { userObjectId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa', joinedAtUtc: '2025-12-15T10:00:00Z' },
      { userObjectId: 'me', displayName: 'Current User', email: 'me@uoh.edu.sa', joinedAtUtc: '2025-12-15T10:00:00Z' },
    ],
    lastMessagePreview: 'هل الاجتماع غدا مؤكد؟',
    lastMessageAtUtc: '2025-12-19T14:30:00Z',
    unreadCount: 2,
  },
  {
    id: 'conv2', type: 'group', titleAr: 'مجموعة لجنة الشؤون الأكاديمية', titleEn: 'Academic Affairs Group', createdAtUtc: '2025-12-10T08:00:00Z',
    participants: [
      { userObjectId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa', joinedAtUtc: '2025-12-10T08:00:00Z' },
      { userObjectId: 'u2', displayName: 'سارة خالد', email: 'sara@uoh.edu.sa', joinedAtUtc: '2025-12-10T08:00:00Z' },
      { userObjectId: 'me', displayName: 'Current User', email: 'me@uoh.edu.sa', joinedAtUtc: '2025-12-10T08:00:00Z' },
    ],
    lastMessagePreview: 'تم تحديث جدول الأعمال',
    lastMessageAtUtc: '2025-12-19T12:00:00Z',
    unreadCount: 0,
  },
];

const chatMessages: ChatMessage[] = [
  { id: 'msg1', conversationId: 'conv1', senderObjectId: 'u1', senderDisplayName: 'أحمد علي', content: 'السلام عليكم', sentAtUtc: '2025-12-19T14:00:00Z', isRead: true },
  { id: 'msg2', conversationId: 'conv1', senderObjectId: 'me', senderDisplayName: 'Current User', content: 'وعليكم السلام', sentAtUtc: '2025-12-19T14:05:00Z', isRead: true },
  { id: 'msg3', conversationId: 'conv1', senderObjectId: 'u1', senderDisplayName: 'أحمد علي', content: 'هل الاجتماع غدا مؤكد؟', sentAtUtc: '2025-12-19T14:30:00Z', isRead: false },
  { id: 'msg4', conversationId: 'conv2', senderObjectId: 'u2', senderDisplayName: 'سارة خالد', content: 'تم تحديث جدول الأعمال', sentAtUtc: '2025-12-19T12:00:00Z', isRead: true },
];

/* ---- Directives ---- */

const directives: Directive[] = [
  {
    id: 'dir1', titleAr: 'توجيه بشأن سياسة العمل عن بعد', titleEn: 'Directive on Remote Work Policy',
    descriptionAr: 'يجب على جميع الإدارات تطبيق سياسة العمل عن بعد', descriptionEn: 'All departments must implement remote work policy',
    referenceNumber: 'DIR-2025-001', issuedBy: 'Dr. Ahmad Ali', status: 'active',
    createdAtUtc: '2025-11-01T08:00:00Z',
  },
  {
    id: 'dir2', titleAr: 'توجيه بشأن التحول الرقمي', titleEn: 'Directive on Digital Transformation',
    descriptionAr: 'تسريع مشاريع التحول الرقمي', descriptionEn: 'Accelerate digital transformation projects',
    referenceNumber: 'DIR-2025-002', issuedBy: 'Dr. Sara Khalid', status: 'draft',
    createdAtUtc: '2025-12-01T09:00:00Z',
  },
];

const directiveDecisions: DirectiveDecision[] = [
  { id: 'dd1', directiveId: 'dir1', textAr: 'اعتماد سياسة العمل عن بعد', textEn: 'Approve remote work policy', assignedTo: 'IT Committee', dueDateUtc: '2026-01-15T23:59:00Z', status: 'pending' },
  { id: 'dd2', directiveId: 'dir1', textAr: 'تدريب الموظفين', textEn: 'Train employees', assignedTo: 'HR Department', dueDateUtc: '2026-02-01T23:59:00Z', status: 'completed' },
];

/* ---- Evaluations ---- */

const evaluations: Evaluation[] = [
  {
    id: 'eval1', templateId: 'et1', committeeId: 'c1',
    evaluatorDisplayName: 'Dr. Ahmad Ali', periodStart: '2025-07-01T00:00:00Z', periodEnd: '2025-12-31T23:59:00Z',
    overallScore: 82, overallNotesAr: 'أداء ممتاز بشكل عام', overallNotesEn: 'Overall excellent performance',
    responses: [
      { criteriaId: 'ec1', score: 9, notes: 'Good attendance' },
      { criteriaId: 'ec2', score: 8, notes: 'Active participation' },
      { criteriaId: 'ec3', score: 7, notes: 'Reports on time' },
    ],
    createdAtUtc: '2025-12-15T10:00:00Z',
  },
];

const evaluationTemplates: EvaluationTemplate[] = [
  {
    id: 'et1', nameAr: 'تقييم أداء اللجنة', nameEn: 'Committee Performance Evaluation', maxScore: 100,
    criteria: [
      { id: 'ec1', labelAr: 'الحضور والالتزام', labelEn: 'Attendance & Commitment', weight: 30, maxScore: 10 },
      { id: 'ec2', labelAr: 'المشاركة الفعالة', labelEn: 'Active Participation', weight: 40, maxScore: 10 },
      { id: 'ec3', labelAr: 'إنجاز المهام', labelEn: 'Task Completion', weight: 30, maxScore: 10 },
    ],
  },
];

/* ---- Acknowledgments ---- */

const acknowledgmentTemplates: AcknowledgmentTemplate[] = [
  {
    id: 'ack1', titleAr: 'إقرار سياسة الخصوصية', titleEn: 'Privacy Policy Acknowledgment',
    bodyAr: 'أقر بأنني اطلعت على سياسة الخصوصية', bodyEn: 'I acknowledge that I have read the privacy policy',
    category: 'policy', isMandatory: true, expiresAtUtc: '2026-06-30T23:59:00Z',
    status: 'active', createdAtUtc: '2025-11-01T08:00:00Z',
  },
  {
    id: 'ack2', titleAr: 'إقرار قواعد السلوك', titleEn: 'Code of Conduct Acknowledgment',
    bodyAr: 'أقر بالتزامي بقواعد السلوك المهني', bodyEn: 'I acknowledge my commitment to the code of conduct',
    category: 'compliance', isMandatory: true, expiresAtUtc: '2026-12-31T23:59:00Z',
    status: 'active', createdAtUtc: '2025-10-01T08:00:00Z',
  },
];

const userAcknowledgments: UserAcknowledgment[] = [
  { id: 'ua1', templateId: 'ack2', acknowledgedAtUtc: '2025-11-15T10:00:00Z' },
];

/* ---- Locations ---- */

const locations: Location[] = [
  { id: 'loc1', nameAr: 'المبنى الرئيسي', nameEn: 'Main Building', type: 'building', building: 'A', coordinates: { lat: 24.4678, lng: 39.6112 }, childLocationIds: ['loc2', 'loc3'] },
  { id: 'loc2', nameAr: 'قاعة الاجتماعات الكبرى', nameEn: 'Grand Meeting Hall', type: 'hall', building: 'A', floor: '2', roomNumber: '201', parentLocationId: 'loc1', coordinates: { lat: 24.4678, lng: 39.6112 } },
  { id: 'loc3', nameAr: 'غرفة اجتماعات 301', nameEn: 'Meeting Room 301', type: 'meeting_room', building: 'A', floor: '3', roomNumber: '301', parentLocationId: 'loc1', coordinates: { lat: 24.4678, lng: 39.6112 } },
  { id: 'loc4', nameAr: 'مبنى تقنية المعلومات', nameEn: 'IT Building', type: 'building', building: 'B', coordinates: { lat: 24.4690, lng: 39.6120 } },
  { id: 'loc5', nameAr: 'المكتبة المركزية', nameEn: 'Central Library', type: 'library', building: 'C', coordinates: { lat: 24.4685, lng: 39.6105 } },
];

/* ---- Meeting Rooms ---- */

const meetingRooms: MeetingRoom[] = [
  { id: 'mr1', nameAr: 'قاعة الاجتماعات الكبرى', nameEn: 'Grand Meeting Hall', building: 'A', floor: '2', capacity: 50, hasVideoConference: true, hasProjector: true, isActive: true },
  { id: 'mr2', nameAr: 'غرفة اجتماعات 301', nameEn: 'Meeting Room 301', building: 'A', floor: '3', capacity: 12, hasVideoConference: true, hasProjector: true, isActive: true },
  { id: 'mr3', nameAr: 'غرفة اجتماعات 102', nameEn: 'Meeting Room 102', building: 'B', floor: '1', capacity: 8, hasVideoConference: false, hasProjector: true, isActive: true },
];

/* ---- Approvals ---- */

const approvalItems: ApprovalItem[] = [
  { id: 'apr1', entityType: 'meeting', entityId: 'm2', titleAr: 'ورشة التخطيط', titleEn: 'Planning Workshop', requestedBy: 'Sara Khalid', requestedAtUtc: '2025-12-19T08:00:00Z', status: 'pending' },
  { id: 'apr2', entityType: 'mom', entityId: 'mom1', titleAr: 'محضر جلسة مجلس الجامعة', titleEn: 'University Council Session Minutes', requestedBy: 'Ahmad Ali', requestedAtUtc: '2025-12-18T15:00:00Z', status: 'pending' },
];

/* ---- Change Requests ---- */

const changeRequests: ChangeRequest[] = [
  {
    id: 'cr1', committeeId: 'c1', reason: 'Need to add new member', requester: 'Sara Khalid',
    changesJson: '{"type":"add_member","userId":"u5","role":"member"}',
    status: 'pending', createdAtUtc: '2025-12-18T09:00:00Z',
  },
  {
    id: 'cr2', committeeId: 'c2', reason: 'Extend committee deadline', requester: 'Ahmad Ali',
    changesJson: '{"type":"extend_deadline","newEndDate":"2026-06-30"}',
    status: 'approved', reviewer: 'Dr. Mohammad', reviewNotes: 'Approved with no changes',
    createdAtUtc: '2025-12-10T11:00:00Z', reviewedAtUtc: '2025-12-12T14:00:00Z',
  },
];

/* ---- Admin: Users ---- */

const adminUsers: AdminUser[] = [
  { id: 'u1', displayNameAr: 'أحمد علي', displayNameEn: 'Ahmad Ali', email: 'ahmed@uoh.edu.sa', employeeId: 'EMP001', isActive: true, roles: ['CommitteeHead'], lastLoginUtc: '2025-12-19T08:00:00Z' },
  { id: 'u2', displayNameAr: 'سارة خالد', displayNameEn: 'Sara Khalid', email: 'sara@uoh.edu.sa', employeeId: 'EMP002', isActive: true, roles: ['CommitteeSecretary'], lastLoginUtc: '2025-12-19T09:00:00Z' },
  { id: 'u3', displayNameAr: 'محمد حسن', displayNameEn: 'Mohammad Hassan', email: 'mohammed@uoh.edu.sa', employeeId: 'EMP003', isActive: true, roles: ['CommitteeMember'], lastLoginUtc: '2025-12-18T15:00:00Z' },
  { id: 'u4', displayNameAr: 'فاطمة عمر', displayNameEn: 'Fatimah Omar', email: 'fatimah@uoh.edu.sa', employeeId: 'EMP004', isActive: false, roles: ['Observer'], lastLoginUtc: '2025-12-01T10:00:00Z' },
  { id: 'u5', displayNameAr: 'خالد إبراهيم', displayNameEn: 'Khalid Ibrahim', email: 'khalid@uoh.edu.sa', employeeId: 'EMP005', isActive: true, roles: ['SystemAdmin'], lastLoginUtc: '2025-12-19T07:00:00Z' },
];

/* ---- Admin: Roles ---- */

const roles: Role[] = [
  { id: 'r1', name: 'SystemAdmin', key: 'SystemAdmin', isBuiltIn: true, permissionCount: 50 },
  { id: 'r2', name: 'CommitteeHead', key: 'CommitteeHead', isBuiltIn: true, permissionCount: 35 },
  { id: 'r3', name: 'CommitteeSecretary', key: 'CommitteeSecretary', isBuiltIn: true, permissionCount: 30 },
  { id: 'r4', name: 'CommitteeMember', key: 'CommitteeMember', isBuiltIn: true, permissionCount: 15 },
  { id: 'r5', name: 'Observer', key: 'Observer', isBuiltIn: true, permissionCount: 8 },
];

/* ---- Admin: Announcements ---- */

const announcements: Announcement[] = [
  {
    id: 'ann1', titleAr: 'إعلان صيانة النظام', titleEn: 'System Maintenance Notice',
    bodyAr: 'سيتم إجراء صيانة للنظام يوم السبت', bodyEn: 'System maintenance will be performed on Saturday',
    type: 'announcement', status: 'published', createdAtUtc: '2025-12-18T08:00:00Z',
  },
  {
    id: 'ann2', titleAr: 'تعميم: سياسات جديدة', titleEn: 'Circular: New Policies',
    bodyAr: 'يرجى الاطلاع على السياسات الجديدة', bodyEn: 'Please review the new policies',
    type: 'circular', status: 'published', createdAtUtc: '2025-12-15T09:00:00Z',
  },
];

/* ---- Dashboard Stats ---- */

const dashboardStats: DashboardStats = {
  totalCommittees: 7,
  activeCommittees: 6,
  totalMeetings: 3,
  meetingsThisMonth: 2,
  pendingTasks: 1,
  overdueTasks: 1,
  activeSurveys: 1,
  meetingAttendanceRate: 85,
  taskCompletionRate: 25,
  upcomingMeetings: meetings.filter(m => m.status === 'scheduled').map(m => ({ id: m.id, titleAr: m.titleAr, titleEn: m.titleEn, startDateTimeUtc: m.startDateTimeUtc, status: m.status })),
  recentActivity: [
    { occurredAtUtc: '2025-12-19T08:30:00Z', userDisplayName: 'Ahmad Ali', httpMethod: 'POST', path: '/api/v1/meetings', statusCode: 201 },
    { occurredAtUtc: '2025-12-19T07:15:00Z', userDisplayName: 'Sara Khalid', httpMethod: 'PUT', path: '/api/v1/tasks/t1', statusCode: 200 },
  ],
  meetingsByMonth: [
    { label: 'Oct', count: 3 }, { label: 'Nov', count: 5 }, { label: 'Dec', count: 2 },
  ],
  taskStatusBreakdown: [
    { label: 'Pending', count: 1 }, { label: 'In Progress', count: 1 }, { label: 'Completed', count: 1 }, { label: 'Overdue', count: 1 },
  ],
  committeeTypeBreakdown: [
    { label: 'Permanent', count: 1 }, { label: 'Temporary', count: 1 }, { label: 'Council', count: 1 }, { label: 'Sub', count: 1 }, { label: 'Main', count: 1 }, { label: 'Self-managed', count: 1 }, { label: 'Cross-functional', count: 1 },
  ],
  liveMeetingsNow: 0,
  upcomingMeetingsCount: 2,
};

/* ---- Reports dummy data ---- */

const reportCommitteeActivity = {
  rows: committees.map(c => ({
    committeeId: c.id, committeeName: c.nameEn, meetingsCount: Math.floor(Math.random() * 10) + 1, decisionsCount: Math.floor(Math.random() * 20) + 1,
  })),
  totalMeetings: 24, totalDecisions: 67,
};

const reportAttendance = {
  rows: meetings.map(m => ({
    meetingId: m.id, meetingTitle: m.titleEn, invited: 8, present: 6, rate: 75,
  })),
  overallAttendanceRate: 78,
};

const reportTaskPerformance = {
  rows: [
    { assignee: 'Ahmad Ali', total: 5, completed: 3, overdue: 1 },
    { assignee: 'Sara Khalid', total: 4, completed: 2, overdue: 0 },
    { assignee: 'Mohammad Hassan', total: 3, completed: 1, overdue: 1 },
  ],
  totalTasksCompleted: 6, overallCompletionRate: 60, totalOverdue: 2,
};

/* ---- Helpers ---- */

function paged<T>(items: T[], path: string): PagedResponse<T> {
  const url = new URL(path, 'http://x');
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20');
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export function getDemoResponse(method: string, path: string): unknown | null {
  const p = path.split('?')[0];

  if (method === 'GET') {
    // Dashboard
    if (p === '/api/v1/dashboard/stats') return dashboardStats;

    // Committees
    if (p === '/api/v1/committees') return paged(committees, path);
    if (p.match(/^\/api\/v1\/committees\/[\w-]+$/)) return committees.find(c => c.id === p.split('/').pop()) ?? committees[0];
    if (p.match(/^\/api\/v1\/committees\/[\w-]+\/members$/)) return committeeMembers;

    // Meetings
    if (p === '/api/v1/meetings') return paged(meetings, path);
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+$/)) return meetings.find(m => m.id === p.split('/').pop()) ?? meetings[0];
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/invitees$/)) return [
      { userId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa', attendanceStatus: 'present' },
      { userId: 'u2', displayName: 'سارة خالد', email: 'sara@uoh.edu.sa', attendanceStatus: 'present' },
      { userId: 'u3', displayName: 'محمد حسن', email: 'mohammed@uoh.edu.sa', attendanceStatus: 'absent' },
      { userId: 'u4', displayName: 'فاطمة عمر', email: 'fatimah@uoh.edu.sa', attendanceStatus: 'excused' },
    ];
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/votes$/)) return paged(voteSessions, path);
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/agenda$/)) return [
      { id: 'ag1', order: 1, titleAr: 'افتتاح الاجتماع', titleEn: 'Opening', durationMinutes: 5, presenterName: 'Ahmad Ali' },
      { id: 'ag2', order: 2, titleAr: 'مناقشة الميزانية', titleEn: 'Budget Discussion', durationMinutes: 30, presenterName: 'Sara Khalid' },
      { id: 'ag3', order: 3, titleAr: 'التصويت', titleEn: 'Voting', durationMinutes: 15 },
    ];

    // Meeting rooms
    if (p === '/api/v1/meeting-rooms') return meetingRooms;
    if (p.match(/^\/api\/v1\/meeting-rooms\/[\w-]+$/)) return meetingRooms.find(r => r.id === p.split('/').pop()) ?? meetingRooms[0];
    if (p.match(/^\/api\/v1\/meeting-rooms\/[\w-]+\/availability$/)) {
      const avail: RoomAvailability = {
        roomId: p.split('/')[4],
        entries: [
          { date: '2025-12-20', startTime: '09:00', endTime: '11:00', status: 'booked', meetingTitleEn: 'Academic Meeting' },
          { date: '2025-12-20', startTime: '14:00', endTime: '16:00', status: 'available' },
          { date: '2025-12-21', startTime: '10:00', endTime: '12:00', status: 'available' },
        ],
      };
      return avail;
    }

    // Tasks
    if (p === '/api/v1/tasks') return paged(tasks, path);
    if (p.match(/^\/api\/v1\/tasks\/[\w-]+$/)) return tasks.find(t => t.id === p.split('/').pop()) ?? tasks[0];

    // Votes
    if (p.match(/^\/api\/v1\/votes\/[\w-]+$/)) return voteSessions.find(v => v.id === p.split('/').pop()) ?? voteSessions[0];

    // Surveys
    if (p === '/api/v1/surveys') return paged(surveys, path);
    if (p.match(/^\/api\/v1\/surveys\/[\w-]+$/)) return { ...surveys[0], questions: [
      { id: 'sq1', order: 1, type: 'single', textAr: 'ما مدى رضاك عن أداء اللجنة؟', textEn: 'How satisfied are you with the committee performance?', optionsJson: '["ممتاز","جيد جداً","جيد","مقبول","ضعيف"]' },
      { id: 'sq2', order: 2, type: 'rating', textAr: 'قيّم جودة الاجتماعات', textEn: 'Rate the quality of meetings', optionsJson: null },
      { id: 'sq3', order: 3, type: 'text', textAr: 'ما هي اقتراحاتك للتحسين؟', textEn: 'What are your suggestions for improvement?', optionsJson: null },
      { id: 'sq4', order: 4, type: 'multi', textAr: 'ما الجوانب التي تحتاج تطوير؟', textEn: 'Which aspects need improvement?', optionsJson: '["التواصل","التنظيم","المتابعة","التقارير"]' },
      { id: 'sq5', order: 5, type: 'yesno', textAr: 'هل توصي بالاستمرار في هذا النهج؟', textEn: 'Do you recommend continuing this approach?', optionsJson: null },
    ] };

    // MOMs
    if (p === '/api/v1/moms') return paged(moms, path);
    if (p.match(/^\/api\/v1\/moms\/[\w-]+$/)) return moms.find(m => m.id === p.split('/').pop()) ?? moms[0];

    // Notifications
    if (p === '/api/v1/notifications') return paged(notifications, path);
    if (p === '/api/v1/notifications/unread-count') return { count: notifications.filter(n => !n.isRead).length };

    // Workflows
    if (p === '/api/v1/workflow/templates') return paged(workflowTemplates, path);
    if (p.match(/^\/api\/v1\/workflow\/templates\/[\w-]+$/)) return workflowTemplates[0];

    // Chat
    if (p === '/api/v1/chat/conversations') return conversations;
    if (p.match(/^\/api\/v1\/chat\/conversations\/[\w-]+$/)) return conversations.find(c => c.id === p.split('/').pop()) ?? conversations[0];
    if (p.match(/^\/api\/v1\/chat\/conversations\/[\w-]+\/messages$/)) {
      const convId = p.split('/')[4];
      return chatMessages.filter(m => m.conversationId === convId);
    }
    if (p.match(/^\/api\/v1\/chat\/contacts/)) return [
      { userObjectId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa' },
      { userObjectId: 'u2', displayName: 'سارة خالد', email: 'sara@uoh.edu.sa' },
      { userObjectId: 'u3', displayName: 'محمد حسن', email: 'mohammed@uoh.edu.sa' },
      { userObjectId: 'u4', displayName: 'فاطمة عمر', email: 'fatimah@uoh.edu.sa' },
      { userObjectId: 'u5', displayName: 'خالد إبراهيم', email: 'khalid@uoh.edu.sa' },
    ];

    // Directives
    if (p === '/api/v1/directives') return paged(directives, path);
    if (p.match(/^\/api\/v1\/directives\/[\w-]+$/)) return directives.find(d => d.id === p.split('/').pop()) ?? directives[0];
    if (p.match(/^\/api\/v1\/directives\/[\w-]+\/decisions$/)) {
      const dirId = p.split('/')[4];
      return directiveDecisions.filter(d => d.directiveId === dirId);
    }

    // Evaluations
    if (p === '/api/v1/evaluations') return paged(evaluations, path);
    if (p.match(/^\/api\/v1\/evaluations\/[\w-]+$/)) return evaluations.find(e => e.id === p.split('/').pop()) ?? evaluations[0];
    if (p === '/api/v1/evaluation-templates') return evaluationTemplates;
    if (p.match(/^\/api\/v1\/evaluation-templates\/[\w-]+$/)) return evaluationTemplates.find(t => t.id === p.split('/').pop()) ?? evaluationTemplates[0];

    // Acknowledgments
    if (p === '/api/v1/acknowledgments/pending') return acknowledgmentTemplates.filter(a => !userAcknowledgments.find(ua => ua.templateId === a.id));
    if (p === '/api/v1/acknowledgments/history') return userAcknowledgments;
    if (p === '/api/v1/acknowledgments/templates') return paged(acknowledgmentTemplates, path);
    if (p.match(/^\/api\/v1\/acknowledgments\/templates\/[\w-]+$/)) return acknowledgmentTemplates.find(a => a.id === p.split('/').pop()) ?? acknowledgmentTemplates[0];

    // Locations
    if (p === '/api/v1/locations') return locations;
    if (p.match(/^\/api\/v1\/locations\/[\w-]+$/)) return locations.find(l => l.id === p.split('/').pop()) ?? locations[0];

    // Room Booking
    if (p === '/api/v1/room-bookings') return [];

    // Approvals
    if (p === '/api/v1/approvals') return paged(approvalItems, path);

    // Change Requests
    if (p === '/api/v1/change-requests') return paged(changeRequests, path);
    if (p.match(/^\/api\/v1\/change-requests\/[\w-]+$/)) return changeRequests.find(cr => cr.id === p.split('/').pop()) ?? changeRequests[0];

    // Admin: Users
    if (p === '/api/v1/admin/users') return paged(adminUsers, path);
    if (p.match(/^\/api\/v1\/admin\/users\/[\w-]+$/)) return adminUsers.find(u => u.id === p.split('/').pop()) ?? adminUsers[0];

    // Admin: Roles
    if (p === '/api/v1/admin/roles') return roles;
    if (p.match(/^\/api\/v1\/admin\/roles\/[\w-]+$/)) return roles.find(r => r.id === p.split('/').pop()) ?? roles[0];
    if (p.match(/^\/api\/v1\/admin\/roles\/[\w-]+\/permissions$/)) return [
      { id: 'p1', group: 'Committees', key: 'committees.view', label: 'View Committees' },
      { id: 'p2', group: 'Committees', key: 'committees.create', label: 'Create Committees' },
      { id: 'p3', group: 'Meetings', key: 'meetings.view', label: 'View Meetings' },
      { id: 'p4', group: 'Meetings', key: 'meetings.create', label: 'Create Meetings' },
      { id: 'p5', group: 'Tasks', key: 'tasks.view', label: 'View Tasks' },
      { id: 'p6', group: 'Tasks', key: 'tasks.manage', label: 'Manage Tasks' },
      { id: 'p7', group: 'Admin', key: 'admin.users', label: 'Manage Users' },
      { id: 'p8', group: 'Admin', key: 'admin.roles', label: 'Manage Roles' },
    ];

    // Admin: Announcements
    if (p === '/api/v1/admin/announcements') return paged(announcements, path);

    // Admin: AD Sync
    if (p === '/api/v1/admin/ad-sync/status') return { connected: true, lastSyncUtc: '2025-12-19T02:00:00Z', totalSynced: 150, created: 5, updated: 10, errors: 0 };
    if (p === '/api/v1/admin/ad-sync/history') return [
      { id: 'sync1', startedAtUtc: '2025-12-19T02:00:00Z', completedAtUtc: '2025-12-19T02:05:00Z', total: 150, created: 5, updated: 10, errors: 0 },
      { id: 'sync2', startedAtUtc: '2025-12-18T02:00:00Z', completedAtUtc: '2025-12-18T02:04:00Z', total: 148, created: 2, updated: 8, errors: 1 },
    ];

    // Reports
    if (p === '/api/v1/reports/committee-activity') return reportCommitteeActivity;
    if (p === '/api/v1/reports/attendance') return reportAttendance;
    if (p === '/api/v1/reports/task-performance') return reportTaskPerformance;
    if (p.match(/^\/api\/v1\/reports\//)) return { rows: [], totalMeetings: 0, totalDecisions: 0, totalTasksCompleted: 0, overallAttendanceRate: 0, overallCompletionRate: 0, totalOverdue: 0 };

    // Attachments
    if (p === '/api/v1/files') return [
      { id: 'f1', fileName: 'meeting_agenda.pdf', contentType: 'application/pdf', sizeBytes: 245000, uploadedByDisplayName: 'Sara Khalid', createdAtUtc: '2025-12-18T10:00:00Z' },
      { id: 'f2', fileName: 'budget_report.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeBytes: 180000, uploadedByDisplayName: 'Ahmad Ali', createdAtUtc: '2025-12-17T09:00:00Z' },
      { id: 'f3', fileName: 'presentation.pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sizeBytes: 520000, uploadedByDisplayName: 'Mohammad Hassan', createdAtUtc: '2025-12-16T14:00:00Z' },
    ];

    // Live survey sessions
    if (p.match(/^\/api\/v1\/live-surveys\/[\w-]+$/)) return {
      id: 'ls1', surveyId: 's1', surveyTitleAr: 'استبيان رضا الأعضاء', surveyTitleEn: 'Member Satisfaction Survey',
      status: 'active', currentQuestionIndex: 0, isVotingOpen: true, participantCount: 12,
      joinCode: 'ABC123', presenterUserId: 'u1',
    };

    // Public share
    if (p.match(/^\/api\/v1\/public\/share\/[\w-]+$/)) return {
      entityType: 'meeting', entityId: 'm1',
      titleAr: 'اجتماع دوري - الشؤون الأكاديمية', titleEn: 'Regular Meeting - Academic Affairs',
      status: 'scheduled', startDateTimeUtc: '2025-12-20T09:00:00Z', endDateTimeUtc: '2025-12-20T11:00:00Z',
      locationAr: 'قاعة الاجتماعات الرئيسية', locationEn: 'Main Meeting Hall',
      allowCheckIn: true,
    };

    // Archive
    if (p === '/api/v1/archive/chat') return chatMessages.slice(0, 2);
    if (p === '/api/v1/archive/attachments') return [
      { id: 'f1', fileName: 'meeting_agenda.pdf', contentType: 'application/pdf', sizeBytes: 245000, uploadedByDisplayName: 'Sara Khalid', createdAtUtc: '2025-12-18T10:00:00Z' },
    ];
    if (p === '/api/v1/archive/announcements') return announcements;

    // Calendar events
    if (p === '/api/v1/calendar/events') return meetings.map(m => ({
      id: m.id, titleAr: m.titleAr, titleEn: m.titleEn,
      startDateTimeUtc: m.startDateTimeUtc, endDateTimeUtc: m.endDateTimeUtc,
      type: 'meeting' as const, allDay: false,
    }));
  }

  if (method === 'POST' || method === 'PUT') {
    if (p === '/api/v1/notifications/register-device') return { success: true };
    if (p.match(/^\/api\/v1\/chat\/conversations$/)) return conversations[0];
    if (p.match(/^\/api\/v1\/chat\/conversations\/[\w-]+\/messages$/)) return { id: 'msg-new-' + Date.now(), conversationId: 'conv1', senderObjectId: 'me', senderDisplayName: 'Current User', content: 'New message', sentAtUtc: new Date().toISOString(), isRead: false };
    if (p.match(/^\/api\/v1\/acknowledgments\/[\w-]+\/acknowledge$/)) return { success: true };
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/attendance$/)) return { success: true };
    if (p.match(/^\/api\/v1\/approvals\/[\w-]+\/approve$/)) return { success: true };
    if (p.match(/^\/api\/v1\/approvals\/[\w-]+\/reject$/)) return { success: true };
    if (p.match(/^\/api\/v1\/admin\/ad-sync\/trigger$/)) return { success: true, syncId: 'sync-new' };
    if (p.match(/^\/api\/v1\/public\/share\/[\w-]+\/check-in$/)) return { success: true };
    if (p.match(/^\/api\/v1\/files\/upload-url$/)) return { url: 'https://storage.example.com/upload?token=demo', fileId: 'f-new-' + Date.now() };
    return { id: 'demo-' + Date.now(), success: true };
  }

  if (method === 'DELETE') {
    return { success: true };
  }

  return null;
}
