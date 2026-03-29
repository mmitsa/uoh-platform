/* ------------------------------------------------------------------ *
 *  Demo / seed data used when the backend API is unavailable.         *
 *  All IDs are stable UUIDs so links work across pages.               *
 * ------------------------------------------------------------------ */

const uid = (n: number) => `00000000-0000-4000-a000-${String(n).padStart(12, '0')}`;

/* ---- Committees ---- */
export const DEMO_COMMITTEES = {
  items: [
    { id: uid(1), type: 'council',          nameAr: 'مجلس الجامعة',                   nameEn: 'University Council',              descriptionAr: 'المجلس الأعلى لإدارة شؤون الجامعة', descriptionEn: 'Supreme council for university governance', status: 'active', memberCount: 4, subCommitteeCount: 2,  createdAtUtc: '2025-09-01T08:00:00Z' },
    { id: uid(2), type: 'permanent',        nameAr: 'لجنة الشؤون الأكاديمية',          nameEn: 'Academic Affairs Committee',      descriptionAr: 'متابعة وتطوير البرامج الأكاديمية',   descriptionEn: 'Oversee and develop academic programs',    status: 'active', memberCount: 3, subCommitteeCount: 0,  createdAtUtc: '2025-09-10T10:00:00Z' },
    { id: uid(3), type: 'temporary',        nameAr: 'لجنة التخطيط الاستراتيجي',        nameEn: 'Strategic Planning Committee',    descriptionAr: 'إعداد الخطة الاستراتيجية للجامعة',   descriptionEn: 'Develop university strategic plan',        status: 'active', memberCount: 2, subCommitteeCount: 0, startDate: '2025-10-01', endDate: '2026-06-30', createdAtUtc: '2025-10-01T09:00:00Z' },
    { id: uid(4), type: 'permanent',        nameAr: 'لجنة الموارد البشرية',            nameEn: 'HR Committee',                    descriptionAr: 'إدارة شؤون الموظفين والتوظيف',       descriptionEn: 'Manage staffing and recruitment',          status: 'active', memberCount: 5, subCommitteeCount: 0,  createdAtUtc: '2025-10-05T08:30:00Z' },
    { id: uid(5), type: 'sub',              nameAr: 'لجنة الميزانية',                  nameEn: 'Budget Sub-committee',            descriptionAr: 'لجنة فرعية تابعة لمجلس الجامعة',     descriptionEn: 'Sub-committee under University Council',   status: 'pending_approval', parentCommitteeId: uid(1), memberCount: 0, subCommitteeCount: 0, createdAtUtc: '2025-11-01T07:00:00Z' },
    { id: uid(6), type: 'main',             nameAr: 'لجنة تقنية المعلومات',            nameEn: 'IT Committee',                    descriptionAr: 'إدارة البنية التحتية التقنية',        descriptionEn: 'Manage IT infrastructure',                 status: 'active', memberCount: 3, subCommitteeCount: 1,  createdAtUtc: '2025-11-15T11:00:00Z' },
    { id: uid(7), type: 'temporary',        nameAr: 'لجنة الاعتماد الأكاديمي',          nameEn: 'Accreditation Committee',         descriptionAr: 'إعداد ملفات الاعتماد الأكاديمي',      descriptionEn: 'Prepare accreditation files',              status: 'draft',  memberCount: 0, subCommitteeCount: 0, startDate: '2026-01-10', endDate: '2026-12-31', createdAtUtc: '2026-01-10T09:00:00Z' },
    { id: uid(8), type: 'self_managed',     nameAr: 'فريق التحول الرقمي',              nameEn: 'Digital Transformation Team',     descriptionAr: 'فريق ذاتي الإدارة للتحول الرقمي',     descriptionEn: 'Self-managed digital transformation team', status: 'active', memberCount: 6, subCommitteeCount: 0, maxMembers: 8, createdAtUtc: '2026-02-01T08:00:00Z' },
    { id: uid(9), type: 'cross_functional', nameAr: 'فريق تطوير الخدمات الإلكترونية',  nameEn: 'E-Services Development Team',     descriptionAr: 'فريق متعدد الوظائف من عدة أقسام',     descriptionEn: 'Cross-functional team from multiple depts', status: 'active', memberCount: 7, subCommitteeCount: 0, maxMembers: 10, createdAtUtc: '2026-02-15T10:00:00Z' },
  ],
};

/* ---- Meeting Rooms ---- */
export const DEMO_MEETING_ROOMS = {
  items: [
    { id: uid(700), nameAr: 'قاعة المجلس', nameEn: 'Council Hall', building: 'المبنى الرئيسي', floor: '2', capacity: 30, hasVideoConference: true, hasProjector: true, isActive: true, latitude: 27.5134, longitude: 41.7230, mapUrl: null, createdAtUtc: '2025-08-01T08:00:00Z' },
    { id: uid(701), nameAr: 'قاعة الاجتماعات 1', nameEn: 'Meeting Room 1', building: 'المبنى الإداري', floor: '1', capacity: 12, hasVideoConference: true, hasProjector: true, isActive: true, latitude: 27.5136, longitude: 41.7228, mapUrl: null, createdAtUtc: '2025-08-01T08:00:00Z' },
    { id: uid(702), nameAr: 'قاعة الاجتماعات 2', nameEn: 'Meeting Room 2', building: 'المبنى الإداري', floor: '1', capacity: 8, hasVideoConference: false, hasProjector: true, isActive: true, latitude: 27.5136, longitude: 41.7229, mapUrl: null, createdAtUtc: '2025-08-01T08:00:00Z' },
    { id: uid(703), nameAr: 'قاعة الاجتماعات 3', nameEn: 'Meeting Room 3', building: 'كلية الحاسب', floor: '3', capacity: 20, hasVideoConference: true, hasProjector: true, isActive: true, latitude: 27.5140, longitude: 41.7235, mapUrl: null, createdAtUtc: '2025-08-01T08:00:00Z' },
    { id: uid(704), nameAr: 'مكتب العميد', nameEn: 'Dean Office', building: 'المبنى الرئيسي', floor: '3', capacity: 6, hasVideoConference: false, hasProjector: false, isActive: true, latitude: 27.5134, longitude: 41.7231, mapUrl: null, createdAtUtc: '2025-08-01T08:00:00Z' },
  ],
};

