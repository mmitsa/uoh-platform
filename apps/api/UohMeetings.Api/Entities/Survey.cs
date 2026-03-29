using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class Survey
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? CommitteeId { get; set; }
    public Guid? RecommendationTaskId { get; set; }

    public string Type { get; set; } = "general"; // general, poll, committee_evaluation, meeting_feedback
    public string TargetAudience { get; set; } = "staff";
    public bool IsPublic { get; set; } = true;

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";

    public DateTime StartAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime EndAtUtc { get; set; } = DateTime.UtcNow.AddDays(7);
    public SurveyStatus Status { get; set; } = SurveyStatus.Draft;

    public bool AllowLuckyDraw { get; set; }
    public bool RequireEmployeeId { get; set; }
    public bool CollectPersonalData { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<SurveyQuestion> Questions { get; set; } = new();
}

public sealed class SurveyQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SurveyId { get; set; }

    public int Order { get; set; }
    public SurveyQuestionType Type { get; set; } = SurveyQuestionType.Single;

    public string TextAr { get; set; } = "";
    public string TextEn { get; set; } = "";

    public string? OptionsJson { get; set; }

    // Advanced features
    public string? SectionAr { get; set; }
    public string? SectionEn { get; set; }
    public int Weight { get; set; } = 1;
    public int? Points { get; set; }
    public bool AllowComment { get; set; }
    public string? BranchingRulesJson { get; set; }
    public int? SliderMin { get; set; }
    public int? SliderMax { get; set; }
    public string? ImageUrl { get; set; }

    public Survey? Survey { get; set; }
}

public sealed class SurveyResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SurveyId { get; set; }

    public string? RespondentObjectId { get; set; }
    public string? EmployeeId { get; set; }
    public string? RespondentName { get; set; }
    public string? RespondentEmail { get; set; }
    public string? RespondentPhone { get; set; }
    public string? Department { get; set; }
    public string? Gender { get; set; }
    public bool IsProxySubmission { get; set; }
    public string? ProxySubmittedBy { get; set; }

    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;

    public List<SurveyAnswer> Answers { get; set; } = new();
}

public sealed class SurveyAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SurveyResponseId { get; set; }
    public Guid SurveyQuestionId { get; set; }

    public string ValueJson { get; set; } = "{}";
}

public sealed class SurveyTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    public string Type { get; set; } = "general";
    public string TargetAudience { get; set; } = "staff";

    public string? CreatedByObjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<SurveyTemplateQuestion> Questions { get; set; } = new();
}

public sealed class SurveyTemplateQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SurveyTemplateId { get; set; }

    public int Order { get; set; }
    public SurveyQuestionType Type { get; set; } = SurveyQuestionType.Single;

    public string TextAr { get; set; } = "";
    public string TextEn { get; set; } = "";

    public string? OptionsJson { get; set; }

    public SurveyTemplate? Template { get; set; }
}
