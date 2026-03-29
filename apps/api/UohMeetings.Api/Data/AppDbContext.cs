using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AuditLogEntry> AuditLogEntries => Set<AuditLogEntry>();
    public DbSet<Committee> Committees => Set<Committee>();
    public DbSet<CommitteeMember> CommitteeMembers => Set<CommitteeMember>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<AgendaItem> AgendaItems => Set<AgendaItem>();
    public DbSet<MeetingInvitee> MeetingInvitees => Set<MeetingInvitee>();
    public DbSet<MeetingRoom> MeetingRooms => Set<MeetingRoom>();
    public DbSet<Mom> Moms => Set<Mom>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AgendaMinute> AgendaMinutes => Set<AgendaMinute>();
    public DbSet<Decision> Decisions => Set<Decision>();
    public DbSet<RecommendationTask> RecommendationTasks => Set<RecommendationTask>();
    public DbSet<SubTask> SubTasks => Set<SubTask>();
    public DbSet<VoteSession> VoteSessions => Set<VoteSession>();
    public DbSet<VoteOption> VoteOptions => Set<VoteOption>();
    public DbSet<VoteBallot> VoteBallots => Set<VoteBallot>();
    public DbSet<StoredFile> StoredFiles => Set<StoredFile>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyQuestion> SurveyQuestions => Set<SurveyQuestion>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
    public DbSet<SurveyAnswer> SurveyAnswers => Set<SurveyAnswer>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<WorkflowTemplate> WorkflowTemplates => Set<WorkflowTemplate>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<WorkflowInstanceHistory> WorkflowInstanceHistories => Set<WorkflowInstanceHistory>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<LiveSurveySession> LiveSurveySessions => Set<LiveSurveySession>();
    public DbSet<LiveSessionResponse> LiveSessionResponses => Set<LiveSessionResponse>();
    public DbSet<SurveyTemplate> SurveyTemplates => Set<SurveyTemplate>();
    public DbSet<SurveyTemplateQuestion> SurveyTemplateQuestions => Set<SurveyTemplateQuestion>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatMessageAttachment> ChatMessageAttachments => Set<ChatMessageAttachment>();

    // Directives & Decisions
    public DbSet<Directive> Directives => Set<Directive>();
    public DbSet<DirectiveDecision> DirectiveDecisions => Set<DirectiveDecision>();

    // Evaluations
    public DbSet<EvaluationTemplate> EvaluationTemplates => Set<EvaluationTemplate>();
    public DbSet<EvaluationCriteria> EvaluationCriteria => Set<EvaluationCriteria>();
    public DbSet<CommitteeEvaluation> CommitteeEvaluations => Set<CommitteeEvaluation>();
    public DbSet<EvaluationResponse> EvaluationResponses => Set<EvaluationResponse>();

    // Change Requests
    public DbSet<CommitteeChangeRequest> CommitteeChangeRequests => Set<CommitteeChangeRequest>();

    // Dashboard
    public DbSet<DashboardWidget> DashboardWidgets => Set<DashboardWidget>();
    public DbSet<UserDashboardLayout> UserDashboardLayouts => Set<UserDashboardLayout>();
    public DbSet<ExternalDataSource> ExternalDataSources => Set<ExternalDataSource>();

    // User Profile & AD Sync
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<AdGroupRoleMapping> AdGroupRoleMappings => Set<AdGroupRoleMapping>();
    public DbSet<AdSyncLog> AdSyncLogs => Set<AdSyncLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    // QR Code Sharing
    public DbSet<ShareLink> ShareLinks => Set<ShareLink>();

    // University Locations
    public DbSet<Location> Locations => Set<Location>();

    // WebPush Subscriptions
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    // Acknowledgments
    public DbSet<AcknowledgmentTemplate> AcknowledgmentTemplates => Set<AcknowledgmentTemplate>();
    public DbSet<UserAcknowledgment> UserAcknowledgments => Set<UserAcknowledgment>();

    // User Management & Roles
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<AppRole> AppRoles => Set<AppRole>();
    public DbSet<AppPermission> AppPermissions => Set<AppPermission>();
    public DbSet<AppUserRole> AppUserRoles => Set<AppUserRole>();
    public DbSet<AppRolePermission> AppRolePermissions => Set<AppRolePermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