/* ---- Meetings ---- */
const futureDate = (daysFromNow: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
const pastDate = (daysAgo: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_MEETINGS = {
  items: [
    { id: uid(10), committeeId: uid(1),  titleAr: 'الاجتماع الأسبوعي للمجلس',      titleEn: 'Weekly Council Meeting',        descriptionAr: 'الاجتماع الدوري الأسبوعي لمجلس الجامعة لمناقشة المستجدات والقرارات', descriptionEn: 'Weekly council session to discuss updates and decisions', type: 'in_person', startDateTimeUtc: futureDate(2, 10), endDateTimeUtc: futureDate(2, 12), status: 'scheduled', location: 'قاعة المجلس - المبنى الرئيسي', onlinePlatform: null, onlineJoinUrl: null, recordingUrl: null, meetingRoomId: uid(700), meetingRoom: DEMO_MEETING_ROOMS.items[0] },
    { id: uid(11), committeeId: uid(2),  titleAr: 'اجتماع لجنة الشؤون الأكاديمية', titleEn: 'Academic Affairs Meeting',      descriptionAr: 'مراجعة الخطط الأكاديمية واعتماد المقررات الجديدة', descriptionEn: 'Review academic plans and approve new courses', type: 'hybrid',    startDateTimeUtc: futureDate(5, 9),  endDateTimeUtc: futureDate(5, 11), status: 'scheduled', location: 'قاعة الاجتماعات 3', onlinePlatform: 'teams', onlineJoinUrl: 'https://teams.microsoft.com/l/meetup-join/demo-academic', recordingUrl: null, meetingRoomId: uid(703), meetingRoom: DEMO_MEETING_ROOMS.items[3] },
    { id: uid(12), committeeId: uid(3),  titleAr: 'ورشة التخطيط الاستراتيجي',       titleEn: 'Strategic Planning Workshop',   descriptionAr: 'ورشة عمل لإعداد ومراجعة الخطة الاستراتيجية الخمسية', descriptionEn: 'Workshop for preparing and reviewing the five-year strategic plan', type: 'online',    startDateTimeUtc: futureDate(7, 14), endDateTimeUtc: futureDate(7, 17), status: 'draft', location: null, onlinePlatform: 'teams', onlineJoinUrl: 'https://teams.microsoft.com/l/meetup-join/demo-strategic', recordingUrl: null, meetingRoomId: null, meetingRoom: null },
    { id: uid(13), committeeId: uid(4),  titleAr: 'اجتماع لجنة الموارد البشرية',    titleEn: 'HR Committee Meeting',          descriptionAr: 'مناقشة سياسات التوظيف وتقييم الأداء', descriptionEn: 'Discuss recruitment policies and performance evaluation', type: 'in_person', startDateTimeUtc: pastDate(3, 10),   endDateTimeUtc: pastDate(3, 12),   status: 'completed', location: 'قاعة الاجتماعات 1', onlinePlatform: null, onlineJoinUrl: null, recordingUrl: null, meetingRoomId: uid(701), meetingRoom: DEMO_MEETING_ROOMS.items[1] },
    { id: uid(14), committeeId: uid(6),  titleAr: 'اجتماع لجنة تقنية المعلومات',    titleEn: 'IT Committee Monthly',          descriptionAr: 'المتابعة الشهرية لمشاريع تقنية المعلومات', descriptionEn: 'Monthly follow-up on IT projects', type: 'online',    startDateTimeUtc: pastDate(10, 9),   endDateTimeUtc: pastDate(10, 11),  status: 'completed', location: null, onlinePlatform: 'teams', onlineJoinUrl: 'https://teams.microsoft.com/l/meetup-join/demo-it', recordingUrl: 'https://web.microsoftstream.com/video/demo-it-recording', meetingRoomId: null, meetingRoom: null },
    { id: uid(15), committeeId: uid(1),  titleAr: 'اجتماع الميزانية الطارئ',         titleEn: 'Emergency Budget Meeting',      descriptionAr: 'اجتماع طارئ لمناقشة تعديلات الميزانية', descriptionEn: 'Emergency meeting to discuss budget amendments', type: 'in_person', startDateTimeUtc: pastDate(1, 14),   endDateTimeUtc: pastDate(1, 15),   status: 'completed', location: 'مكتب العميد', onlinePlatform: null, onlineJoinUrl: null, recordingUrl: null, meetingRoomId: uid(704), meetingRoom: DEMO_MEETING_ROOMS.items[4] },
  ],
};

/* ---- Committee Members (keyed by committee ID) ---- */
export const DEMO_COMMITTEE_MEMBERS: Record<string, Array<{ id: string; displayName: string; email: string; role: string }>> = {
  [uid(1)]: [
    { id: uid(800), displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'head' },
    { id: uid(801), displayName: 'أ. فاطمة العتيبي',  email: 'f.otaibi@uoh.edu.sa',   role: 'secretary' },
    { id: uid(802), displayName: 'د. خالد المالكي',   email: 'k.malki@uoh.edu.sa',    role: 'member' },
    { id: uid(803), displayName: 'د. نورة القحطاني',  email: 'n.qahtani@uoh.edu.sa',  role: 'member' },
  ],
  [uid(2)]: [
    { id: uid(804), displayName: 'د. سارة الدوسري',   email: 's.dosari@uoh.edu.sa',   role: 'head' },
    { id: uid(805), displayName: 'أ. محمد الحربي',    email: 'm.harbi@uoh.edu.sa',    role: 'secretary' },
    { id: uid(806), displayName: 'د. عبدالله الغامدي', email: 'a.ghamdi@uoh.edu.sa',   role: 'member' },
  ],
  [uid(3)]: [
    { id: uid(807), displayName: 'د. خالد المالكي',   email: 'k.malki@uoh.edu.sa',    role: 'head' },
    { id: uid(808), displayName: 'أ. فاطمة العتيبي',  email: 'f.otaibi@uoh.edu.sa',   role: 'member' },
  ],
  [uid(6)]: [
    { id: uid(809), displayName: 'د. نورة القحطاني',  email: 'n.qahtani@uoh.edu.sa',  role: 'head' },
    { id: uid(810), displayName: 'أ. محمد الحربي',    email: 'm.harbi@uoh.edu.sa',    role: 'secretary' },
    { id: uid(811), displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'member' },
  ],
};

/* ---- MOM data (keyed by meeting ID) ---- */
export const DEMO_MOMS: Record<string, { id: string; meetingId: string; status: string; createdAtUtc: string }> = {
  [uid(13)]: { id: uid(300), meetingId: uid(13), status: 'approved', createdAtUtc: pastDate(2, 10) },
  [uid(15)]: { id: uid(301), meetingId: uid(15), status: 'draft', createdAtUtc: pastDate(0, 9) },
};

/* ---- MOM Agenda Minutes (keyed by MOM ID) ---- */
export const DEMO_AGENDA_MINUTES: Record<string, Array<{ agendaItemTitle: string; notesAr: string; notesEn: string }>> = {
  [uid(300)]: [
    { agendaItemTitle: 'New recruitment policy', notesAr: 'تمت مناقشة سياسة التوظيف الجديدة والموافقة عليها بالإجماع', notesEn: 'New recruitment policy was discussed and unanimously approved' },
    { agendaItemTitle: 'Employee performance evaluation', notesAr: 'تم استعراض نتائج تقييم أداء الموظفين للربع الأول', notesEn: 'Q1 employee performance evaluation results were reviewed' },
    { agendaItemTitle: 'Training plan', notesAr: 'تم اعتماد خطة التدريب السنوية مع تعديلات طفيفة', notesEn: 'Annual training plan approved with minor modifications' },
  ],
};

/* ---- MOM Recommendations (keyed by MOM ID) ---- */
export const DEMO_RECOMMENDATIONS: Record<string, Array<{ id: string; textAr: string; textEn: string; assignedTo: string; dueDate: string; priority: string; status: string }>> = {
  [uid(300)]: [
    { id: uid(310), textAr: 'إعداد خطة تنفيذية لسياسة التوظيف الجديدة', textEn: 'Prepare implementation plan for new recruitment policy', assignedTo: 'أ. فاطمة العتيبي', dueDate: futureDate(14), priority: 'high', status: 'in_progress' },
    { id: uid(311), textAr: 'متابعة تحسين أداء الموظفين المتأخرين', textEn: 'Follow up on underperforming employees improvement', assignedTo: 'د. خالد المالكي', dueDate: futureDate(21), priority: 'medium', status: 'pending' },
    { id: uid(312), textAr: 'تنسيق ورش العمل التدريبية مع الجهات المعتمدة', textEn: 'Coordinate training workshops with certified providers', assignedTo: 'أ. محمد الحربي', dueDate: futureDate(30), priority: 'low', status: 'pending' },
  ],
};

/* ---- Meeting Agenda Items (keyed by meeting ID) ---- */
export const DEMO_MEETING_AGENDA: Record<string, Array<{ titleAr: string; titleEn: string; descriptionAr?: string; descriptionEn?: string; duration?: number; presenterName?: string }>> = {
  [uid(10)]: [
    { titleAr: 'اعتماد محضر الاجتماع السابق',   titleEn: 'Approve previous meeting minutes', descriptionAr: 'مراجعة واعتماد محضر الاجتماع الماضي', descriptionEn: 'Review and approve last meeting minutes', duration: 10, presenterName: 'أ. فاطمة العتيبي' },
    { titleAr: 'مستجدات الخطة الاستراتيجية',     titleEn: 'Strategic plan updates', descriptionAr: 'عرض آخر المستجدات في تنفيذ الخطة', descriptionEn: 'Present latest updates on plan execution', duration: 30, presenterName: 'د. أحمد الشمري' },
    { titleAr: 'الميزانية التشغيلية',             titleEn: 'Operational budget review', descriptionAr: 'مراجعة الميزانية التشغيلية للربع الحالي', descriptionEn: 'Review operational budget for current quarter', duration: 20, presenterName: 'د. خالد المالكي' },
    { titleAr: 'ما يستجد من أعمال',              titleEn: 'Any other business', duration: 15 },
  ],
  [uid(11)]: [
    { titleAr: 'مراجعة الخطط الأكاديمية',        titleEn: 'Review academic plans', descriptionAr: 'مراجعة الخطط الدراسية للفصل القادم', descriptionEn: 'Review study plans for next semester', duration: 25, presenterName: 'د. سارة الدوسري' },
    { titleAr: 'اعتماد المقررات الجديدة',         titleEn: 'Approve new courses', descriptionAr: 'عرض واعتماد المقررات المقترحة', descriptionEn: 'Present and approve proposed courses', duration: 20, presenterName: 'د. عبدالله الغامدي' },
    { titleAr: 'تقرير الاعتماد الأكاديمي',        titleEn: 'Accreditation report', descriptionAr: 'تقديم تقرير التقدم في ملف الاعتماد', descriptionEn: 'Present progress report on accreditation file', duration: 30, presenterName: 'أ. محمد الحربي' },
  ],
  [uid(13)]: [
    { titleAr: 'سياسة التوظيف الجديدة',          titleEn: 'New recruitment policy', descriptionAr: 'مناقشة السياسة الجديدة للتوظيف', descriptionEn: 'Discuss the new recruitment policy', duration: 20, presenterName: 'د. خالد المالكي' },
    { titleAr: 'تقييم أداء الموظفين',             titleEn: 'Employee performance evaluation', descriptionAr: 'استعراض نتائج تقييم الأداء السنوي', descriptionEn: 'Review annual performance evaluation results', duration: 25, presenterName: 'أ. فاطمة العتيبي' },
    { titleAr: 'خطة التدريب',                    titleEn: 'Training plan', descriptionAr: 'عرض خطة التدريب للفصل القادم', descriptionEn: 'Present training plan for next semester', duration: 15, presenterName: 'د. نورة القحطاني' },
  ],
};

/* ---- Meeting Invitees (keyed by meeting ID) ---- */
export const DEMO_MEETING_INVITEES: Record<string, Array<{ displayName: string; email: string; role: string }>> = {
  [uid(10)]: [
    { displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'chair' },
    { displayName: 'أ. فاطمة العتيبي',  email: 'f.otaibi@uoh.edu.sa',   role: 'secretary' },
    { displayName: 'د. خالد المالكي',   email: 'k.malki@uoh.edu.sa',    role: 'attendee' },
    { displayName: 'د. نورة القحطاني',  email: 'n.qahtani@uoh.edu.sa',  role: 'attendee' },
    { displayName: 'د. سارة الدوسري',   email: 's.dosari@uoh.edu.sa',   role: 'attendee' },
  ],
  [uid(11)]: [
    { displayName: 'د. سارة الدوسري',   email: 's.dosari@uoh.edu.sa',   role: 'chair' },
    { displayName: 'أ. محمد الحربي',    email: 'm.harbi@uoh.edu.sa',    role: 'secretary' },
    { displayName: 'د. عبدالله الغامدي', email: 'a.ghamdi@uoh.edu.sa',   role: 'attendee' },
  ],
  [uid(13)]: [
    { displayName: 'د. خالد المالكي',   email: 'k.malki@uoh.edu.sa',    role: 'chair' },
    { displayName: 'أ. فاطمة العتيبي',  email: 'f.otaibi@uoh.edu.sa',   role: 'secretary' },
    { displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'attendee' },
    { displayName: 'د. نورة القحطاني',  email: 'n.qahtani@uoh.edu.sa',  role: 'attendee' },
  ],
  [uid(14)]: [
    { displayName: 'د. نورة القحطاني',  email: 'n.qahtani@uoh.edu.sa',  role: 'chair' },
    { displayName: 'أ. محمد الحربي',    email: 'm.harbi@uoh.edu.sa',    role: 'secretary' },
    { displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'attendee' },
  ],
  [uid(15)]: [
    { displayName: 'د. أحمد الشمري',   email: 'a.shamri@uoh.edu.sa',   role: 'chair' },
    { displayName: 'أ. فاطمة العتيبي',  email: 'f.otaibi@uoh.edu.sa',   role: 'attendee' },
  ],
};

/* ---- Tasks ---- */
export const DEMO_TASKS = {
  items: [
    {
      id: uid(20), titleAr: 'إعداد تقرير الاعتماد الأكاديمي', titleEn: 'Prepare accreditation report', dueDateUtc: futureDate(10), priority: 'high', status: 'in_progress', progress: 65,
      subTasks: [
        { id: uid(200), title: 'Collect department data', status: 'completed', dueDateUtc: pastDate(3), progress: 100 },
        { id: uid(201), title: 'Draft report sections', status: 'in_progress', dueDateUtc: futureDate(5), progress: 60 },
        { id: uid(202), title: 'Review and finalize', status: 'pending', dueDateUtc: futureDate(9), progress: 0 },
      ],
    },
    { id: uid(21), titleAr: 'مراجعة ميزانية الربع الثاني', titleEn: 'Review Q2 budget', dueDateUtc: futureDate(5), priority: 'critical', status: 'pending', progress: 0, subTasks: [] },
    {
      id: uid(22), titleAr: 'تحديث سياسة الموارد البشرية', titleEn: 'Update HR policy document', dueDateUtc: pastDate(2), priority: 'medium', status: 'overdue', progress: 30,
      subTasks: [
        { id: uid(203), title: 'Review current policy', status: 'completed', dueDateUtc: pastDate(10), progress: 100 },
        { id: uid(204), title: 'Draft amendments', status: 'in_progress', dueDateUtc: pastDate(1), progress: 40 },
        { id: uid(205), title: 'Get legal approval', status: 'pending', dueDateUtc: futureDate(3), progress: 0 },
      ],
    },
    {
      id: uid(23), titleAr: 'متابعة قرارات المجلس', titleEn: 'Follow up on council decisions', dueDateUtc: futureDate(15), priority: 'medium', status: 'in_progress', progress: 45,
      subTasks: [
        { id: uid(206), title: 'List pending decisions', status: 'completed', dueDateUtc: pastDate(5), progress: 100 },
        { id: uid(207), title: 'Contact responsible parties', status: 'in_progress', dueDateUtc: futureDate(7), progress: 50 },
        { id: uid(208), title: 'Compile status report', status: 'pending', dueDateUtc: futureDate(14), progress: 0 },
      ],
    },
    { id: uid(24), titleAr: 'إعداد خطة التدريب السنوية', titleEn: 'Prepare annual training plan', dueDateUtc: pastDate(5), priority: 'high', status: 'completed', progress: 100, subTasks: [] },
    { id: uid(25), titleAr: 'تقييم أداء الموظفين', titleEn: 'Employee performance evaluation', dueDateUtc: futureDate(20), priority: 'low', status: 'pending', progress: 0, subTasks: [] },
    {
      id: uid(26), titleAr: 'ترقية البنية التحتية لتقنية المعلومات', titleEn: 'IT infrastructure upgrade', dueDateUtc: futureDate(30), priority: 'high', status: 'in_progress', progress: 20,
      subTasks: [
        { id: uid(209), title: 'Audit current infrastructure', status: 'completed', dueDateUtc: pastDate(7), progress: 100 },
        { id: uid(210), title: 'Procure new equipment', status: 'in_progress', dueDateUtc: futureDate(10), progress: 30 },
        { id: uid(211), title: 'Install and configure', status: 'pending', dueDateUtc: futureDate(25), progress: 0 },
        { id: uid(212), title: 'Testing and validation', status: 'pending', dueDateUtc: futureDate(28), progress: 0 },
      ],
    },
    {
      id: uid(27), titleAr: 'إعداد تقرير الحضور الشهري', titleEn: 'Monthly attendance report', dueDateUtc: futureDate(3), priority: 'medium', status: 'in_progress', progress: 80,
      subTasks: [
        { id: uid(213), title: 'Extract attendance data', status: 'completed', dueDateUtc: pastDate(2), progress: 100 },
        { id: uid(214), title: 'Generate report', status: 'in_progress', dueDateUtc: futureDate(1), progress: 70 },
      ],
    },
  ],
};

/* ---- Votes ---- */
export const DEMO_VOTES: Record<string, Array<{ id: string; meetingId: string; title: string; status: string }>> = {
  [uid(13)]: [
    { id: uid(30), meetingId: uid(13), title: 'اعتماد محضر الاجتماع السابق',  status: 'closed' },
    { id: uid(31), meetingId: uid(13), title: 'الموافقة على سياسة العمل عن بُعد', status: 'closed' },
  ],
  [uid(14)]: [
    { id: uid(32), meetingId: uid(14), title: 'ترقية الخوادم الرئيسية',        status: 'open' },
  ],
};

/* ---- Surveys ---- */
export const DEMO_SURVEYS = {
  items: [
    { id: uid(40), titleAr: 'استبيان رضا الموظفين',       titleEn: 'Employee Satisfaction Survey',  type: 'general', targetAudience: 'staff',  status: 'active', startAtUtc: '2026-01-15T08:00:00Z', endAtUtc: '2026-04-15T08:00:00Z', allowLuckyDraw: true, responseCount: 47, questionCount: 5 },
    { id: uid(41), titleAr: 'استطلاع تقييم الخدمات',       titleEn: 'Service Evaluation Poll',       type: 'poll',    targetAudience: 'public', status: 'active', startAtUtc: '2026-02-01T10:00:00Z', endAtUtc: '2026-05-01T10:00:00Z', allowLuckyDraw: false, responseCount: 23, questionCount: 3 },
    { id: uid(42), titleAr: 'استبيان جودة التعليم',        titleEn: 'Education Quality Survey',      type: 'general', targetAudience: 'staff',  status: 'closed', startAtUtc: '2025-12-01T09:00:00Z', endAtUtc: '2026-01-01T09:00:00Z', allowLuckyDraw: true, responseCount: 85, questionCount: 8 },
    { id: uid(43), titleAr: 'استطلاع اختيار موعد الفعالية', titleEn: 'Event Date Poll',               type: 'poll',    targetAudience: 'staff',  status: 'draft',  startAtUtc: '2026-03-01T07:00:00Z', endAtUtc: '2026-03-15T07:00:00Z', allowLuckyDraw: false, responseCount: 0, questionCount: 2 },
  ],
};

/* ---- Attachments ---- */
export const DEMO_ATTACHMENTS = [
  { id: uid(50), domain: 'meeting', entityId: uid(13), storedFileId: uid(150), title: 'تقرير_الاعتماد_2026.pdf' },
  { id: uid(51), domain: 'mom',     entityId: uid(13), storedFileId: uid(151), title: 'محضر_اجتماع_المجلس_مارس.docx' },
  { id: uid(52), domain: 'meeting', entityId: uid(14), storedFileId: uid(152), title: 'الميزانية_السنوية.xlsx' },
  { id: uid(53), domain: 'committee', entityId: uid(1), storedFileId: uid(153), title: 'عرض_التخطيط_الاستراتيجي.pptx' },
  { id: uid(54), domain: 'committee', entityId: uid(1), storedFileId: uid(154), title: 'قرار_تشكيل_مجلس_الجامعة.pdf' },
  { id: uid(55), domain: 'committee', entityId: uid(2), storedFileId: uid(155), title: 'لائحة_لجنة_الشؤون_الأكاديمية.pdf' },
  { id: uid(56), domain: 'committee', entityId: uid(6), storedFileId: uid(156), title: 'خطة_تقنية_المعلومات_2026.docx' },
];

/* ---- Committee KPIs (keyed by committee ID) ---- */
export const DEMO_COMMITTEE_KPIS: Record<string, { meetingsCount: number; decisionsCount: number; tasksCompletedCount: number; attendanceRate: number }> = {
  [uid(1)]: { meetingsCount: 8, decisionsCount: 24, tasksCompletedCount: 15, attendanceRate: 92 },
  [uid(2)]: { meetingsCount: 6, decisionsCount: 18, tasksCompletedCount: 12, attendanceRate: 88 },
  [uid(3)]: { meetingsCount: 3, decisionsCount: 8, tasksCompletedCount: 5, attendanceRate: 95 },
  [uid(4)]: { meetingsCount: 4, decisionsCount: 10, tasksCompletedCount: 8, attendanceRate: 85 },
  [uid(6)]: { meetingsCount: 5, decisionsCount: 14, tasksCompletedCount: 11, attendanceRate: 90 },
  [uid(8)]: { meetingsCount: 2, decisionsCount: 6, tasksCompletedCount: 4, attendanceRate: 100 },
  [uid(9)]: { meetingsCount: 3, decisionsCount: 9, tasksCompletedCount: 7, attendanceRate: 86 },
};

/* ---- Committee-Meeting links ---- */
export const DEMO_COMMITTEE_MEETINGS: Record<string, Array<{ id: string; titleAr: string; titleEn: string; startDateTimeUtc: string; status: string }>> = {
  [uid(1)]: [
    { id: uid(10), titleAr: 'الاجتماع الأسبوعي للمجلس', titleEn: 'Weekly Council Meeting', startDateTimeUtc: futureDate(2, 10), status: 'scheduled' },
    { id: uid(15), titleAr: 'اجتماع الميزانية الطارئ', titleEn: 'Emergency Budget Meeting', startDateTimeUtc: pastDate(1, 14), status: 'completed' },
  ],
  [uid(2)]: [
    { id: uid(11), titleAr: 'اجتماع لجنة الشؤون الأكاديمية', titleEn: 'Academic Affairs Meeting', startDateTimeUtc: futureDate(5, 9), status: 'scheduled' },
  ],
  [uid(4)]: [
    { id: uid(13), titleAr: 'اجتماع لجنة الموارد البشرية', titleEn: 'HR Committee Meeting', startDateTimeUtc: pastDate(3, 10), status: 'completed' },
  ],
  [uid(6)]: [
    { id: uid(14), titleAr: 'اجتماع لجنة تقنية المعلومات', titleEn: 'IT Committee Monthly', startDateTimeUtc: pastDate(10, 9), status: 'completed' },
  ],
};

/* ---- Committee-Task links ---- */
export const DEMO_COMMITTEE_TASKS: Record<string, Array<{ id: string; titleAr: string; titleEn: string; dueDateUtc: string; status: string; priority: string; progress: number }>> = {
  [uid(1)]: [
    { id: uid(23), titleAr: 'متابعة قرارات المجلس', titleEn: 'Follow up on council decisions', dueDateUtc: futureDate(15), status: 'in_progress', priority: 'medium', progress: 45 },
  ],
  [uid(2)]: [
    { id: uid(20), titleAr: 'إعداد تقرير الاعتماد الأكاديمي', titleEn: 'Prepare accreditation report', dueDateUtc: futureDate(10), status: 'in_progress', priority: 'high', progress: 65 },
  ],
  [uid(4)]: [
    { id: uid(22), titleAr: 'تحديث سياسة الموارد البشرية', titleEn: 'Update HR policy document', dueDateUtc: pastDate(2), status: 'overdue', priority: 'medium', progress: 30 },
    { id: uid(25), titleAr: 'تقييم أداء الموظفين', titleEn: 'Employee performance evaluation', dueDateUtc: futureDate(20), status: 'pending', priority: 'low', progress: 0 },
  ],
  [uid(6)]: [
    { id: uid(26), titleAr: 'ترقية البنية التحتية لتقنية المعلومات', titleEn: 'IT infrastructure upgrade', dueDateUtc: futureDate(30), status: 'in_progress', priority: 'high', progress: 20 },
  ],
};

/* ---- Workflow templates ---- */
export const DEMO_WORKFLOW_TEMPLATES = [
  {
    id: uid(60),
    name: 'اعتماد محضر اجتماع',
    domain: 'MOM',
    definitionJson: JSON.stringify({
      initialState: 'Draft',
      transitions: [
        { from: 'Draft', to: 'PendingApproval', action: 'Submit', requiredRole: 'CommitteeSecretary' },
        { from: 'PendingApproval', to: 'Approved', action: 'Approve', requiredRole: 'CommitteeHead' },
        { from: 'PendingApproval', to: 'Draft', action: 'Reject', requiredRole: 'CommitteeHead' },
      ],
    }, null, 2),
  },
  {
    id: uid(61),
    name: 'اعتماد لجنة جديدة',
    domain: 'Committee',
    definitionJson: JSON.stringify({
      initialState: 'Draft',
      transitions: [
        { from: 'Draft', to: 'PendingApproval', action: 'Submit', requiredRole: 'CommitteeSecretary' },
        { from: 'PendingApproval', to: 'Active', action: 'Approve', requiredRole: 'SystemAdmin' },
        { from: 'PendingApproval', to: 'Draft', action: 'Reject', requiredRole: 'SystemAdmin' },
        { from: 'Active', to: 'Suspended', action: 'Suspend', requiredRole: 'SystemAdmin' },
        { from: 'Suspended', to: 'Active', action: 'Reactivate', requiredRole: 'SystemAdmin' },
        { from: 'Active', to: 'Closed', action: 'Close', requiredRole: 'SystemAdmin' },
      ],
    }, null, 2),
  },
];

/* ---- Dashboard stats ---- */
export const DEMO_DASHBOARD_STATS = {
  totalCommittees: 9,
  activeCommittees: 7,
  totalMeetings: 24,
  meetingsThisMonth: 4,
  meetingsLastMonth: 6,
  pendingTasks: 5,
  overdueTasks: 1,
  activeSurveys: 2,
  meetingAttendanceRate: 87,
  taskCompletionRate: 72,
  liveMeetingsNow: 1,
  upcomingMeetingsCount: 3,
  upcomingMeetings: [
    { id: uid(10), titleAr: 'الاجتماع الأسبوعي للمجلس',       titleEn: 'Weekly Council Meeting',    startDateTimeUtc: futureDate(2, 10), status: 'scheduled' },
    { id: uid(11), titleAr: 'اجتماع لجنة الشؤون الأكاديمية',  titleEn: 'Academic Affairs Meeting',  startDateTimeUtc: futureDate(5, 9),  status: 'scheduled' },
    { id: uid(12), titleAr: 'ورشة التخطيط الاستراتيجي',        titleEn: 'Strategic Planning Workshop', startDateTimeUtc: futureDate(7, 14), status: 'draft' },
  ],
  recentActivity: [
    { occurredAtUtc: pastDate(0, 9),  userDisplayName: 'أحمد محمد',   httpMethod: 'POST', path: '/api/v1/meetings',       statusCode: 201 },
    { occurredAtUtc: pastDate(0, 8),  userDisplayName: 'سارة أحمد',   httpMethod: 'PUT',  path: '/api/v1/tasks/' + uid(20), statusCode: 200 },
    { occurredAtUtc: pastDate(1, 14), userDisplayName: 'خالد عبدالله', httpMethod: 'POST', path: '/api/v1/committees',     statusCode: 201 },
    { occurredAtUtc: pastDate(1, 11), userDisplayName: 'نورة سعد',    httpMethod: 'GET',  path: '/api/v1/reports/committee-activity', statusCode: 200 },
    { occurredAtUtc: pastDate(2, 10), userDisplayName: 'أحمد محمد',   httpMethod: 'POST', path: '/api/v1/votes',          statusCode: 201 },
  ],
  meetingsByMonth: [
    { month: 'Oct', count: 5 },
    { month: 'Nov', count: 8 },
    { month: 'Dec', count: 3 },
    { month: 'Jan', count: 6 },
    { month: 'Feb', count: 7 },
    { month: 'Mar', count: 4 },
  ],
  taskStatusBreakdown: [
    { label: 'Pending',    count: 2 },
    { label: 'InProgress', count: 4 },
    { label: 'Completed',  count: 1 },
    { label: 'Overdue',    count: 1 },
  ],
  committeeTypeBreakdown: [
    { label: 'council',          count: 1 },
    { label: 'permanent',        count: 2 },
    { label: 'temporary',        count: 2 },
    { label: 'main',             count: 1 },
    { label: 'sub',              count: 1 },
    { label: 'self_managed',     count: 1 },
    { label: 'cross_functional', count: 1 },
  ],
  taskPriorityBreakdown: [
    { label: 'High',   count: 3 },
    { label: 'Medium', count: 4 },
    { label: 'Low',    count: 1 },
  ],
  assigneeWorkload: [
    { displayName: 'أحمد محمد',   total: 12, completed: 9, overdue: 1, completionRate: 75 },
    { displayName: 'سارة أحمد',   total: 8,  completed: 7, overdue: 0, completionRate: 87.5 },
    { displayName: 'خالد عبدالله', total: 10, completed: 6, overdue: 2, completionRate: 60 },
    { displayName: 'نورة سعد',    total: 6,  completed: 5, overdue: 0, completionRate: 83.3 },
  ],
};

/* ---- Reports ---- */
export const DEMO_COMMITTEE_ACTIVITY_REPORT = {
  rows: [
    { committeeId: uid(1), nameAr: 'مجلس الجامعة',          nameEn: 'University Council',           meetingsCount: 8, decisionsCount: 24, tasksCompletedCount: 15 },
    { committeeId: uid(2), nameAr: 'لجنة الشؤون الأكاديمية', nameEn: 'Academic Affairs Committee',   meetingsCount: 6, decisionsCount: 18, tasksCompletedCount: 12 },
    { committeeId: uid(4), nameAr: 'لجنة الموارد البشرية',   nameEn: 'HR Committee',                 meetingsCount: 4, decisionsCount: 10, tasksCompletedCount: 8 },
    { committeeId: uid(6), nameAr: 'لجنة تقنية المعلومات',   nameEn: 'IT Committee',                 meetingsCount: 5, decisionsCount: 14, tasksCompletedCount: 11 },
  ],
  totalMeetings: 23,
  totalDecisions: 66,
  totalTasksCompleted: 46,
};

export const DEMO_MEETING_ATTENDANCE_REPORT = {
  rows: [
    { meetingId: uid(13), titleAr: 'اجتماع لجنة الموارد البشرية', titleEn: 'HR Committee Meeting',    startDateTimeUtc: pastDate(3),  totalInvited: 8, totalPresent: 7, attendanceRate: 88 },
    { meetingId: uid(14), titleAr: 'اجتماع لجنة تقنية المعلومات', titleEn: 'IT Committee Monthly',    startDateTimeUtc: pastDate(10), totalInvited: 6, totalPresent: 5, attendanceRate: 83 },
    { meetingId: uid(15), titleAr: 'اجتماع الميزانية الطارئ',      titleEn: 'Emergency Budget Meeting', startDateTimeUtc: pastDate(1),  totalInvited: 10, totalPresent: 9, attendanceRate: 90 },
  ],
  overallAttendanceRate: 87,
};

export const DEMO_TASK_PERFORMANCE_REPORT = {
  rows: [
    { assignedToDisplayName: 'أحمد محمد',   totalTasks: 12, completed: 9, overdue: 1, completionRate: 75 },
    { assignedToDisplayName: 'سارة أحمد',   totalTasks: 8,  completed: 7, overdue: 0, completionRate: 88 },
    { assignedToDisplayName: 'خالد عبدالله', totalTasks: 10, completed: 6, overdue: 2, completionRate: 60 },
    { assignedToDisplayName: 'نورة سعد',    totalTasks: 6,  completed: 5, overdue: 0, completionRate: 83 },
  ],
  overallCompletionRate: 72,
  totalOverdue: 3,
};

/* ---- Live Survey Sessions ---- */
export const DEMO_LIVE_SESSIONS = [
  {
    id: uid(70),
    surveyId: uid(40),
    joinCode: 'ABC123',
    presenterKey: 'demo-presenter-key-01',
    status: 'Active',
    currentQuestionIndex: 0,
    participantCount: 12,
    acceptingVotes: true,
    createdByObjectId: 'demo-admin',
    createdAtUtc: pastDate(0, 8),
    startedAtUtc: pastDate(0, 8),
    completedAtUtc: null,
    survey: {
      id: uid(40),
      titleAr: 'استبيان رضا الموظفين',
      titleEn: 'Employee Satisfaction Survey',
      questions: [
        { id: uid(80), order: 1, type: 'single', textAr: 'ما مدى رضاك عن بيئة العمل؟', textEn: 'How satisfied are you with the work environment?', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] },
        { id: uid(81), order: 2, type: 'single', textAr: 'هل توصي بالعمل في الجامعة؟', textEn: 'Would you recommend working at the university?', options: ['Yes', 'Maybe', 'No'] },
      ],
    },
  },
  {
    id: uid(71),
    surveyId: uid(41),
    joinCode: 'XYZ789',
    presenterKey: 'demo-presenter-key-02',
    status: 'Completed',
    currentQuestionIndex: 1,
    participantCount: 25,
    acceptingVotes: false,
    createdByObjectId: 'demo-admin',
    createdAtUtc: pastDate(2, 10),
    startedAtUtc: pastDate(2, 10),
    completedAtUtc: pastDate(2, 11),
  },
];

/* ---- Notifications ---- */
export const DEMO_NOTIFICATIONS = [
  {
    id: uid(90),
    type: 'MeetingPublished',
    titleAr: 'تم نشر اجتماع: الاجتماع الدوري للمجلس',
    titleEn: 'Meeting published: Regular Council Meeting',
    entityType: 'Meeting',
    entityId: uid(10),
    actionUrl: '/meetings',
    isRead: false,
    createdAtUtc: pastDate(0, 9),
  },
  {
    id: uid(91),
    type: 'VoteOpened',
    titleAr: 'تم فتح التصويت: اعتماد الخطة السنوية',
    titleEn: 'Voting opened: Approve Annual Plan',
    entityType: 'VoteSession',
    entityId: uid(30),
    actionUrl: '/votes',
    isRead: false,
    createdAtUtc: pastDate(0, 8),
  },
  {
    id: uid(92),
    type: 'SurveyActivated',
    titleAr: 'استبيان جديد: استبيان رضا الموظفين',
    titleEn: 'New survey: Employee Satisfaction Survey',
    entityType: 'Survey',
    entityId: uid(40),
    actionUrl: '/surveys',
    isRead: false,
    createdAtUtc: pastDate(1, 14),
  },
  {
    id: uid(93),
    type: 'MomApproved',
    titleAr: 'تم اعتماد محضر الاجتماع',
    titleEn: 'Meeting minutes approved',
    entityType: 'Mom',
    entityId: uid(20),
    actionUrl: '/moms',
    isRead: true,
    createdAtUtc: pastDate(2, 11),
  },
  {
    id: uid(94),
    type: 'CommitteeMemberAdded',
    titleAr: 'تمت إضافتك إلى لجنة: لجنة الشؤون الأكاديمية',
    titleEn: 'Added to committee: Academic Affairs Committee',
    entityType: 'Committee',
    entityId: uid(2),
    actionUrl: '/committees',
    isRead: true,
    createdAtUtc: pastDate(3, 10),
  },
  {
    id: uid(95),
    type: 'MeetingCancelled',
    titleAr: 'تم إلغاء اجتماع: اجتماع لجنة الميزانية',
    titleEn: 'Meeting cancelled: Budget Committee Meeting',
    entityType: 'Meeting',
    entityId: uid(14),
    actionUrl: '/meetings',
    isRead: true,
    createdAtUtc: pastDate(5, 15),
  },
];

/* ---- Chat Conversations ---- */
export const DEMO_CHAT_CONTACTS = [
  { userObjectId: 'demo-admin',     displayName: 'مدير النظام',    email: 'admin@uoh.edu.sa' },
  { userObjectId: 'demo-head',      displayName: 'رئيس اللجنة',    email: 'head@uoh.edu.sa' },
  { userObjectId: 'demo-secretary', displayName: 'أمين اللجنة',    email: 'secretary@uoh.edu.sa' },
  { userObjectId: 'demo-member',    displayName: 'عضو لجنة',       email: 'member@uoh.edu.sa' },
  { userObjectId: 'demo-observer',  displayName: 'مراقب',          email: 'observer@uoh.edu.sa' },
];

export const DEMO_CHAT_CONVERSATIONS = [
  {
    id: uid(100),
    type: 'direct',
    nameAr: null,
    nameEn: null,
    createdAtUtc: pastDate(5, 9),
    lastMessageAtUtc: pastDate(0, 11),
    participants: [
      { userObjectId: 'demo-admin', displayName: 'مدير النظام', email: 'admin@uoh.edu.sa' },
      { userObjectId: 'demo-head',  displayName: 'رئيس اللجنة', email: 'head@uoh.edu.sa' },
    ],
    unreadCount: 2,
    lastMessage: { content: 'هل تم اعتماد محضر الاجتماع الأخير؟', senderDisplayName: 'رئيس اللجنة', type: 'text', createdAtUtc: pastDate(0, 11) },
  },
  {
    id: uid(101),
    type: 'direct',
    nameAr: null,
    nameEn: null,
    createdAtUtc: pastDate(3, 14),
    lastMessageAtUtc: pastDate(0, 15),
    participants: [
      { userObjectId: 'demo-admin',     displayName: 'مدير النظام', email: 'admin@uoh.edu.sa' },
      { userObjectId: 'demo-secretary', displayName: 'أمين اللجنة', email: 'secretary@uoh.edu.sa' },
    ],
    unreadCount: 0,
    lastMessage: { content: 'تم رفع المرفقات المطلوبة', senderDisplayName: 'أمين اللجنة', type: 'text', createdAtUtc: pastDate(0, 15) },
  },
  {
    id: uid(102),
    type: 'group',
    nameAr: 'مجموعة لجنة تقنية المعلومات',
    nameEn: 'IT Committee Group',
    createdAtUtc: pastDate(10, 8),
    lastMessageAtUtc: pastDate(1, 9),
    participants: [
      { userObjectId: 'demo-admin',     displayName: 'مدير النظام', email: 'admin@uoh.edu.sa' },
      { userObjectId: 'demo-head',      displayName: 'رئيس اللجنة', email: 'head@uoh.edu.sa' },
      { userObjectId: 'demo-secretary', displayName: 'أمين اللجنة', email: 'secretary@uoh.edu.sa' },
      { userObjectId: 'demo-member',    displayName: 'عضو لجنة',   email: 'member@uoh.edu.sa' },
    ],
    unreadCount: 1,
    lastMessage: { content: 'تم تحديث جدول أعمال الاجتماع القادم', senderDisplayName: 'أمين اللجنة', type: 'text', createdAtUtc: pastDate(1, 9) },
  },
];

export const DEMO_CHAT_MESSAGES: Record<string, Array<{ id: string; conversationId: string; senderObjectId: string; senderDisplayName: string; content: string; type: string; createdAtUtc: string; attachments: unknown[] }>> = {
  [uid(100)]: [
    { id: uid(200), conversationId: uid(100), senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: 'السلام عليكم، هل لديك وقت لمناقشة خطة العمل؟', type: 'text', createdAtUtc: pastDate(2, 9), attachments: [] },
    { id: uid(201), conversationId: uid(100), senderObjectId: 'demo-head', senderDisplayName: 'رئيس اللجنة', content: 'وعليكم السلام، نعم متاح بعد صلاة الظهر', type: 'text', createdAtUtc: pastDate(2, 10), attachments: [] },
    { id: uid(202), conversationId: uid(100), senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: 'ممتاز، سأرسل لك الملفات المطلوبة قبل الاجتماع', type: 'text', createdAtUtc: pastDate(2, 11), attachments: [] },
    { id: uid(203), conversationId: uid(100), senderObjectId: 'demo-head', senderDisplayName: 'رئيس اللجنة', content: 'تمام، أيضًا أريد مناقشة قرارات الاجتماع السابق', type: 'text', createdAtUtc: pastDate(1, 8), attachments: [] },
    { id: uid(204), conversationId: uid(100), senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: 'بالتأكيد، سأجهز قائمة بالقرارات المعلقة', type: 'text', createdAtUtc: pastDate(1, 9), attachments: [] },
    { id: uid(205), conversationId: uid(100), senderObjectId: 'demo-head', senderDisplayName: 'رئيس اللجنة', content: 'هل تم اعتماد محضر الاجتماع الأخير؟', type: 'text', createdAtUtc: pastDate(0, 11), attachments: [] },
  ],
  [uid(101)]: [
    { id: uid(210), conversationId: uid(101), senderObjectId: 'demo-secretary', senderDisplayName: 'أمين اللجنة', content: 'مرحبًا، أرسلت لك ملف المحضر للمراجعة', type: 'text', createdAtUtc: pastDate(1, 10), attachments: [] },
    { id: uid(211), conversationId: uid(101), senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: 'شكرًا، سأراجعه اليوم', type: 'text', createdAtUtc: pastDate(1, 11), attachments: [] },
    { id: uid(212), conversationId: uid(101), senderObjectId: 'demo-secretary', senderDisplayName: 'أمين اللجنة', content: 'تم رفع المرفقات المطلوبة', type: 'file', createdAtUtc: pastDate(0, 15), attachments: [{ id: uid(260), storedFileId: uid(150), fileName: 'تقرير_الاعتماد_2026.pdf', contentType: 'application/pdf', sizeBytes: 2458624 }] },
  ],
  [uid(102)]: [
    { id: uid(220), conversationId: uid(102), senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: 'أهلاً بالجميع، الاجتماع القادم يوم الثلاثاء', type: 'text', createdAtUtc: pastDate(3, 8), attachments: [] },
    { id: uid(221), conversationId: uid(102), senderObjectId: 'demo-member', senderDisplayName: 'عضو لجنة', content: 'هل يمكن تأجيله ليوم الأربعاء؟', type: 'text', createdAtUtc: pastDate(3, 9), attachments: [] },
    { id: uid(222), conversationId: uid(102), senderObjectId: 'demo-head', senderDisplayName: 'رئيس اللجنة', content: 'أوافق على التأجيل إذا كان الجميع متاح', type: 'text', createdAtUtc: pastDate(2, 10), attachments: [] },
    { id: uid(223), conversationId: uid(102), senderObjectId: 'demo-secretary', senderDisplayName: 'أمين اللجنة', content: 'تم تحديث جدول أعمال الاجتماع القادم', type: 'text', createdAtUtc: pastDate(1, 9), attachments: [] },
  ],
};

export const DEMO_USER_ATTACHMENTS = [
  { id: uid(250), storedFileId: uid(150), fileName: 'تقرير_الاعتماد_2026.pdf', contentType: 'application/pdf', sizeBytes: 2458624, message: { senderDisplayName: 'أمين اللجنة', conversationId: uid(101), createdAtUtc: pastDate(1, 10) } },
  { id: uid(251), storedFileId: uid(151), fileName: 'محضر_اجتماع_المجلس.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 524288, message: { senderDisplayName: 'مدير النظام', conversationId: uid(100), createdAtUtc: pastDate(3, 11) } },
  { id: uid(252), storedFileId: uid(152), fileName: 'الميزانية_السنوية.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeBytes: 1048576, message: { senderDisplayName: 'رئيس اللجنة', conversationId: uid(102), createdAtUtc: pastDate(5, 14) } },
];

/* ---- Admin identity ---- */
export const DEMO_IDENTITY = {
  id: 'demo-admin',
  displayName: 'مدير النظام',
  email: 'admin@uoh.edu.sa',
  roles: ['SystemAdmin'],
};

/* ---- Directives ---- */
export const DEMO_DIRECTIVES = {
  items: [
    { id: uid(400), titleAr: 'توجيه بشأن تطوير البرامج الأكاديمية', titleEn: 'Directive on Academic Programs Development', descriptionAr: 'توجيه رسمي لتطوير وتحديث البرامج الأكاديمية بما يتوافق مع رؤية 2030', descriptionEn: 'Official directive to develop and update academic programs aligned with Vision 2030', issuedBy: 'معالي مدير الجامعة', referenceNumber: 'DIR-2026-001', issueDateUtc: '2026-01-15T08:00:00Z', status: 'Active', createdAtUtc: '2026-01-15T08:00:00Z' },
    { id: uid(401), titleAr: 'توجيه بشأن التحول الرقمي', titleEn: 'Digital Transformation Directive', descriptionAr: 'تسريع التحول الرقمي في جميع القطاعات الجامعية', descriptionEn: 'Accelerate digital transformation across all university sectors', issuedBy: 'وكيل الجامعة', referenceNumber: 'DIR-2026-002', issueDateUtc: '2026-02-01T10:00:00Z', status: 'Active', createdAtUtc: '2026-02-01T10:00:00Z' },
    { id: uid(402), titleAr: 'توجيه بشأن سياسات الموارد البشرية', titleEn: 'HR Policies Directive', descriptionAr: 'مراجعة وتحديث جميع سياسات الموارد البشرية', descriptionEn: 'Review and update all HR policies', issuedBy: 'مدير الموارد البشرية', referenceNumber: 'DIR-2026-003', issueDateUtc: '2026-02-20T09:00:00Z', status: 'Draft', createdAtUtc: '2026-02-20T09:00:00Z' },
  ],
};

export const DEMO_DIRECTIVE_DECISIONS: Record<string, Array<{ id: string; directiveId: string; titleAr: string; titleEn: string; notesAr: string; notesEn: string; status: string; committeeId: string | null }>> = {
  [uid(400)]: [
    { id: uid(410), directiveId: uid(400), titleAr: 'تحديث المناهج الدراسية', titleEn: 'Update curricula', notesAr: 'تحديث جميع المناهج الدراسية وفق المعايير الدولية', notesEn: 'Update all curricula according to international standards', status: 'Approved', committeeId: uid(2) },
    { id: uid(411), directiveId: uid(400), titleAr: 'استحداث برامج دراسات عليا', titleEn: 'Establish postgraduate programs', notesAr: 'دراسة استحداث برامج ماجستير جديدة', notesEn: 'Study establishment of new master programs', status: 'PendingApproval', committeeId: uid(2) },
  ],
  [uid(401)]: [
    { id: uid(412), directiveId: uid(401), titleAr: 'رقمنة جميع الإجراءات الإدارية', titleEn: 'Digitize all admin processes', notesAr: 'تحويل جميع المعاملات الورقية إلى إلكترونية', notesEn: 'Convert all paper transactions to electronic', status: 'Implemented', committeeId: uid(6) },
    { id: uid(413), directiveId: uid(401), titleAr: 'إطلاق بوابة الخدمات الإلكترونية', titleEn: 'Launch e-services portal', notesAr: 'تطوير وإطلاق بوابة موحدة للخدمات الإلكترونية', notesEn: 'Develop and launch unified e-services portal', status: 'Draft', committeeId: uid(9) },
  ],
};

/* ---- Evaluation Templates ---- */
export const DEMO_EVALUATION_TEMPLATES = [
  {
    id: uid(500), nameAr: 'قالب تقييم اللجان الدائمة', nameEn: 'Permanent Committee Evaluation Template', descriptionAr: 'قالب شامل لتقييم أداء اللجان الدائمة', descriptionEn: 'Comprehensive template for evaluating permanent committees', maxScore: 100, isActive: true, createdAtUtc: '2026-01-01T08:00:00Z',
    criteria: [
      { id: uid(510), labelAr: 'انتظام الاجتماعات', labelEn: 'Meeting regularity', maxScore: 20, weight: 20, sortOrder: 1 },
      { id: uid(511), labelAr: 'تحقيق الأهداف', labelEn: 'Goal achievement', maxScore: 30, weight: 30, sortOrder: 2 },
      { id: uid(512), labelAr: 'جودة القرارات', labelEn: 'Decision quality', maxScore: 25, weight: 25, sortOrder: 3 },
      { id: uid(513), labelAr: 'نسبة الحضور', labelEn: 'Attendance rate', maxScore: 15, weight: 15, sortOrder: 4 },
      { id: uid(514), labelAr: 'التوثيق والأرشفة', labelEn: 'Documentation & archiving', maxScore: 10, weight: 10, sortOrder: 5 },
    ],
  },
  {
    id: uid(501), nameAr: 'قالب تقييم سريع', nameEn: 'Quick Evaluation Template', descriptionAr: 'قالب مختصر للتقييم السريع', descriptionEn: 'Brief template for quick evaluation', maxScore: 50, isActive: true, createdAtUtc: '2026-02-01T08:00:00Z',
    criteria: [
      { id: uid(515), labelAr: 'الفعالية العامة', labelEn: 'Overall effectiveness', maxScore: 25, weight: 50, sortOrder: 1 },
      { id: uid(516), labelAr: 'الالتزام بالمواعيد', labelEn: 'Timeliness', maxScore: 25, weight: 50, sortOrder: 2 },
    ],
  },
];

/* ---- Committee Evaluations ---- */
export const DEMO_COMMITTEE_EVALUATIONS = {
  items: [
    { id: uid(520), committeeId: uid(1), committeeName: 'مجلس الجامعة', templateId: uid(500), templateName: 'قالب تقييم اللجان الدائمة', evaluatorDisplayName: 'د. أحمد الشمري', status: 'Completed', periodStart: '2025-07-01', periodEnd: '2025-12-31', totalScore: 82, maxPossibleScore: 100, scorePercentage: 82, createdAtUtc: '2026-01-10T08:00:00Z' },
    { id: uid(521), committeeId: uid(2), committeeName: 'لجنة الشؤون الأكاديمية', templateId: uid(500), templateName: 'قالب تقييم اللجان الدائمة', evaluatorDisplayName: 'د. سارة الدوسري', status: 'InProgress', periodStart: '2026-01-01', periodEnd: '2026-06-30', totalScore: 0, maxPossibleScore: 100, scorePercentage: 0, createdAtUtc: '2026-02-15T10:00:00Z' },
    { id: uid(522), committeeId: uid(6), committeeName: 'لجنة تقنية المعلومات', templateId: uid(501), templateName: 'قالب تقييم سريع', evaluatorDisplayName: 'د. نورة القحطاني', status: 'Completed', periodStart: '2025-10-01', periodEnd: '2026-03-31', totalScore: 42, maxPossibleScore: 50, scorePercentage: 84, createdAtUtc: '2026-03-01T09:00:00Z' },
  ],
};

/* ---- Change Requests ---- */
export const DEMO_CHANGE_REQUESTS = {
  items: [
    { id: uid(550), committeeId: uid(4), committeeNameAr: 'لجنة الموارد البشرية', committeeNameEn: 'HR Committee', requesterDisplayName: 'أ. فاطمة العتيبي', reasonAr: 'طلب إضافة عضوين جدد من قسم التدريب', reasonEn: 'Request to add two new members from Training department', status: 'Pending', createdAtUtc: '2026-03-01T08:00:00Z', reviewedAtUtc: null },
    { id: uid(551), committeeId: uid(1), committeeNameAr: 'مجلس الجامعة', committeeNameEn: 'University Council', requesterDisplayName: 'د. أحمد الشمري', reasonAr: 'تغيير أمين اللجنة بسبب الانتقال الوظيفي', reasonEn: 'Change committee secretary due to job transfer', status: 'Approved', createdAtUtc: '2026-02-15T10:00:00Z', reviewedAtUtc: '2026-02-20T14:00:00Z' },
    { id: uid(552), committeeId: uid(6), committeeNameAr: 'لجنة تقنية المعلومات', committeeNameEn: 'IT Committee', requesterDisplayName: 'أ. محمد الحربي', reasonAr: 'طلب تمديد فترة عمل اللجنة لمدة 6 أشهر', reasonEn: 'Request to extend committee term by 6 months', status: 'Rejected', createdAtUtc: '2026-02-01T09:00:00Z', reviewedAtUtc: '2026-02-10T11:00:00Z' },
  ],
};

/* ---- Roles & Permissions ---- */
const DEMO_ROLES = [
  { id: uid(700), key: 'SystemAdmin', nameAr: 'مدير النظام', nameEn: 'System Admin', descriptionAr: 'صلاحيات كاملة للنظام', descriptionEn: 'Full system access', isSystem: true, isActive: true, createdAtUtc: '2025-01-01T00:00:00Z' },
  { id: uid(701), key: 'CommitteeHead', nameAr: 'رئيس اللجنة', nameEn: 'Committee Head', descriptionAr: 'إدارة اللجنة واتخاذ القرارات', descriptionEn: 'Manage committee and make decisions', isSystem: true, isActive: true, createdAtUtc: '2025-01-01T00:00:00Z' },
  { id: uid(702), key: 'CommitteeSecretary', nameAr: 'أمين اللجنة', nameEn: 'Committee Secretary', descriptionAr: 'تنظيم الاجتماعات وتوثيق المحاضر', descriptionEn: 'Organize meetings and record minutes', isSystem: true, isActive: true, createdAtUtc: '2025-01-01T00:00:00Z' },
  { id: uid(703), key: 'CommitteeMember', nameAr: 'عضو لجنة', nameEn: 'Committee Member', descriptionAr: 'المشاركة في الاجتماعات والتصويت', descriptionEn: 'Participate in meetings and vote', isSystem: true, isActive: true, createdAtUtc: '2025-01-01T00:00:00Z' },
  { id: uid(704), key: 'Observer', nameAr: 'مراقب', nameEn: 'Observer', descriptionAr: 'عرض المعلومات فقط بدون صلاحيات تعديل', descriptionEn: 'View-only access without edit permissions', isSystem: false, isActive: true, createdAtUtc: '2025-06-15T08:00:00Z' },
  { id: uid(705), key: 'Auditor', nameAr: 'مدقق', nameEn: 'Auditor', descriptionAr: 'مراجعة التقارير والمحاضر', descriptionEn: 'Review reports and minutes', isSystem: false, isActive: true, createdAtUtc: '2025-09-01T10:00:00Z' },
];

const DEMO_PERMISSIONS_GROUPED: Record<string, Array<{ id: string; key: string; category: string; nameAr: string; nameEn: string; route?: string; sortOrder: number }>> = {
  committees: [
    { id: uid(800), key: 'committees.view', category: 'committees', nameAr: 'عرض اللجان', nameEn: 'View Committees', route: '/committees', sortOrder: 1 },
    { id: uid(801), key: 'committees.create', category: 'committees', nameAr: 'إنشاء لجنة', nameEn: 'Create Committee', sortOrder: 2 },
    { id: uid(802), key: 'committees.edit', category: 'committees', nameAr: 'تعديل اللجان', nameEn: 'Edit Committees', sortOrder: 3 },
    { id: uid(803), key: 'committees.delete', category: 'committees', nameAr: 'حذف اللجان', nameEn: 'Delete Committees', sortOrder: 4 },
    { id: uid(804), key: 'committees.members', category: 'committees', nameAr: 'إدارة الأعضاء', nameEn: 'Manage Members', sortOrder: 5 },
  ],
  meetings: [
    { id: uid(810), key: 'meetings.view', category: 'meetings', nameAr: 'عرض الاجتماعات', nameEn: 'View Meetings', route: '/meetings', sortOrder: 1 },
    { id: uid(811), key: 'meetings.create', category: 'meetings', nameAr: 'إنشاء اجتماع', nameEn: 'Create Meeting', sortOrder: 2 },
    { id: uid(812), key: 'meetings.edit', category: 'meetings', nameAr: 'تعديل الاجتماعات', nameEn: 'Edit Meetings', sortOrder: 3 },
    { id: uid(813), key: 'meetings.approve', category: 'meetings', nameAr: 'اعتماد الاجتماعات', nameEn: 'Approve Meetings', sortOrder: 4 },
  ],
  tasks: [
    { id: uid(820), key: 'tasks.view', category: 'tasks', nameAr: 'عرض المهام', nameEn: 'View Tasks', route: '/tasks', sortOrder: 1 },
    { id: uid(821), key: 'tasks.create', category: 'tasks', nameAr: 'إنشاء مهمة', nameEn: 'Create Task', sortOrder: 2 },
    { id: uid(822), key: 'tasks.edit', category: 'tasks', nameAr: 'تعديل المهام', nameEn: 'Edit Tasks', sortOrder: 3 },
    { id: uid(823), key: 'tasks.assign', category: 'tasks', nameAr: 'تعيين المهام', nameEn: 'Assign Tasks', sortOrder: 4 },
  ],
  admin: [
    { id: uid(830), key: 'admin.view', category: 'admin', nameAr: 'عرض الإدارة', nameEn: 'View Admin', route: '/admin', sortOrder: 1 },
    { id: uid(831), key: 'admin.users.view', category: 'admin', nameAr: 'عرض المستخدمين', nameEn: 'View Users', route: '/admin/users', sortOrder: 2 },
    { id: uid(832), key: 'admin.roles.view', category: 'admin', nameAr: 'عرض الأدوار', nameEn: 'View Roles', route: '/admin/roles', sortOrder: 3 },
    { id: uid(833), key: 'admin.permissions.view', category: 'admin', nameAr: 'عرض الصلاحيات', nameEn: 'View Permissions', sortOrder: 4 },
    { id: uid(834), key: 'admin.announcements.view', category: 'admin', nameAr: 'إدارة التعميمات', nameEn: 'Manage Announcements', route: '/admin/announcements', sortOrder: 5 },
  ],
  workflow: [
    { id: uid(840), key: 'workflow.view', category: 'workflow', nameAr: 'عرض سير العمل', nameEn: 'View Workflows', route: '/workflow', sortOrder: 1 },
    { id: uid(841), key: 'workflow.create', category: 'workflow', nameAr: 'إنشاء سير عمل', nameEn: 'Create Workflow', sortOrder: 2 },
    { id: uid(842), key: 'workflow.edit', category: 'workflow', nameAr: 'تعديل سير العمل', nameEn: 'Edit Workflows', sortOrder: 3 },
  ],
};

// Assign all permissions to SystemAdmin, subset to others
const DEMO_ROLE_PERMISSIONS: Record<string, Array<{ id: string; key: string; category: string; nameAr: string; nameEn: string; route?: string; sortOrder: number }>> = {
  [uid(700)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat(), // SystemAdmin gets all
  [uid(701)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat().filter(p => ['committees', 'meetings', 'tasks'].includes(p.category)),
  [uid(702)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat().filter(p => ['committees', 'meetings', 'tasks'].includes(p.category)),
  [uid(703)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat().filter(p => p.key.endsWith('.view') && ['committees', 'meetings', 'tasks'].includes(p.category)),
  [uid(704)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat().filter(p => p.key.endsWith('.view')),
  [uid(705)]: Object.values(DEMO_PERMISSIONS_GROUPED).flat().filter(p => p.key.endsWith('.view')),
};

/* ---- Dashboard Widgets & Layout ---- */

import type { WidgetDef, WidgetPlacement, UniversityRanking } from './dashboard/types';

export const DEMO_AVAILABLE_WIDGETS: WidgetDef[] = [
  { key: 'stat-committees', nameAr: 'إجمالي اللجان', nameEn: 'Total Committees', descriptionAr: 'عدد اللجان الكلي', descriptionEn: 'Total committees count', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconCommittees' },
  { key: 'stat-meetings', nameAr: 'الاجتماعات', nameEn: 'Meetings', descriptionAr: 'إجمالي الاجتماعات هذا الشهر', descriptionEn: 'Total meetings this month', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconMeetings' },
  { key: 'stat-tasks', nameAr: 'المهام المعلقة', nameEn: 'Pending Tasks', descriptionAr: 'المهام المعلقة والمتأخرة', descriptionEn: 'Pending and overdue tasks', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconTasks' },
  { key: 'stat-surveys', nameAr: 'الاستبيانات النشطة', nameEn: 'Active Surveys', descriptionAr: 'عدد الاستبيانات النشطة حاليًا', descriptionEn: 'Currently active surveys', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconSurveys' },
  { key: 'stat-live-meetings', nameAr: 'اجتماعات جارية الآن', nameEn: 'Live Meetings Now', descriptionAr: 'عدد الاجتماعات الجارية حاليًا', descriptionEn: 'Currently in-progress meetings', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconMeetings' },
  { key: 'stat-upcoming-count', nameAr: 'القادمة (7 أيام)', nameEn: 'Upcoming (7 days)', descriptionAr: 'عدد الاجتماعات المجدولة في الأيام السبعة القادمة', descriptionEn: 'Scheduled meetings in the next 7 days', category: 'Statistics', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconCalendar' },
  { key: 'chart-meetings-monthly', nameAr: 'الاجتماعات الشهرية', nameEn: 'Monthly Meetings', descriptionAr: 'رسم بياني للاجتماعات حسب الشهر', descriptionEn: 'Bar chart of meetings by month', category: 'Chart', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconChart' },
  { key: 'chart-task-status', nameAr: 'حالات المهام', nameEn: 'Task Status', descriptionAr: 'مخطط دائري لحالات المهام', descriptionEn: 'Pie chart of task statuses', category: 'Chart', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconChart' },
  { key: 'chart-committee-types', nameAr: 'أنواع اللجان', nameEn: 'Committee Types', descriptionAr: 'مخطط دائري لأنواع اللجان', descriptionEn: 'Pie chart of committee types', category: 'Chart', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconChart' },
  { key: 'upcoming-meetings', nameAr: 'الاجتماعات القادمة', nameEn: 'Upcoming Meetings', descriptionAr: 'قائمة الاجتماعات المقبلة', descriptionEn: 'List of upcoming meetings', category: 'Committee', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconCalendar' },
  { key: 'recent-activity', nameAr: 'النشاط الأخير', nameEn: 'Recent Activity', descriptionAr: 'آخر الأنشطة على المنصة', descriptionEn: 'Latest platform activities', category: 'Committee', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconActivity' },
  { key: 'attendance-rate', nameAr: 'نسبة الحضور', nameEn: 'Attendance Rate', descriptionAr: 'معدل حضور الاجتماعات', descriptionEn: 'Meeting attendance rate', category: 'Committee', defaultWidth: 2, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconUsers' },
  { key: 'completion-rate', nameAr: 'نسبة الإنجاز', nameEn: 'Completion Rate', descriptionAr: 'معدل إنجاز المهام', descriptionEn: 'Task completion rate', category: 'Committee', defaultWidth: 2, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconProgress' },
  { key: 'task-overview', nameAr: 'ملخص المهام', nameEn: 'Task Overview', descriptionAr: 'نظرة عامة على حالات المهام', descriptionEn: 'Overview of task statuses', category: 'Committee', defaultWidth: 2, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconTasks' },
  { key: 'external-kpi', nameAr: 'مؤشرات أداء خارجية', nameEn: 'External KPI', descriptionAr: 'عرض بيانات من API خارجي', descriptionEn: 'Display data from external API', category: 'External', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconExternalLink' },
  { key: 'university-rankings', nameAr: 'التصنيفات الجامعية', nameEn: 'University Rankings', descriptionAr: 'تصنيفات QS و THE و Shanghai', descriptionEn: 'QS, THE, and Shanghai rankings', category: 'Rankings', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconTrophy' },
  { key: 'custom-note', nameAr: 'مذكرة', nameEn: 'Note', descriptionAr: 'مذكرة نصية شخصية', descriptionEn: 'Personal text note', category: 'Custom', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconNote' },
  { key: 'custom-kpi', nameAr: 'مؤشر مخصص', nameEn: 'Custom KPI', descriptionAr: 'مؤشر أداء بقيمة مخصصة', descriptionEn: 'Custom KPI with user-entered value', category: 'Custom', defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, iconName: 'IconGauge' },
  { key: 'quick-links', nameAr: 'روابط سريعة', nameEn: 'Quick Links', descriptionAr: 'روابط مخصصة للوصول السريع', descriptionEn: 'Custom quick access links', category: 'Custom', defaultWidth: 1, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconLink' },
  { key: 'chart-task-priority', nameAr: 'أولوية المهام', nameEn: 'Task Priority', descriptionAr: 'مخطط دائري لأولوية المهام', descriptionEn: 'Pie chart of task priorities', category: 'Chart', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconChart' },
  { key: 'assignee-workload', nameAr: 'حِمل العمل', nameEn: 'Assignee Workload', descriptionAr: 'توزيع المهام حسب المكلّف', descriptionEn: 'Task distribution per assignee', category: 'Chart', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 2, iconName: 'IconUsers' },
  { key: 'announcements-board', nameAr: 'لوحة التعميمات والأخبار', nameEn: 'Announcements Board', descriptionAr: 'آخر التعميمات والأخبار والإعلانات', descriptionEn: 'Latest circulars, news, and announcements', category: 'Committee', defaultWidth: 2, defaultHeight: 2, minWidth: 1, minHeight: 1, iconName: 'IconAnnouncement' },
];

export const DEMO_DEFAULT_LAYOUT: WidgetPlacement[] = [
  { id: 'stat-committees-1', widgetKey: 'stat-committees', x: 0, y: 0, w: 1, h: 1 },
  { id: 'stat-meetings-1', widgetKey: 'stat-meetings', x: 1, y: 0, w: 1, h: 1 },
  { id: 'stat-tasks-1', widgetKey: 'stat-tasks', x: 2, y: 0, w: 1, h: 1 },
  { id: 'stat-surveys-1', widgetKey: 'stat-surveys', x: 3, y: 0, w: 1, h: 1 },
  { id: 'stat-live-meetings-1', widgetKey: 'stat-live-meetings', x: 0, y: 1, w: 1, h: 1 },
  { id: 'stat-upcoming-count-1', widgetKey: 'stat-upcoming-count', x: 1, y: 1, w: 1, h: 1 },
  { id: 'chart-meetings-monthly-1', widgetKey: 'chart-meetings-monthly', x: 0, y: 2, w: 2, h: 2 },
  { id: 'chart-task-status-1', widgetKey: 'chart-task-status', x: 2, y: 1, w: 2, h: 2 },
  { id: 'upcoming-meetings-1', widgetKey: 'upcoming-meetings', x: 0, y: 3, w: 2, h: 2 },
  { id: 'recent-activity-1', widgetKey: 'recent-activity', x: 2, y: 3, w: 2, h: 2 },
  { id: 'attendance-rate-1', widgetKey: 'attendance-rate', x: 0, y: 5, w: 2, h: 1 },
  { id: 'completion-rate-1', widgetKey: 'completion-rate', x: 2, y: 5, w: 2, h: 1 },
  { id: 'university-rankings-1', widgetKey: 'university-rankings', x: 0, y: 6, w: 2, h: 2 },
  { id: 'chart-committee-types-1', widgetKey: 'chart-committee-types', x: 2, y: 6, w: 2, h: 2 },
  { id: 'chart-task-priority-1', widgetKey: 'chart-task-priority', x: 0, y: 8, w: 2, h: 2 },
  { id: 'assignee-workload-1', widgetKey: 'assignee-workload', x: 2, y: 8, w: 2, h: 2 },
];

export const DEMO_UNIVERSITY_RANKINGS: UniversityRanking[] = [
  { source: 'QS World University Rankings', rank: 601, previousRank: 650, year: 2025, change: 49 },
  { source: 'Times Higher Education (THE)', rank: 801, previousRank: 801, year: 2025, change: 0 },
  { source: 'Academic Ranking (Shanghai/ARWU)', rank: 901, previousRank: 0, year: 2025, change: 0 },
];

/* ---- Pending Approvals ---- */
export const DEMO_PENDING_APPROVALS = [
  { id: uid(900), type: 'meeting',        titleAr: 'اعتماد جدول اجتماع المجلس',         titleEn: 'Approve Council Meeting Agenda',          status: 'pending_approval', requestedAtUtc: pastDate(1, 9),  requestedBy: 'أ. فاطمة العتيبي' },
  { id: uid(901), type: 'mom',            titleAr: 'اعتماد محضر اجتماع الموارد البشرية', titleEn: 'Approve HR Committee Meeting Minutes',     status: 'pending_approval', requestedAtUtc: pastDate(2, 14), requestedBy: 'أ. محمد الحربي' },
  { id: uid(902), type: 'committee',      titleAr: 'اعتماد تشكيل لجنة الميزانية',        titleEn: 'Approve Budget Sub-committee Formation',  status: 'pending_approval', requestedAtUtc: pastDate(3, 11), requestedBy: 'د. خالد المالكي' },
  { id: uid(903), type: 'changeRequest',  titleAr: 'طلب تغيير عضوية لجنة تقنية المعلومات', titleEn: 'IT Committee Membership Change Request', status: 'pending_approval', requestedAtUtc: pastDate(0, 8),  requestedBy: 'د. نورة القحطاني' },
  { id: uid(904), type: 'mom',            titleAr: 'اعتماد محضر ورشة التخطيط الاستراتيجي', titleEn: 'Approve Strategic Planning Workshop Minutes', status: 'pending_approval', requestedAtUtc: pastDate(1, 16), requestedBy: 'أ. فاطمة العتيبي' },
];

/* ---- Announcements ---- */
export const DEMO_ANNOUNCEMENTS = {
  items: [
    {
      id: uid(1100), type: 'circular' as const, priority: 'important' as const, status: 'published' as const,
      titleAr: 'تعميم بشأن تحديث نظام الحضور الإلكتروني', titleEn: 'Circular: Electronic Attendance System Update',
      bodyAr: 'يسر إدارة الجامعة الإعلان عن تحديث نظام الحضور الإلكتروني. يرجى من جميع الموظفين تحديث بياناتهم في النظام الجديد قبل نهاية الشهر الحالي. يتضمن التحديث واجهة مستخدم جديدة وخاصية تسجيل الحضور عبر الهاتف المحمول.',
      bodyEn: 'The university administration is pleased to announce the update of the electronic attendance system. All employees are requested to update their information in the new system before the end of the current month. The update includes a new user interface and mobile check-in feature.',
      publishDate: pastDate(2), expiryDate: futureDate(30),
      targetAudience: 'all', targetRoles: [] as string[],
      showAsPopup: true, requireAcknowledgment: true,
      surveyId: null, attachments: [] as { id: string; fileName: string; sizeBytes: number }[],
      createdBy: 'مدير النظام', createdAtUtc: pastDate(3),
      acknowledgmentCount: 45, totalTargetUsers: 120,
    },
    {
      id: uid(1101), type: 'news' as const, priority: 'normal' as const, status: 'published' as const,
      titleAr: 'خبر: حصول الجامعة على اعتماد أكاديمي دولي', titleEn: 'News: University Receives International Accreditation',
      bodyAr: 'بفضل الله تعالى حصلت جامعة حائل على الاعتماد الأكاديمي الدولي من هيئة ABET لبرامج الهندسة والحاسب الآلي. يأتي هذا الإنجاز تتويجاً لجهود أعضاء هيئة التدريس والإدارة.',
      bodyEn: 'By the grace of God, the University of Hail has received international academic accreditation from ABET for its engineering and computer science programs. This achievement crowns the efforts of faculty members and administration.',
      publishDate: pastDate(5), expiryDate: futureDate(60),
      targetAudience: 'all', targetRoles: [] as string[],
      showAsPopup: false, requireAcknowledgment: false,
      surveyId: null, attachments: [] as { id: string; fileName: string; sizeBytes: number }[],
      createdBy: 'مدير النظام', createdAtUtc: pastDate(6),
      acknowledgmentCount: 0, totalTargetUsers: 120,
    },
    {
      id: uid(1102), type: 'announcement' as const, priority: 'urgent' as const, status: 'published' as const,
      titleAr: 'إعلان: فتح باب التقديم على برنامج الابتعاث', titleEn: 'Announcement: Scholarship Program Applications Open',
      bodyAr: 'يسر عمادة الدراسات العليا الإعلان عن فتح باب التقديم على برنامج الابتعاث الخارجي للعام الأكاديمي القادم. يشمل البرنامج تخصصات الذكاء الاصطناعي والأمن السيبراني وعلوم البيانات.',
      bodyEn: 'The Deanship of Graduate Studies is pleased to announce the opening of applications for the external scholarship program for the next academic year. The program covers AI, cybersecurity, and data science specializations.',
      publishDate: pastDate(1), expiryDate: futureDate(14),
      targetAudience: 'all', targetRoles: [] as string[],
      showAsPopup: true, requireAcknowledgment: true,
      surveyId: uid(40),
      attachments: [{ id: uid(1110), fileName: 'scholarship_guidelines.pdf', sizeBytes: 245000 }],
      createdBy: 'مدير النظام', createdAtUtc: pastDate(1),
      acknowledgmentCount: 12, totalTargetUsers: 120,
    },
    {
      id: uid(1103), type: 'circular' as const, priority: 'normal' as const, status: 'draft' as const,
      titleAr: 'تعميم: تحديث سياسة العمل عن بُعد', titleEn: 'Circular: Remote Work Policy Update',
      bodyAr: 'تود إدارة الموارد البشرية إبلاغكم بتحديث سياسة العمل عن بُعد المعتمدة اعتباراً من بداية الفصل الدراسي القادم.',
      bodyEn: 'The HR department would like to inform you about the remote work policy update effective from the beginning of next semester.',
      publishDate: futureDate(3), expiryDate: futureDate(45),
      targetAudience: 'specific_roles', targetRoles: ['SystemAdmin', 'CommitteeHead'],
      showAsPopup: false, requireAcknowledgment: false,
      surveyId: null, attachments: [] as { id: string; fileName: string; sizeBytes: number }[],
      createdBy: 'مدير النظام', createdAtUtc: pastDate(0),
      acknowledgmentCount: 0, totalTargetUsers: 15,
    },
    {
      id: uid(1104), type: 'news' as const, priority: 'normal' as const, status: 'archived' as const,
      titleAr: 'خبر: نتائج مسابقة البحث العلمي', titleEn: 'News: Research Competition Results',
      bodyAr: 'تم الإعلان عن نتائج مسابقة البحث العلمي المتميز لهذا العام. نبارك للفائزين ونشكر جميع المشاركين.',
      bodyEn: 'The results of this year outstanding research competition have been announced. We congratulate the winners and thank all participants.',
      publishDate: pastDate(30), expiryDate: pastDate(5),
      targetAudience: 'all', targetRoles: [] as string[],
      showAsPopup: false, requireAcknowledgment: false,
      surveyId: null, attachments: [] as { id: string; fileName: string; sizeBytes: number }[],
      createdBy: 'مدير النظام', createdAtUtc: pastDate(31),
      acknowledgmentCount: 0, totalTargetUsers: 120,
    },
  ],
  page: 1, pageSize: 20, total: 5,
};

export const DEMO_USER_ANNOUNCEMENTS = DEMO_ANNOUNCEMENTS.items
  .filter(a => a.status === 'published' || a.status === 'archived')
  .map(a => ({
    ...a,
    acknowledgedAtUtc: a.id === uid(1100) ? pastDate(1) : null,
    surveyResponseId: null,
  }));

export const DEMO_ANNOUNCEMENT_POPUP_QUEUE = DEMO_ANNOUNCEMENTS.items.filter(
  a => a.status === 'published' && a.showAsPopup && new Date(a.expiryDate) > new Date()
);

/* ---- Calendar Events (demo) ---- */
import type { CalendarEvent } from '../components/calendar/types';

export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: uid(950), titleAr: 'اجتماع مجلس الجامعة', titleEn: 'University Council Meeting', startDateTimeUtc: futureDate(1, 9), endDateTimeUtc: futureDate(1, 11), status: 'Scheduled', type: 'Regular', eventKind: 'meeting', committeeId: uid(1), committeeNameAr: 'مجلس الجامعة', committeeNameEn: 'University Council', location: 'Main Hall' },
  { id: uid(951), titleAr: 'اجتماع لجنة الجودة', titleEn: 'Quality Committee Meeting', startDateTimeUtc: futureDate(2, 10), endDateTimeUtc: futureDate(2, 12), status: 'Scheduled', type: 'Regular', eventKind: 'meeting', committeeId: uid(2), committeeNameAr: 'لجنة الجودة الأكاديمية', committeeNameEn: 'Academic Quality Committee', location: 'Room 203' },
  { id: uid(952), titleAr: 'ورشة التخطيط الاستراتيجي', titleEn: 'Strategic Planning Workshop', startDateTimeUtc: futureDate(3, 13), endDateTimeUtc: futureDate(3, 16), status: 'Scheduled', type: 'Workshop', eventKind: 'meeting', committeeId: uid(3), committeeNameAr: 'لجنة التخطيط الاستراتيجي', committeeNameEn: 'Strategic Planning Committee', location: null },
  { id: uid(953), titleAr: 'اجتماع طارئ - الموارد البشرية', titleEn: 'HR Emergency Meeting', startDateTimeUtc: futureDate(0, 14), endDateTimeUtc: futureDate(0, 15), status: 'InProgress', type: 'Emergency', eventKind: 'meeting', committeeId: uid(4), committeeNameAr: 'لجنة الموارد البشرية', committeeNameEn: 'HR Committee', location: 'Conference Room B' },
  { id: uid(954), titleAr: 'مراجعة الميزانية السنوية', titleEn: 'Annual Budget Review', startDateTimeUtc: futureDate(5, 9), endDateTimeUtc: futureDate(5, 12), status: 'Scheduled', type: 'Regular', eventKind: 'meeting', committeeId: uid(1), committeeNameAr: 'مجلس الجامعة', committeeNameEn: 'University Council', location: 'Main Hall' },
  { id: uid(955), titleAr: 'فترة عمل لجنة التخطيط', titleEn: 'Strategic Planning Committee Period', startDateTimeUtc: futureDate(0), endDateTimeUtc: futureDate(30), status: 'Scheduled', type: 'Period', eventKind: 'committee', committeeId: uid(3), committeeNameAr: 'لجنة التخطيط الاستراتيجي', committeeNameEn: 'Strategic Planning Committee', location: null },
  { id: uid(956), titleAr: 'اجتماع تقييم الأداء', titleEn: 'Performance Evaluation Meeting', startDateTimeUtc: futureDate(-2, 10), endDateTimeUtc: futureDate(-2, 12), status: 'Completed', type: 'Regular', eventKind: 'meeting', committeeId: uid(2), committeeNameAr: 'لجنة الجودة الأكاديمية', committeeNameEn: 'Academic Quality Committee', location: 'Room 105' },
  { id: uid(957), titleAr: 'اجتماع ملغى - تقنية المعلومات', titleEn: 'Cancelled IT Meeting', startDateTimeUtc: futureDate(4, 11), endDateTimeUtc: futureDate(4, 13), status: 'Cancelled', type: 'Regular', eventKind: 'meeting', committeeId: uid(5), committeeNameAr: 'لجنة تقنية المعلومات', committeeNameEn: 'IT Committee', location: null },
];

/* ---- Competitions ---- */
export const DEMO_COMPETITIONS = {
  items: [
    { id: uid(500), titleAr: 'مسابقة المعرفة الأكاديمية', titleEn: 'Academic Knowledge Quiz', descriptionAr: 'مسابقة معرفية في مختلف التخصصات الأكاديمية', descriptionEn: 'Knowledge quiz across various academic disciplines', type: 'quiz', status: 'completed', startDate: pastDate(30), endDate: pastDate(5), committeeId: uid(2), surveyId: null, maxParticipants: 100, participantsCount: 78, prizesAr: 'شهادات تقدير وجوائز مالية', prizesEn: 'Certificates and monetary prizes', rulesAr: 'يجب الإجابة على 50 سؤال خلال 60 دقيقة', rulesEn: 'Answer 50 questions within 60 minutes', createdBy: 'د. سارة الدوسري', createdAtUtc: pastDate(45) },
    { id: uid(501), titleAr: 'سحب استبيان رضا الموظفين', titleEn: 'Employee Satisfaction Survey Raffle', descriptionAr: 'سحب عشوائي على المشاركين في استبيان رضا الموظفين', descriptionEn: 'Random draw for employee satisfaction survey participants', type: 'raffle', status: 'completed', startDate: pastDate(20), endDate: pastDate(10), committeeId: uid(4), surveyId: uid(40), maxParticipants: null, participantsCount: 47, prizesAr: 'بطاقات هدايا بقيمة 500 ريال', prizesEn: 'Gift cards worth 500 SAR', rulesAr: 'يجب إكمال الاستبيان للمشاركة في السحب', rulesEn: 'Must complete the survey to participate', createdBy: 'أ. فاطمة العتيبي', createdAtUtc: pastDate(25) },
    { id: uid(502), titleAr: 'تحدي الابتكار الرقمي', titleEn: 'Digital Innovation Challenge', descriptionAr: 'تحدي لتقديم حلول رقمية مبتكرة لمشاكل الجامعة', descriptionEn: 'Challenge to provide innovative digital solutions for university problems', type: 'challenge', status: 'active', startDate: pastDate(10), endDate: futureDate(20), committeeId: uid(6), surveyId: null, maxParticipants: 50, participantsCount: 32, prizesAr: 'تمويل المشروع الفائز بمبلغ 50,000 ريال', prizesEn: 'Fund the winning project with 50,000 SAR', rulesAr: 'تقديم عرض مشروع مع نموذج أولي', rulesEn: 'Submit a project proposal with a prototype', createdBy: 'د. نورة القحطاني', createdAtUtc: pastDate(15) },
    { id: uid(503), titleAr: 'دوري كرة القدم بين الكليات', titleEn: 'Inter-College Football Tournament', descriptionAr: 'دوري كرة قدم بين كليات الجامعة', descriptionEn: 'Football tournament between university colleges', type: 'tournament', status: 'active', startDate: pastDate(7), endDate: futureDate(30), committeeId: uid(1), surveyId: null, maxParticipants: 200, participantsCount: 156, prizesAr: 'كأس البطولة وميداليات ذهبية', prizesEn: 'Championship trophy and gold medals', rulesAr: 'كل كلية تسجل فريق واحد من 11 لاعب', rulesEn: 'Each college registers one team of 11 players', createdBy: 'د. أحمد الشمري', createdAtUtc: pastDate(20) },
    { id: uid(504), titleAr: 'مسابقة البحث العلمي المتميز', titleEn: 'Outstanding Research Competition', descriptionAr: 'مسابقة لاختيار أفضل بحث علمي منشور', descriptionEn: 'Competition to select the best published research paper', type: 'challenge', status: 'judging', startDate: pastDate(60), endDate: pastDate(2), committeeId: uid(2), surveyId: null, maxParticipants: null, participantsCount: 23, prizesAr: 'جائزة مالية 30,000 ريال ودرع تكريمي', prizesEn: 'Monetary prize of 30,000 SAR and honorary shield', rulesAr: 'يجب أن يكون البحث منشوراً في مجلة محكمة', rulesEn: 'Research must be published in a peer-reviewed journal', createdBy: 'د. خالد المالكي', createdAtUtc: pastDate(70) },
    { id: uid(505), titleAr: 'مسابقة حفظ القرآن الكريم', titleEn: 'Quran Memorization Competition', descriptionAr: 'مسابقة في حفظ وتلاوة القرآن الكريم', descriptionEn: 'Competition in Quran memorization and recitation', type: 'quiz', status: 'registration', startDate: futureDate(5), endDate: futureDate(15), committeeId: uid(1), surveyId: null, maxParticipants: 60, participantsCount: 18, prizesAr: 'جوائز مالية وشهادات تقدير', prizesEn: 'Monetary prizes and certificates', rulesAr: 'يجب التسجيل قبل تاريخ البداية', rulesEn: 'Must register before start date', createdBy: 'د. أحمد الشمري', createdAtUtc: pastDate(3) },
  ],
};

export const DEMO_COMPETITION_WINNERS = [
  { id: uid(510), competitionId: uid(500), competitionTitle: 'Academic Knowledge Quiz', competitionTitleAr: 'مسابقة المعرفة الأكاديمية', competitionType: 'quiz', rank: 1, participantName: 'أحمد محمد العتيبي', participantEmail: 'ahmed.m@uoh.edu.sa', participantDepartment: 'كلية العلوم', score: 96, prize: 'جائزة مالية 5,000 ريال', wonAtUtc: pastDate(5) },
  { id: uid(511), competitionId: uid(500), competitionTitle: 'Academic Knowledge Quiz', competitionTitleAr: 'مسابقة المعرفة الأكاديمية', competitionType: 'quiz', rank: 2, participantName: 'فاطمة عبدالله الغامدي', participantEmail: 'fatima.g@uoh.edu.sa', participantDepartment: 'كلية الطب', score: 91, prize: 'جائزة مالية 3,000 ريال', wonAtUtc: pastDate(5) },
  { id: uid(512), competitionId: uid(500), competitionTitle: 'Academic Knowledge Quiz', competitionTitleAr: 'مسابقة المعرفة الأكاديمية', competitionType: 'quiz', rank: 3, participantName: 'خالد سعد الدوسري', participantEmail: 'khalid.d@uoh.edu.sa', participantDepartment: 'عمادة تقنية المعلومات', score: 88, prize: 'جائزة مالية 2,000 ريال', wonAtUtc: pastDate(5) },
  { id: uid(513), competitionId: uid(501), competitionTitle: 'Employee Satisfaction Survey Raffle', competitionTitleAr: 'سحب استبيان رضا الموظفين', competitionType: 'raffle', rank: 1, participantName: 'نورة حسن الشهري', participantEmail: 'noura.s@uoh.edu.sa', participantDepartment: 'كلية الهندسة', score: null, prize: 'بطاقة هدايا 500 ريال', wonAtUtc: pastDate(10) },
  { id: uid(514), competitionId: uid(501), competitionTitle: 'Employee Satisfaction Survey Raffle', competitionTitleAr: 'سحب استبيان رضا الموظفين', competitionType: 'raffle', rank: 2, participantName: 'محمد علي القحطاني', participantEmail: 'mohammed.q@uoh.edu.sa', participantDepartment: 'كلية إدارة الأعمال', score: null, prize: 'بطاقة هدايا 500 ريال', wonAtUtc: pastDate(10) },
  { id: uid(515), competitionId: uid(501), competitionTitle: 'Employee Satisfaction Survey Raffle', competitionTitleAr: 'سحب استبيان رضا الموظفين', competitionType: 'raffle', rank: 3, participantName: 'سارة أحمد المطيري', participantEmail: 'sara.m@uoh.edu.sa', participantDepartment: 'كلية العلوم', score: null, prize: 'بطاقة هدايا 500 ريال', wonAtUtc: pastDate(10) },
  { id: uid(516), competitionId: uid(504), competitionTitle: 'Outstanding Research Competition', competitionTitleAr: 'مسابقة البحث العلمي المتميز', competitionType: 'challenge', rank: 1, participantName: 'د. عبدالرحمن الحربي', participantEmail: 'a.harbi@uoh.edu.sa', participantDepartment: 'كلية العلوم', score: 95, prize: 'جائزة مالية 30,000 ريال', wonAtUtc: pastDate(2) },
  { id: uid(517), competitionId: uid(504), competitionTitle: 'Outstanding Research Competition', competitionTitleAr: 'مسابقة البحث العلمي المتميز', competitionType: 'challenge', rank: 2, participantName: 'د. منال الزهراني', participantEmail: 'm.zahrani@uoh.edu.sa', participantDepartment: 'كلية الطب', score: 92, prize: 'جائزة مالية 20,000 ريال', wonAtUtc: pastDate(2) },
  { id: uid(518), competitionId: uid(504), competitionTitle: 'Outstanding Research Competition', competitionTitleAr: 'مسابقة البحث العلمي المتميز', competitionType: 'challenge', rank: 3, participantName: 'د. سلطان العنزي', participantEmail: 's.anzi@uoh.edu.sa', participantDepartment: 'كلية الهندسة', score: 89, prize: 'جائزة مالية 10,000 ريال', wonAtUtc: pastDate(2) },
];

export const DEMO_LEADERBOARD = [
  { rank: 1, participantName: 'أحمد محمد العتيبي', participantEmail: 'ahmed.m@uoh.edu.sa', department: 'كلية العلوم', totalWins: 3, totalScore: 280, goldMedals: 2, silverMedals: 1, bronzeMedals: 0, competitions: 4 },
  { rank: 2, participantName: 'فاطمة عبدالله الغامدي', participantEmail: 'fatima.g@uoh.edu.sa', department: 'كلية الطب', totalWins: 2, totalScore: 245, goldMedals: 1, silverMedals: 1, bronzeMedals: 0, competitions: 3 },
  { rank: 3, participantName: 'د. عبدالرحمن الحربي', participantEmail: 'a.harbi@uoh.edu.sa', department: 'كلية العلوم', totalWins: 2, totalScore: 230, goldMedals: 1, silverMedals: 0, bronzeMedals: 1, competitions: 3 },
  { rank: 4, participantName: 'خالد سعد الدوسري', participantEmail: 'khalid.d@uoh.edu.sa', department: 'عمادة تقنية المعلومات', totalWins: 2, totalScore: 210, goldMedals: 0, silverMedals: 1, bronzeMedals: 1, competitions: 4 },
  { rank: 5, participantName: 'نورة حسن الشهري', participantEmail: 'noura.s@uoh.edu.sa', department: 'كلية الهندسة', totalWins: 1, totalScore: 180, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, competitions: 2 },
  { rank: 6, participantName: 'محمد علي القحطاني', participantEmail: 'mohammed.q@uoh.edu.sa', department: 'كلية إدارة الأعمال', totalWins: 1, totalScore: 165, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, competitions: 3 },
  { rank: 7, participantName: 'د. منال الزهراني', participantEmail: 'm.zahrani@uoh.edu.sa', department: 'كلية الطب', totalWins: 1, totalScore: 155, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, competitions: 2 },
  { rank: 8, participantName: 'سارة أحمد المطيري', participantEmail: 'sara.m@uoh.edu.sa', department: 'كلية العلوم', totalWins: 1, totalScore: 140, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, competitions: 2 },
  { rank: 9, participantName: 'د. سلطان العنزي', participantEmail: 's.anzi@uoh.edu.sa', department: 'كلية الهندسة', totalWins: 1, totalScore: 130, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, competitions: 2 },
  { rank: 10, participantName: 'عبدالله محمد الشمري', participantEmail: 'abd.shamri@uoh.edu.sa', department: 'كلية الحاسب', totalWins: 0, totalScore: 120, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, competitions: 3 },
];

/* ---- Route matcher ---- */
// Returns demo data for a given API path, or null if no match.
export function getDemoResponse(method: string, path: string): unknown | null {
  // Dashboard
  if (path.includes('/dashboard/stats'))       return DEMO_DASHBOARD_STATS;
  if (path.includes('/dashboard/widgets'))     return DEMO_AVAILABLE_WIDGETS;
  if (path.includes('/dashboard/layout/reset') && method === 'POST') return { success: true };
  if (path.includes('/dashboard/layout') && method === 'GET')
    return { layoutName: 'main', widgetsJson: JSON.stringify(DEMO_DEFAULT_LAYOUT), isDefault: true };
  if (path.includes('/dashboard/layout') && method === 'PUT') return { success: true };
  if (path.includes('/dashboard/rankings'))    return DEMO_UNIVERSITY_RANKINGS;
  if (path.includes('/dashboard/external-sources') && path.includes('/data'))
    return { value: 87.5, label: 'KPI', unit: '%' };
  if (path.includes('/dashboard/external-sources') && method === 'GET')
    return [];

  // Announcements
  if (path.includes('/announcements/popup-queue') && method === 'GET')
    return DEMO_ANNOUNCEMENT_POPUP_QUEUE;
  if (path.includes('/announcements/my-history') && method === 'GET')
    return { items: DEMO_USER_ANNOUNCEMENTS, total: DEMO_USER_ANNOUNCEMENTS.length, page: 1, pageSize: 20 };
  const announcementAckMatch = path.match(/\/announcements\/([0-9a-f-]+)\/acknowledge/);
  if (announcementAckMatch && method === 'POST')
    return { success: true, acknowledgedAtUtc: new Date().toISOString() };
  const announcementDetailMatch = path.match(/\/announcements\/([0-9a-f-]+)$/);
  if (announcementDetailMatch && method === 'GET')
    return DEMO_ANNOUNCEMENTS.items.find(a => a.id === announcementDetailMatch[1]) ?? null;
  if (path.includes('/announcements') && method === 'GET' && !path.includes('/announcements/'))
    return DEMO_ANNOUNCEMENTS;
  if (path.includes('/announcements') && method === 'POST')
    return { ...DEMO_ANNOUNCEMENTS.items[0], id: `demo-ann-${Date.now()}`, createdAtUtc: new Date().toISOString() };
  if (path.includes('/announcements') && method === 'PUT')
    return { success: true };
  if (path.includes('/announcements') && method === 'DELETE')
    return { success: true };

  // Pending Approvals
  if (path.includes('/approvals/pending') && method === 'GET')
    return DEMO_PENDING_APPROVALS;

  // Committees
  const committeeMembersMatch = path.match(/\/committees\/([^/]+)\/members/);
  if (committeeMembersMatch && method === 'GET')
    return DEMO_COMMITTEE_MEMBERS[committeeMembersMatch[1]] ?? [];
  // Single committee detail
  const committeeDetailMatch = path.match(/\/committees\/([0-9a-f-]+)$/);
  if (committeeDetailMatch && method === 'GET') {
    const found = DEMO_COMMITTEES.items.find(c => c.id === committeeDetailMatch[1]);
    if (found) {
      return {
        ...found,
        members: DEMO_COMMITTEE_MEMBERS[found.id] ?? [],
        objectivesAr: found.id === uid(1) ? 'إدارة شؤون الجامعة وتطوير الخطط الاستراتيجية والإشراف على تنفيذها' : found.id === uid(2) ? 'متابعة جودة البرامج الأكاديمية وتطوير المناهج والخطط الدراسية' : found.id === uid(3) ? 'وضع الخطة الاستراتيجية خمسية للجامعة ومتابعة تنفيذها' : '',
        objectivesEn: found.id === uid(1) ? 'Manage university affairs, develop strategic plans and oversee their implementation' : found.id === uid(2) ? 'Monitor academic program quality, develop curricula and study plans' : found.id === uid(3) ? 'Develop the university five-year strategic plan and monitor its implementation' : '',
      };
    }
    return null;
  }
  // Committee PATCH
  if (committeeDetailMatch && method === 'PATCH') {
    const found = DEMO_COMMITTEES.items.find(c => c.id === committeeDetailMatch[1]);
    return found ? { ...found, updatedAtUtc: new Date().toISOString() } : null;
  }
  if (path.includes('/committees') && method === 'GET' && !path.includes('/committees/'))
    return DEMO_COMMITTEES;

  // Meeting Rooms
  if (path.includes('/meeting-rooms') && method === 'GET' && !path.includes('/meeting-rooms/'))
    return DEMO_MEETING_ROOMS;
  const meetingRoomDetailMatch = path.match(/\/meeting-rooms\/([0-9a-f-]+)/);
  if (meetingRoomDetailMatch && method === 'GET')
    return DEMO_MEETING_ROOMS.items.find(r => r.id === meetingRoomDetailMatch[1]) ?? null;

  // Calendar
  if (path.includes('/meetings/calendar') && method === 'GET')
    return DEMO_CALENDAR_EVENTS;

  // Meetings
  const meetingAgendaMatch = path.match(/\/meetings\/([^/]+)\/agenda/);
  if (meetingAgendaMatch && method === 'GET')
    return DEMO_MEETING_AGENDA[meetingAgendaMatch[1]] ?? [];
  const meetingInviteesMatch = path.match(/\/meetings\/([^/]+)\/invitees/);
  if (meetingInviteesMatch && method === 'GET')
    return DEMO_MEETING_INVITEES[meetingInviteesMatch[1]] ?? [];
  // Single meeting detail
  const meetingDetailMatch = path.match(/\/meetings\/([0-9a-f-]+)$/);
  if (meetingDetailMatch && method === 'GET') {
    const m = DEMO_MEETINGS.items.find(i => i.id === meetingDetailMatch[1]);
    if (m) {
      const comm = DEMO_COMMITTEES.items.find(c => c.id === m.committeeId);
      return { ...m, committeeNameAr: comm?.nameAr ?? null, committeeNameEn: comm?.nameEn ?? null, agenda: DEMO_MEETING_AGENDA[m.id] ?? [], invitees: DEMO_MEETING_INVITEES[m.id] ?? [] };
    }
    return null;
  }
  if (path.includes('/meetings') && method === 'GET' && !path.includes('/meetings/'))
    return DEMO_MEETINGS;

  // MOMs
  const momByMeetingMatch = path.match(/\/moms\/by-meeting\/([0-9a-f-]+)/);
  if (momByMeetingMatch && method === 'GET')
    return DEMO_MOMS[momByMeetingMatch[1]] ?? null;
  if (momByMeetingMatch && method === 'POST')
    return DEMO_MOMS[momByMeetingMatch[1]] ?? { id: `demo-mom-${Date.now()}`, meetingId: momByMeetingMatch[1], status: 'draft', createdAtUtc: new Date().toISOString() };
  const momAgendaMinutesMatch = path.match(/\/moms\/([^/]+)\/agenda-minutes/);
  if (momAgendaMinutesMatch && method === 'GET')
    return DEMO_AGENDA_MINUTES[momAgendaMinutesMatch[1]] ?? [];
  const momRecommendationsMatch = path.match(/\/moms\/([^/]+)\/recommendations/);
  if (momRecommendationsMatch && method === 'GET')
    return DEMO_RECOMMENDATIONS[momRecommendationsMatch[1]] ?? [];

  // Tasks
  const taskDetailMatch = path.match(/\/tasks\/([0-9a-f-]+)$/);
  if (taskDetailMatch && method === 'GET') {
    return DEMO_TASKS.items.find(t => t.id === taskDetailMatch[1]) ?? null;
  }
  const subtaskProgressMatch = path.match(/\/tasks\/([0-9a-f-]+)\/subtasks\/([0-9a-f-]+)\/progress/);
  if (subtaskProgressMatch && method === 'PUT') {
    return { progress: 50, status: 'in_progress', subtaskProgress: 50, subtaskStatus: 'in_progress' };
  }
  if (path.includes('/tasks') && method === 'GET' && !path.includes('/tasks/'))
    return DEMO_TASKS;

  // Votes by meeting
  const voteMatch = path.match(/\/votes\/by-meeting\/(.+)/);
  if (voteMatch) return DEMO_VOTES[voteMatch[1]] ?? [];

  // Surveys
  if (path.includes('/surveys') && method === 'GET' && !path.includes('/surveys/'))
    return DEMO_SURVEYS;

  // Survey draw-winners (raffle)
  if (path.includes('/draw-winners') && method === 'POST') {
    const count = 1;
    const demoWinners = [
      { id: uid(600), respondentName: 'أحمد محمد العتيبي', respondentEmail: 'ahmed.m@uoh.edu.sa', employeeId: 'EMP-1042', department: 'كلية العلوم', submittedAtUtc: '2026-02-10T14:23:00Z' },
      { id: uid(601), respondentName: 'فاطمة عبدالله الغامدي', respondentEmail: 'fatima.g@uoh.edu.sa', employeeId: 'EMP-2087', department: 'كلية الطب', submittedAtUtc: '2026-02-12T09:15:00Z' },
      { id: uid(602), respondentName: 'خالد سعد الدوسري', respondentEmail: 'khalid.d@uoh.edu.sa', employeeId: 'EMP-3015', department: 'عمادة تقنية المعلومات', submittedAtUtc: '2026-02-14T16:45:00Z' },
      { id: uid(603), respondentName: 'نورة حسن الشهري', respondentEmail: 'noura.s@uoh.edu.sa', employeeId: 'EMP-1098', department: 'كلية الهندسة', submittedAtUtc: '2026-02-18T11:30:00Z' },
      { id: uid(604), respondentName: 'محمد علي القحطاني', respondentEmail: 'mohammed.q@uoh.edu.sa', employeeId: 'EMP-4023', department: 'كلية إدارة الأعمال', submittedAtUtc: '2026-02-20T08:00:00Z' },
    ];
    const selected = demoWinners.sort(() => Math.random() - 0.5).slice(0, Math.min(count, demoWinners.length));
    return { surveyId: 'demo', surveyTitleAr: 'استبيان رضا الموظفين', surveyTitleEn: 'Employee Satisfaction Survey', totalResponses: 47, winnersCount: selected.length, winners: selected, drawnAtUtc: new Date().toISOString() };
  }

  // Attachments
  if (path.includes('/attachments') && method === 'GET')
    return DEMO_ATTACHMENTS;

  // Workflow templates
  if (path.includes('/workflow') && method === 'GET')
    return DEMO_WORKFLOW_TEMPLATES;

  // Reports
  if (path.includes('/reports/committee-activity') && method === 'GET')
    return DEMO_COMMITTEE_ACTIVITY_REPORT;
  if (path.includes('/reports/meeting-attendance') && method === 'GET')
    return DEMO_MEETING_ATTENDANCE_REPORT;
  if (path.includes('/reports/task-performance') && method === 'GET')
    return DEMO_TASK_PERFORMANCE_REPORT;

  // Files (presign-upload / presign-download / download)
  if (path.includes('/presign-upload'))
    return { fileId: `demo-file-${Date.now()}`, url: '#demo-upload', headers: {} };
  if ((path.includes('/files/') && path.includes('/download')) || path.includes('/presign-download'))
    return { url: '#demo-download' };

  // Identity
  if (path.includes('/identity/me'))            return DEMO_IDENTITY;

  // Chat
  if (path.includes('/chat/conversations') && method === 'GET' && !path.includes('/messages'))
    return { page: 1, pageSize: 20, total: DEMO_CHAT_CONVERSATIONS.length, items: DEMO_CHAT_CONVERSATIONS };
  const chatMsgMatch = path.match(/\/chat\/conversations\/([^/]+)\/messages/);
  if (chatMsgMatch && method === 'GET') {
    const msgs = DEMO_CHAT_MESSAGES[chatMsgMatch[1]] ?? [];
    return { page: 1, pageSize: 30, total: msgs.length, items: msgs };
  }
  if (path.includes('/chat/unread-count') && method === 'GET')
    return { count: DEMO_CHAT_CONVERSATIONS.reduce((s, c) => s + c.unreadCount, 0) };
  if (path.includes('/chat/contacts') && method === 'GET')
    return DEMO_CHAT_CONTACTS;
  if (path.includes('/chat/search') && method === 'GET')
    return { page: 1, pageSize: 20, total: 0, items: [] };
  if (path.includes('/chat/my-attachments') && method === 'GET')
    return { page: 1, pageSize: 20, total: DEMO_USER_ATTACHMENTS.length, items: DEMO_USER_ATTACHMENTS };
  // Chat POST: create conversation
  if (path.includes('/chat/conversations') && method === 'POST' && !path.includes('/messages') && !path.includes('/read'))
    return { id: uid(900 + Math.random() * 100), type: 'direct', nameAr: null, nameEn: null, createdAtUtc: new Date().toISOString(), lastMessageAtUtc: new Date().toISOString(), participants: [], unreadCount: 0, lastMessage: null };
  // Chat POST: send message
  if (chatMsgMatch && method === 'POST')
    return { id: uid(900 + Math.random() * 100), conversationId: chatMsgMatch[1], senderObjectId: 'demo-admin', senderDisplayName: 'مدير النظام', content: '', type: 'text', createdAtUtc: new Date().toISOString(), attachments: [] };
  // Chat POST: mark as read (no-op)
  if (path.includes('/read') && path.includes('/chat/') && method === 'POST')
    return { success: true };

  // Notifications
  if (path.includes('/notifications/unread-count') && method === 'GET')
    return { count: DEMO_NOTIFICATIONS.filter(n => !n.isRead).length };
  if (path.includes('/notifications') && method === 'GET' && !path.includes('/notifications/'))
    return { items: DEMO_NOTIFICATIONS, total: DEMO_NOTIFICATIONS.length };

  // Live survey sessions
  const liveSessionsBySurvey = path.match(/\/surveys\/(.+)\/live-sessions/);
  if (liveSessionsBySurvey && method === 'GET')
    return DEMO_LIVE_SESSIONS.filter(s => s.surveyId === liveSessionsBySurvey[1]);
  if (liveSessionsBySurvey && method === 'POST')
    return { id: uid(72), joinCode: 'NEW456', presenterKey: 'demo-presenter-key-new', surveyId: liveSessionsBySurvey[1] };

  const liveJoinMatch = path.match(/\/live-sessions\/join\/(.+)/);
  if (liveJoinMatch)
    return DEMO_LIVE_SESSIONS.find(s => s.joinCode === liveJoinMatch[1]) ?? null;

  const liveResultsMatch = path.match(/\/live-sessions\/(.+)\/results/);
  if (liveResultsMatch) {
    const session = DEMO_LIVE_SESSIONS.find(s => s.id === liveResultsMatch[1]);
    return session ?? null;
  }

  // Committee KPIs
  const committeeKpiMatch = path.match(/\/reports\/committee-kpis\/([0-9a-f-]+)/);
  if (committeeKpiMatch && method === 'GET')
    return DEMO_COMMITTEE_KPIS[committeeKpiMatch[1]] ?? null;

  // Committee linked meetings
  const committeeMeetingsMatch = path.match(/\/committees\/([0-9a-f-]+)\/meetings/);
  if (committeeMeetingsMatch && method === 'GET')
    return DEMO_COMMITTEE_MEETINGS[committeeMeetingsMatch[1]] ?? [];

  // Committee linked tasks
  const committeeTasksMatch = path.match(/\/committees\/([0-9a-f-]+)\/tasks/);
  if (committeeTasksMatch && method === 'GET')
    return DEMO_COMMITTEE_TASKS[committeeTasksMatch[1]] ?? [];

  // Directives
  const directiveDetailMatch = path.match(/\/directives\/([0-9a-f-]+)$/);
  if (directiveDetailMatch && method === 'GET') {
    return DEMO_DIRECTIVES.items.find(d => d.id === directiveDetailMatch[1]) ?? null;
  }
  const directiveDecisionsMatch = path.match(/\/directives\/([0-9a-f-]+)\/decisions/);
  if (directiveDecisionsMatch && method === 'GET')
    return DEMO_DIRECTIVE_DECISIONS[directiveDecisionsMatch[1]] ?? [];
  if (path.includes('/directives') && method === 'GET' && !path.includes('/directives/'))
    return DEMO_DIRECTIVES;

  // Evaluation templates
  if (path.includes('/evaluations/templates') && method === 'GET' && !path.includes('/templates/'))
    return DEMO_EVALUATION_TEMPLATES;
  const evalTemplateDetailMatch = path.match(/\/evaluations\/templates\/([0-9a-f-]+)/);
  if (evalTemplateDetailMatch && method === 'GET')
    return DEMO_EVALUATION_TEMPLATES.find(t => t.id === evalTemplateDetailMatch[1]) ?? null;
  // Evaluations list
  if (path.includes('/evaluations') && method === 'GET' && !path.includes('/evaluations/') && !path.includes('/templates'))
    return DEMO_COMMITTEE_EVALUATIONS;
  const evalDetailMatch = path.match(/\/evaluations\/([0-9a-f-]+)$/);
  if (evalDetailMatch && method === 'GET')
    return DEMO_COMMITTEE_EVALUATIONS.items.find(e => e.id === evalDetailMatch[1]) ?? null;

  // Change requests
  if (path.includes('/change-requests') && method === 'GET' && !path.includes('/change-requests/'))
    return DEMO_CHANGE_REQUESTS;
  const changeReqDetailMatch = path.match(/\/change-requests\/([0-9a-f-]+)/);
  if (changeReqDetailMatch && method === 'GET')
    return DEMO_CHANGE_REQUESTS.items.find(r => r.id === changeReqDetailMatch[1]) ?? null;

  // Roles & Permissions
  const rolePermissionsMatch = path.match(/\/roles\/([0-9a-f-]+)\/permissions/);
  if (rolePermissionsMatch && method === 'GET') {
    const roleId = rolePermissionsMatch[1];
    return DEMO_ROLE_PERMISSIONS[roleId] ?? [];
  }
  if (path.includes('/roles') && method === 'GET' && !path.includes('/roles/'))
    return { items: DEMO_ROLES, page: 1, pageSize: 20, total: DEMO_ROLES.length };
  const roleDetailMatch = path.match(/\/roles\/([0-9a-f-]+)$/);
  if (roleDetailMatch && method === 'GET')
    return DEMO_ROLES.find(r => r.id === roleDetailMatch[1]) ?? null;
  if (path.includes('/permissions') && method === 'GET' && !path.includes('/permissions/'))
    return DEMO_PERMISSIONS_GROUPED;

  // Competitions
  const competitionWinnersMatch = path.match(/\/competitions\/([0-9a-f-]+)\/winners/);
  if (competitionWinnersMatch && method === 'GET')
    return DEMO_COMPETITION_WINNERS.filter(w => w.competitionId === competitionWinnersMatch[1]);
  if (competitionWinnersMatch && method === 'POST')
    return { id: `demo-winner-${Date.now()}`, success: true };
  const competitionDetailMatch = path.match(/\/competitions\/([0-9a-f-]+)$/);
  if (competitionDetailMatch && method === 'GET')
    return DEMO_COMPETITIONS.items.find(c => c.id === competitionDetailMatch[1]) ?? null;
  if (path.includes('/competitions/winners') && method === 'GET')
    return DEMO_COMPETITION_WINNERS;
  if (path.includes('/competitions/leaderboard') && method === 'GET')
    return DEMO_LEADERBOARD;
  if (path.includes('/competitions') && method === 'GET' && !path.includes('/competitions/'))
    return DEMO_COMPETITIONS;

  // Handle mutations in demo mode (POST/PUT/PATCH/DELETE)
  if (method === 'PATCH') {
    return { success: true, updatedAtUtc: new Date().toISOString() };
  }
  if (method === 'POST') {
    // Return a mock created entity with a new ID
    return { id: `demo-${Date.now()}`, success: true, createdAtUtc: new Date().toISOString() };
  }
  if (method === 'PUT') {
    return { success: true, updatedAtUtc: new Date().toISOString() };
  }
  if (method === 'DELETE') {
    return { success: true };
  }

  return null;
}
