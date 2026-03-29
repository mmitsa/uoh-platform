using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public sealed class DataSeeder(AppDbContext db)
{
    public async Task SeedAsync(CancellationToken ct)
    {
        await SeedRolesAndPermissionsAsync(ct);
        await SeedTestUsersAsync(ct);
        await SeedDashboardWidgetsAsync(ct);
        await SeedSampleDataAsync(ct);
    }

    private async Task SeedRolesAndPermissionsAsync(CancellationToken ct)
    {
        if (await db.AppRoles.AnyAsync(ct)) return;

        // --- System Roles ---
        var sysAdmin = new AppRole { Key = "SystemAdmin", NameAr = "مدير النظام", NameEn = "System Admin", DescriptionAr = "صلاحيات كاملة على المنصة", DescriptionEn = "Full platform access", IsSystem = true };
        var head = new AppRole { Key = "CommitteeHead", NameAr = "رئيس اللجنة", NameEn = "Committee Head", DescriptionAr = "رئيس لجنة أو مجلس", DescriptionEn = "Chair of a committee or council", IsSystem = true };
        var secretary = new AppRole { Key = "CommitteeSecretary", NameAr = "أمين اللجنة", NameEn = "Committee Secretary", DescriptionAr = "أمين سر اللجنة", DescriptionEn = "Secretary of a committee", IsSystem = true };
        var member = new AppRole { Key = "CommitteeMember", NameAr = "عضو لجنة", NameEn = "Committee Member", DescriptionAr = "عضو في لجنة", DescriptionEn = "Regular committee member", IsSystem = true };
        var observer = new AppRole { Key = "Observer", NameAr = "مراقب", NameEn = "Observer", DescriptionAr = "مراقب للقراءة فقط", DescriptionEn = "Read-only observer", IsSystem = true };

        db.AppRoles.AddRange(sysAdmin, head, secretary, member, observer);

        // --- System Permissions ---
        var sort = 0;
        var permissions = new List<AppPermission>
        {
            P("dashboard.view", "Page", "عرض لوحة التحكم", "View Dashboard", "/", ++sort),

            P("committees.view", "Page", "عرض اللجان", "View Committees", "/committees", ++sort),
            P("committees.create", "Action", "إنشاء لجنة", "Create Committee", null, ++sort),
            P("committees.edit", "Action", "تعديل لجنة", "Edit Committee", null, ++sort),
            P("committees.delete", "Action", "حذف لجنة", "Delete Committee", null, ++sort),
            P("committees.members.manage", "Action", "إدارة أعضاء اللجنة", "Manage Committee Members", null, ++sort),

            P("meetings.view", "Page", "عرض الاجتماعات", "View Meetings", "/meetings", ++sort),
            P("meetings.create", "Action", "إنشاء اجتماع", "Create Meeting", null, ++sort),
            P("meetings.edit", "Action", "تعديل اجتماع", "Edit Meeting", null, ++sort),
            P("meetings.publish", "Action", "نشر اجتماع", "Publish Meeting", null, ++sort),
            P("meetings.cancel", "Action", "إلغاء اجتماع", "Cancel Meeting", null, ++sort),

            P("moms.view", "Page", "عرض المحاضر", "View Minutes", "/moms", ++sort),
            P("moms.create", "Action", "إنشاء محضر", "Create Minutes", null, ++sort),
            P("moms.approve", "Action", "اعتماد محضر", "Approve Minutes", null, ++sort),
            P("moms.export", "Action", "تصدير محضر", "Export Minutes", null, ++sort),

            P("tasks.view", "Page", "عرض المهام", "View Tasks", "/tasks", ++sort),
            P("tasks.edit", "Action", "تحديث تقدم مهمة", "Update Task Progress", null, ++sort),

            P("votes.view", "Page", "عرض التصويت", "View Voting", "/votes", ++sort),
            P("votes.create", "Action", "إنشاء جلسة تصويت", "Create Vote Session", null, ++sort),
            P("votes.cast", "Action", "التصويت", "Cast Vote", null, ++sort),

            P("surveys.view", "Page", "عرض الاستبيانات", "View Surveys", "/surveys", ++sort),
            P("surveys.create", "Action", "إنشاء استبيان", "Create Survey", null, ++sort),
            P("surveys.live.present", "Page", "تقديم استبيان مباشر", "Present Live Survey", null, ++sort),

            P("attachments.view", "Page", "عرض المرفقات", "View Attachments", "/attachments", ++sort),
            P("attachments.upload", "Action", "رفع مرفق", "Upload Attachment", null, ++sort),

            P("reports.view", "Page", "عرض التقارير", "View Reports", "/reports", ++sort),
            P("reports.export", "Action", "تصدير التقارير", "Export Reports", null, ++sort),

            P("workflow.view", "Page", "عرض سير العمل", "View Workflow", "/workflow", ++sort),
            P("workflow.manage", "Action", "إدارة قوالب سير العمل", "Manage Workflow Templates", null, ++sort),

            P("chat.view", "Module", "الوصول للمحادثات", "Access Chat", null, ++sort),
            P("myarchive.view", "Page", "عرض أرشيفي", "View My Archive", "/my-archive", ++sort),

            P("admin.view", "Page", "عرض لوحة الإدارة", "View Admin Panel", "/admin", ++sort),
            P("admin.users.view", "Page", "عرض المستخدمين", "View Users", "/admin/users", ++sort),
            P("admin.users.manage", "Action", "إدارة المستخدمين", "Manage Users", null, ++sort),
            P("admin.users.sync", "Action", "مزامنة المستخدمين من AD", "Sync Users from AD", null, ++sort),
            P("admin.roles.view", "Page", "عرض الأدوار", "View Roles", "/admin/roles", ++sort),
            P("admin.roles.manage", "Action", "إدارة الأدوار", "Manage Roles", null, ++sort),
            P("admin.permissions.view", "Page", "عرض الصلاحيات", "View Permissions", "/admin/permissions", ++sort),
            P("admin.permissions.assign", "Action", "تعيين الصلاحيات", "Assign Permissions", null, ++sort),

            P("profile.view", "Page", "عرض الملف الشخصي", "View Profile", "/profile", ++sort),
            P("profile.edit", "Action", "تعديل الملف الشخصي", "Edit Profile", null, ++sort),

            P("admin.adsync.configure", "Page", "إعداد مزامنة AD", "Configure AD Sync", "/admin/ad-sync", ++sort),
            P("admin.adsync.run", "Action", "تشغيل مزامنة AD", "Run AD Sync", null, ++sort),
            P("admin.adsync.settings", "Action", "إدارة إعدادات اتصال AD", "Manage AD Connection Settings", null, ++sort),
        };

        db.AppPermissions.AddRange(permissions);
        await db.SaveChangesAsync(ct);

        // --- Role-Permission Mappings ---

        // SystemAdmin gets ALL permissions
        foreach (var p in permissions)
            db.AppRolePermissions.Add(new AppRolePermission { RoleId = sysAdmin.Id, PermissionId = p.Id });

        // CommitteeHead — view/action on committees, meetings, moms, tasks, votes, surveys, attachments, reports
        var headPerms = new[] {
            "dashboard.view", "committees.view", "committees.edit", "committees.members.manage",
            "meetings.view", "meetings.create", "meetings.edit", "meetings.publish", "meetings.cancel",
            "moms.view", "moms.create", "moms.approve", "moms.export",
            "tasks.view", "tasks.edit",
            "votes.view", "votes.create", "votes.cast",
            "surveys.view", "surveys.create",
            "attachments.view", "attachments.upload",
            "reports.view", "reports.export",
            "chat.view", "myarchive.view",
            "profile.view", "profile.edit"
        };
        AssignPerms(permissions, head, headPerms);

        // CommitteeSecretary — similar to head but no approve, plus live survey
        var secPerms = new[] {
            "dashboard.view", "committees.view",
            "meetings.view", "meetings.create", "meetings.edit", "meetings.publish", "meetings.cancel",
            "moms.view", "moms.create", "moms.export",
            "tasks.view", "tasks.edit",
            "votes.view", "votes.create", "votes.cast",
            "surveys.view", "surveys.create", "surveys.live.present",
            "attachments.view", "attachments.upload",
            "reports.view", "reports.export",
            "chat.view", "myarchive.view",
            "profile.view", "profile.edit"
        };
        AssignPerms(permissions, secretary, secPerms);

        // CommitteeMember — view + vote + tasks
        var memberPerms = new[] {
            "dashboard.view", "committees.view",
            "meetings.view",
            "moms.view",
            "tasks.view", "tasks.edit",
            "votes.view", "votes.cast",
            "surveys.view",
            "attachments.view",
            "reports.view",
            "chat.view", "myarchive.view",
            "profile.view", "profile.edit"
        };
        AssignPerms(permissions, member, memberPerms);

        // Observer — view only
        var observerPerms = new[] {
            "dashboard.view", "committees.view",
            "meetings.view", "moms.view", "tasks.view",
            "votes.view", "surveys.view",
            "attachments.view", "reports.view",
            "chat.view", "myarchive.view",
            "profile.view", "profile.edit"
        };
        AssignPerms(permissions, observer, observerPerms);

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedTestUsersAsync(CancellationToken ct)
    {
        // Skip if test users already exist
        if (await db.AppUsers.AnyAsync(u => u.ObjectId.StartsWith("test-"), ct)) return;

        // Fetch seeded roles
        var roles = await db.AppRoles.ToDictionaryAsync(r => r.Key, r => r, ct);
        if (roles.Count == 0) return;

        // Default password for all test accounts: Uoh@2024
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Uoh@2024");

        // --- Test users for each stakeholder role ---
        var testUsers = new (string ObjectId, string NameAr, string NameEn, string Email, string JobAr, string JobEn, string Dept, string RoleKey)[]
        {
            // SystemAdmin
            ("test-sysadmin-001", "م. خالد المهندس",  "Eng. Khalid Al-Muhandis",   "sysadmin@uoh.edu.sa",             "مدير تقنية المعلومات",     "IT Director",                     "تقنية المعلومات",   "SystemAdmin"),

            // CommitteeHead (2 accounts — dean + vice president)
            ("test-head-001",     "د. فهد العميد",     "Dr. Fahad Al-Ameed",        "dean.fahad@uoh.edu.sa",           "عميد كلية الحاسب",         "Dean of Computing College",       "كلية الحاسب",       "CommitteeHead"),
            ("test-head-002",     "د. سارة المديرة",   "Dr. Sarah Al-Mudeera",      "vp.sarah@uoh.edu.sa",             "وكيلة الجامعة للتطوير",    "Vice President for Development",  "الإدارة العليا",    "CommitteeHead"),

            // CommitteeSecretary (2 accounts)
            ("test-sec-001",      "أ. نورة الكاتبة",   "Ms. Noura Al-Katiba",       "secretary.noura@uoh.edu.sa",      "أمينة لجنة التحول الرقمي", "Digital Transformation Secretary", "التحول الرقمي",     "CommitteeSecretary"),
            ("test-sec-002",      "أ. محمد المنسق",    "Mr. Mohammed Al-Munasiq",   "coordinator.mohammed@uoh.edu.sa", "منسق لجنة الجودة",         "Quality Committee Coordinator",   "الجودة والاعتماد",  "CommitteeSecretary"),

            // CommitteeMember (3 accounts — faculty + staff)
            ("test-member-001",   "د. أحمد الباحث",    "Dr. Ahmed Al-Bahith",       "member.ahmed@uoh.edu.sa",         "عضو هيئة تدريس",           "Faculty Member",                  "قسم علوم الحاسب",   "CommitteeMember"),
            ("test-member-002",   "د. فاطمة العالمة",  "Dr. Fatimah Al-Aalima",     "member.fatimah@uoh.edu.sa",       "عضوة هيئة تدريس",          "Faculty Member",                  "قسم نظم المعلومات", "CommitteeMember"),
            ("test-member-003",   "أ. عبدالله الموظف",  "Mr. Abdullah Al-Muwazzaf", "staff.abdullah@uoh.edu.sa",       "موظف إداري",               "Administrative Staff",            "الشؤون الإدارية",   "CommitteeMember"),

            // Observer (2 accounts — auditor + quality)
            ("test-observer-001", "أ. ريم المراقبة",   "Ms. Reem Al-Muraqiba",      "auditor.reem@uoh.edu.sa",         "مراقبة جودة",              "Quality Auditor",                 "إدارة الجودة",      "Observer"),
            ("test-observer-002", "م. ياسر المدقق",    "Eng. Yaser Al-Mudaqqiq",    "auditor.yaser@uoh.edu.sa",        "مدقق داخلي",               "Internal Auditor",                "المراجعة الداخلية", "Observer"),
        };

        foreach (var (objectId, nameAr, nameEn, email, jobAr, jobEn, dept, roleKey) in testUsers)
        {
            var user = new AppUser
            {
                ObjectId = objectId,
                DisplayNameAr = nameAr,
                DisplayNameEn = nameEn,
                Email = email,
                JobTitleAr = jobAr,
                JobTitleEn = jobEn,
                Department = dept,
                PasswordHash = passwordHash,
                IsActive = true,
                IsSynced = true,
            };
            db.AppUsers.Add(user);

            if (roles.TryGetValue(roleKey, out var role))
            {
                db.AppUserRoles.Add(new AppUserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                    AssignedByObjectId = "system-seed",
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedDashboardWidgetsAsync(CancellationToken ct)
    {
        if (await db.DashboardWidgets.AnyAsync(ct)) return;

        var widgets = new List<DashboardWidget>
        {
            // Statistics (4)
            W("stat-committees", "Statistics", "إجمالي اللجان", "Total Committees", "عدد اللجان الكلي", "Total committees count", 1, 1, "IconCommittees"),
            W("stat-meetings", "Statistics", "الاجتماعات", "Meetings", "إجمالي الاجتماعات هذا الشهر", "Total meetings this month", 1, 1, "IconMeetings"),
            W("stat-tasks", "Statistics", "المهام المعلقة", "Pending Tasks", "المهام المعلقة والمتأخرة", "Pending and overdue tasks", 1, 1, "IconTasks"),
            W("stat-surveys", "Statistics", "الاستبيانات النشطة", "Active Surveys", "عدد الاستبيانات النشطة حاليًا", "Currently active surveys", 1, 1, "IconSurveys"),
            W("stat-live-meetings", "Statistics", "اجتماعات جارية الآن", "Live Meetings Now", "عدد الاجتماعات الجارية حالياً", "Number of currently active meetings", 1, 1, "IconMeetings"),
            W("stat-upcoming-count", "Statistics", "القادمة (7 أيام)", "Upcoming (7 days)", "عدد الاجتماعات المجدولة خلال 7 أيام", "Scheduled meetings in next 7 days", 1, 1, "IconCalendar"),

            // Charts (5)
            W("chart-meetings-monthly", "Chart", "الاجتماعات الشهرية", "Monthly Meetings", "رسم بياني للاجتماعات حسب الشهر", "Bar chart of meetings by month", 2, 2, "IconChart"),
            W("chart-task-status", "Chart", "حالات المهام", "Task Status", "مخطط دائري لحالات المهام", "Pie chart of task statuses", 2, 2, "IconChart"),
            W("chart-committee-types", "Chart", "أنواع اللجان", "Committee Types", "مخطط دائري لأنواع اللجان", "Pie chart of committee types", 2, 2, "IconChart"),
            W("chart-task-priority", "Chart", "أولوية المهام", "Task Priority", "مخطط دائري لأولوية المهام", "Pie chart of task priorities", 2, 2, "IconChart"),
            W("assignee-workload", "Chart", "حِمل العمل", "Assignee Workload", "توزيع المهام حسب المكلّف", "Task distribution per assignee", 2, 2, "IconUsers"),

            // Committee (3)
            W("upcoming-meetings", "Committee", "الاجتماعات القادمة", "Upcoming Meetings", "قائمة الاجتماعات المقبلة", "List of upcoming meetings", 2, 2, "IconCalendar"),
            W("recent-activity", "Committee", "النشاط الأخير", "Recent Activity", "آخر الأنشطة على المنصة", "Latest platform activities", 2, 2, "IconActivity"),
            W("attendance-rate", "Committee", "نسبة الحضور", "Attendance Rate", "معدل حضور الاجتماعات", "Meeting attendance rate", 2, 1, "IconUsers"),

            // Progress (2)
            W("completion-rate", "Committee", "نسبة الإنجاز", "Completion Rate", "معدل إنجاز المهام", "Task completion rate", 2, 1, "IconProgress"),
            W("task-overview", "Committee", "ملخص المهام", "Task Overview", "نظرة عامة على حالات المهام", "Overview of task statuses", 2, 1, "IconTasks"),

            // External (1)
            W("external-kpi", "External", "مؤشرات أداء خارجية", "External KPI", "عرض بيانات من API خارجي", "Display data from external API", 2, 2, "IconExternalLink",
              requiredPermission: "admin.view"),

            // Rankings (1)
            W("university-rankings", "Rankings", "التصنيفات الجامعية", "University Rankings", "تصنيفات QS و THE و Shanghai", "QS, THE, and Shanghai rankings", 2, 2, "IconTrophy"),

            // Custom (3)
            W("custom-note", "Custom", "مذكرة", "Note", "مذكرة نصية شخصية", "Personal text note", 1, 1, "IconNote"),
            W("custom-kpi", "Custom", "مؤشر مخصص", "Custom KPI", "مؤشر أداء بقيمة مخصصة", "Custom KPI with user-entered value", 1, 1, "IconGauge"),
            W("quick-links", "Custom", "روابط سريعة", "Quick Links", "روابط مخصصة للوصول السريع", "Custom quick access links", 1, 2, "IconLink"),
        };

        db.DashboardWidgets.AddRange(widgets);
        await db.SaveChangesAsync(ct);
    }

    private static DashboardWidget W(
        string key, string category, string nameAr, string nameEn,
        string descAr, string descEn, int w, int h, string icon,
        string? requiredPermission = null, string? requiredRole = null)
    {
        return new DashboardWidget
        {
            Key = key,
            Category = category,
            NameAr = nameAr,
            NameEn = nameEn,
            DescriptionAr = descAr,
            DescriptionEn = descEn,
            DefaultWidth = w,
            DefaultHeight = h,
            MinWidth = 1,
            MinHeight = 1,
            IconName = icon,
            IsSystem = true,
            RequiredPermission = requiredPermission,
            RequiredRole = requiredRole,
        };
    }

    private async Task SeedSampleDataAsync(CancellationToken ct)
    {
        if (await db.Committees.AnyAsync(ct)) return;

        var committee = new Committee
        {
            Type = CommitteeType.Permanent,
            NameAr = "لجنة التحول الرقمي",
            NameEn = "Digital Transformation Committee",
            Status = CommitteeStatus.Active,
            Members =
            {
                new CommitteeMember { UserObjectId = "test-head-001", DisplayName = "Dr. Fahad Al-Ameed", Email = "dean.fahad@uoh.edu.sa", Role = "head" },
                new CommitteeMember { UserObjectId = "test-sec-001", DisplayName = "Ms. Noura Al-Katiba", Email = "secretary.noura@uoh.edu.sa", Role = "secretary" },
                new CommitteeMember { UserObjectId = "test-member-001", DisplayName = "Dr. Ahmed Al-Bahith", Email = "member.ahmed@uoh.edu.sa", Role = "member" },
                new CommitteeMember { UserObjectId = "test-observer-001", DisplayName = "Ms. Reem Al-Muraqiba", Email = "auditor.reem@uoh.edu.sa", Role = "observer" },
            }
        };
        db.Committees.Add(committee);

        var meeting = new Meeting
        {
            CommitteeId = committee.Id,
            TitleAr = "اجتماع تجريبي",
            TitleEn = "Sample Meeting",
            Type = MeetingType.Hybrid,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(1),
            Location = "Main campus",
            OnlinePlatform = OnlinePlatform.Teams,
            Status = MeetingStatus.Draft,
            AgendaItems =
            {
                new AgendaItem { Order = 1, TitleAr = "افتتاح", TitleEn = "Opening" },
                new AgendaItem { Order = 2, TitleAr = "قرارات", TitleEn = "Decisions" },
            }
        };
        db.Meetings.Add(meeting);

        var survey = new Survey
        {
            TitleAr = "استبيان تجريبي",
            TitleEn = "Sample Survey",
            Type = "general",
            TargetAudience = "staff",
            Status = SurveyStatus.Draft,
            StartAtUtc = DateTime.UtcNow,
            EndAtUtc = DateTime.UtcNow.AddDays(7),
            Questions =
            {
                new SurveyQuestion { Order = 1, Type = SurveyQuestionType.Single, TextAr = "هل كانت التجربة جيدة؟", TextEn = "Was the experience good?", OptionsJson = "[\"Yes\",\"No\"]" },
            }
        };
        db.Surveys.Add(survey);

        await db.SaveChangesAsync(ct);
    }

    private static AppPermission P(string key, string category, string nameAr, string nameEn, string? route, int sortOrder)
    {
        return new AppPermission
        {
            Key = key,
            Category = category,
            NameAr = nameAr,
            NameEn = nameEn,
            Route = route,
            SortOrder = sortOrder,
            IsSystem = true,
        };
    }

    private void AssignPerms(List<AppPermission> allPermissions, AppRole role, string[] permKeys)
    {
        foreach (var key in permKeys)
        {
            var perm = allPermissions.Find(p => p.Key == key);
            if (perm is not null)
                db.AppRolePermissions.Add(new AppRolePermission { RoleId = role.Id, PermissionId = perm.Id });
        }
    }
}
