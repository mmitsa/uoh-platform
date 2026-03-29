import type {
  CommitteeItem, MeetingItem, TaskItem, VoteSession, SurveyItem, Mom,
  NotificationItem, WorkflowTemplate, DashboardStats, PagedResponse,
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
    if (p === '/api/v1/dashboard/stats') return dashboardStats;
    if (p === '/api/v1/committees') return paged(committees, path);
    if (p.match(/^\/api\/v1\/committees\/[\w-]+$/)) return committees.find(c => c.id === p.split('/').pop()) ?? null;
    if (p === '/api/v1/meetings') return paged(meetings, path);
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+$/)) return meetings.find(m => m.id === p.split('/').pop()) ?? null;
    if (p === '/api/v1/tasks') return paged(tasks, path);
    if (p.match(/^\/api\/v1\/tasks\/[\w-]+$/)) return tasks.find(t => t.id === p.split('/').pop()) ?? null;
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/votes$/)) return paged(voteSessions, path);
    if (p.match(/^\/api\/v1\/votes\/[\w-]+$/)) return voteSessions.find(v => v.id === p.split('/').pop()) ?? voteSessions[0];
    if (p.match(/^\/api\/v1\/meetings\/[\w-]+\/invitees$/)) return [
      { userId: 'u1', displayName: 'أحمد علي', email: 'ahmed@uoh.edu.sa', attendanceStatus: 'present' },
      { userId: 'u2', displayName: 'سارة خالد', email: 'sara@uoh.edu.sa', attendanceStatus: 'present' },
      { userId: 'u3', displayName: 'محمد حسن', email: 'mohammed@uoh.edu.sa', attendanceStatus: 'absent' },
      { userId: 'u4', displayName: 'فاطمة عمر', email: 'fatimah@uoh.edu.sa', attendanceStatus: 'excused' },
    ];
    if (p.match(/^\/api\/v1\/surveys\/[\w-]+$/)) return { ...surveys[0], questions: [
      { id: 'sq1', order: 1, type: 'single', textAr: 'ما مدى رضاك عن أداء اللجنة؟', textEn: 'How satisfied are you with the committee performance?', optionsJson: '["ممتاز","جيد جداً","جيد","مقبول","ضعيف"]' },
      { id: 'sq2', order: 2, type: 'rating', textAr: 'قيّم جودة الاجتماعات', textEn: 'Rate the quality of meetings', optionsJson: null },
      { id: 'sq3', order: 3, type: 'text', textAr: 'ما هي اقتراحاتك للتحسين؟', textEn: 'What are your suggestions for improvement?', optionsJson: null },
      { id: 'sq4', order: 4, type: 'multi', textAr: 'ما الجوانب التي تحتاج تطوير؟', textEn: 'Which aspects need improvement?', optionsJson: '["التواصل","التنظيم","المتابعة","التقارير"]' },
      { id: 'sq5', order: 5, type: 'yesno', textAr: 'هل توصي بالاستمرار في هذا النهج؟', textEn: 'Do you recommend continuing this approach?', optionsJson: null },
    ] };
    if (p === '/api/v1/surveys') return paged(surveys, path);
    if (p === '/api/v1/moms') return paged(moms, path);
    if (p.match(/^\/api\/v1\/moms\/[\w-]+$/)) return moms.find(m => m.id === p.split('/').pop()) ?? null;
    if (p === '/api/v1/notifications') return paged(notifications, path);
    if (p === '/api/v1/notifications/unread-count') return { count: notifications.filter(n => !n.isRead).length };
    if (p === '/api/v1/workflow/templates') return paged(workflowTemplates, path);
    if (p.match(/^\/api\/v1\/reports\//)) return { rows: [], totalMeetings: 0, totalDecisions: 0, totalTasksCompleted: 0, overallAttendanceRate: 0, overallCompletionRate: 0, totalOverdue: 0 };
  }

  if (method === 'POST' || method === 'PUT') {
    if (p === '/api/v1/notifications/register-device') {
      return { success: true };
    }
    return { id: 'demo-' + Date.now(), success: true };
  }

  if (method === 'DELETE') {
    return { success: true };
  }

  return null;
}
