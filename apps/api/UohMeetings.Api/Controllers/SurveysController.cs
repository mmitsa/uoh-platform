using System.Security.Claims;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/surveys")]
public sealed class SurveysController(AppDbContext db, INotificationService notificationService) : ControllerBase
{
    // ── List with filtering & search ──────────────────────────────────────

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] SurveyStatus? status = null,
        [FromQuery] Guid? committeeId = null,
        [FromQuery] Guid? recommendationTaskId = null,
        [FromQuery] string? type = null,
        [FromQuery] string? search = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.Surveys.AsNoTracking();
        if (status.HasValue) q = q.Where(s => s.Status == status.Value);
        if (committeeId.HasValue) q = q.Where(s => s.CommitteeId == committeeId.Value);
        if (recommendationTaskId.HasValue) q = q.Where(s => s.RecommendationTaskId == recommendationTaskId.Value);
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(s => s.Type == type);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(s => s.TitleAr.ToLower().Contains(term) || s.TitleEn.ToLower().Contains(term));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id, s.TitleAr, s.TitleEn, s.Type, s.TargetAudience,
                s.Status, s.StartAtUtc, s.EndAtUtc,
                s.CommitteeId, s.RecommendationTaskId, s.AllowLuckyDraw,
                ResponseCount = db.SurveyResponses.Count(r => r.SurveyId == s.Id),
                QuestionCount = s.Questions.Count,
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }

    // ── Get single ────────────────────────────────────────────────────────

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Get(Guid id)
    {
        var survey = await db.Surveys.AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id);
        return survey is null ? NotFound() : Ok(survey);
    }

    [HttpGet("{id:guid}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic(Guid id)
    {
        var survey = await db.Surveys.AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id);
        if (survey is null) return NotFound();

        return Ok(new
        {
            survey.Id, survey.Type, survey.TargetAudience,
            survey.TitleAr, survey.TitleEn,
            survey.StartAtUtc, survey.EndAtUtc, survey.Status,
            questions = survey.Questions.Select(q => new { q.Id, q.Order, q.Type, q.TextAr, q.TextEn, q.OptionsJson }).ToArray(),
        });
    }

    // ── Create (with committee/recommendation linking) ────────────────────

    public sealed record CreateSurveyRequest(
        string Type,
        string TargetAudience,
        string TitleAr,
        string TitleEn,
        DateTime StartAtUtc,
        DateTime EndAtUtc,
        bool AllowLuckyDraw,
        List<QuestionDto> Questions,
        Guid? CommitteeId = null,
        Guid? RecommendationTaskId = null,
        Guid? TemplateId = null
    );

    public sealed record QuestionDto(int Order, SurveyQuestionType Type, string TextAr, string TextEn, List<string>? Options);

    [HttpPost]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Create([FromBody] CreateSurveyRequest req)
    {
        if (req.EndAtUtc <= req.StartAtUtc) return BadRequest(new { code = "VALIDATION_ERROR" });
        if (string.IsNullOrWhiteSpace(req.TitleAr) || string.IsNullOrWhiteSpace(req.TitleEn))
            return BadRequest(new { code = "VALIDATION_ERROR" });

        // If creating from template, load template questions
        var questions = req.Questions;
        if (req.TemplateId.HasValue && (questions == null || questions.Count == 0))
        {
            var template = await db.SurveyTemplates.AsNoTracking()
                .Include(t => t.Questions.OrderBy(q => q.Order))
                .FirstOrDefaultAsync(t => t.Id == req.TemplateId.Value);
            if (template is not null)
            {
                questions = template.Questions.Select(q => new QuestionDto(
                    q.Order, q.Type, q.TextAr, q.TextEn,
                    q.OptionsJson is null ? null : JsonSerializer.Deserialize<List<string>>(q.OptionsJson)
                )).ToList();
            }
        }

        var survey = new Survey
        {
            Type = req.Type,
            TargetAudience = req.TargetAudience,
            TitleAr = req.TitleAr.Trim(),
            TitleEn = req.TitleEn.Trim(),
            StartAtUtc = req.StartAtUtc,
            EndAtUtc = req.EndAtUtc,
            AllowLuckyDraw = req.AllowLuckyDraw,
            CommitteeId = req.CommitteeId,
            RecommendationTaskId = req.RecommendationTaskId,
            Status = SurveyStatus.Draft,
            Questions = (questions ?? new())
                .OrderBy(q => q.Order)
                .Select(q => new SurveyQuestion
                {
                    Order = q.Order,
                    Type = q.Type,
                    TextAr = q.TextAr.Trim(),
                    TextEn = q.TextEn.Trim(),
                    OptionsJson = q.Options is null ? null : JsonSerializer.Serialize(q.Options),
                })
                .ToList(),
        };

        db.Surveys.Add(survey);
        await db.SaveChangesAsync();
        return Ok(new { survey.Id });
    }

    // ── Activate with notifications ───────────────────────────────────────

    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var survey = await db.Surveys.FirstOrDefaultAsync(s => s.Id == id);
        if (survey is null) return NotFound();
        if (survey.Status != SurveyStatus.Draft) return BadRequest(new { code = "INVALID_STATE" });
        survey.Status = SurveyStatus.Active;
        await db.SaveChangesAsync();

        // Send notifications to committee members if linked
        if (survey.CommitteeId.HasValue)
        {
            var members = await db.CommitteeMembers
                .Where(m => m.CommitteeId == survey.CommitteeId.Value)
                .Select(m => new { m.UserObjectId, m.Email })
                .ToListAsync();

            var payloads = members.Select(m => new NotificationPayload(
                m.UserObjectId ?? "",
                m.Email,
                "SurveyActivated",
                $"تم تفعيل استبيان: {survey.TitleAr}",
                $"Survey activated: {survey.TitleEn}",
                EntityType: "Survey",
                EntityId: survey.Id,
                ActionUrl: $"/surveys"
            )).Where(p => !string.IsNullOrEmpty(p.RecipientObjectId)).ToList();

            if (payloads.Count > 0)
                await notificationService.NotifyManyAsync(payloads);
        }

        return Ok();
    }

    // ── Close with notifications ──────────────────────────────────────────

    [HttpPost("{id:guid}/close")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Close(Guid id)
    {
        var survey = await db.Surveys.FirstOrDefaultAsync(s => s.Id == id);
        if (survey is null) return NotFound();
        if (survey.Status != SurveyStatus.Active) return BadRequest(new { code = "INVALID_STATE" });
        survey.Status = SurveyStatus.Closed;
        await db.SaveChangesAsync();

        if (survey.CommitteeId.HasValue)
        {
            var members = await db.CommitteeMembers
                .Where(m => m.CommitteeId == survey.CommitteeId.Value)
                .Select(m => new { m.UserObjectId, m.Email })
                .ToListAsync();

            var payloads = members.Select(m => new NotificationPayload(
                m.UserObjectId ?? "",
                m.Email,
                "SurveyClosed",
                $"تم إغلاق استبيان: {survey.TitleAr}",
                $"Survey closed: {survey.TitleEn}",
                EntityType: "Survey",
                EntityId: survey.Id,
                ActionUrl: $"/surveys"
            )).Where(p => !string.IsNullOrEmpty(p.RecipientObjectId)).ToList();

            if (payloads.Count > 0)
                await notificationService.NotifyManyAsync(payloads);
        }

        return Ok();
    }

    // ── Submit response ───────────────────────────────────────────────────

    public sealed record SubmitResponseRequest(List<AnswerDto> Answers);
    public sealed record AnswerDto(Guid SurveyQuestionId, JsonElement Value);

    [HttpPost("{id:guid}/responses")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitResponse(Guid id, [FromBody] SubmitResponseRequest req, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking().Include(s => s.Questions).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();
        if (survey.Status != SurveyStatus.Active) return BadRequest(new { code = "SURVEY_NOT_ACTIVE" });
        if (DateTime.UtcNow < survey.StartAtUtc || DateTime.UtcNow > survey.EndAtUtc) return BadRequest(new { code = "SURVEY_OUTSIDE_WINDOW" });

        var oid = User.Identity?.IsAuthenticated == true
            ? User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var validQuestionIds = survey.Questions.Select(q => q.Id).ToHashSet();
        if (req.Answers.Any(a => !validQuestionIds.Contains(a.SurveyQuestionId)))
            return BadRequest(new { code = "INVALID_QUESTION" });

        var response = new SurveyResponse
        {
            SurveyId = id,
            RespondentObjectId = oid,
            Answers = req.Answers.Select(a => new SurveyAnswer
            {
                SurveyQuestionId = a.SurveyQuestionId,
                ValueJson = a.Value.GetRawText(),
            }).ToList(),
        };

        db.SurveyResponses.Add(response);
        await db.SaveChangesAsync(ct);
        return Ok(new { response.Id });
    }

    // ── Analytics / Statistics ─────────────────────────────────────────────

    [HttpGet("{id:guid}/analytics")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> GetAnalytics(Guid id, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();

        var responses = await db.SurveyResponses
            .AsNoTracking()
            .Where(r => r.SurveyId == id)
            .Include(r => r.Answers)
            .ToListAsync(ct);

        var totalResponses = responses.Count;

        // Per-question analytics
        var questionAnalytics = new List<object>();
        foreach (var question in survey.Questions)
        {
            var answers = responses
                .SelectMany(r => r.Answers)
                .Where(a => a.SurveyQuestionId == question.Id)
                .ToList();

            var answeredCount = answers.Count;

            if (question.Type == SurveyQuestionType.Single || question.Type == SurveyQuestionType.Multi)
            {
                var options = question.OptionsJson is not null
                    ? JsonSerializer.Deserialize<List<string>>(question.OptionsJson) ?? new()
                    : new List<string>();

                var tallies = new Dictionary<string, int>();
                foreach (var opt in options) tallies[opt] = 0;

                foreach (var answer in answers)
                {
                    try
                    {
                        if (question.Type == SurveyQuestionType.Single)
                        {
                            var val = JsonSerializer.Deserialize<string>(answer.ValueJson);
                            if (val is not null && tallies.ContainsKey(val)) tallies[val]++;
                        }
                        else
                        {
                            var vals = JsonSerializer.Deserialize<List<string>>(answer.ValueJson);
                            if (vals is not null)
                                foreach (var v in vals)
                                    if (tallies.ContainsKey(v)) tallies[v]++;
                        }
                    }
                    catch { /* skip malformed answer */ }
                }

                questionAnalytics.Add(new
                {
                    question.Id, question.Order, question.Type,
                    question.TextAr, question.TextEn,
                    AnsweredCount = answeredCount,
                    Tallies = tallies.Select(kv => new { Option = kv.Key, Count = kv.Value,
                        Percentage = answeredCount > 0 ? Math.Round((double)kv.Value / answeredCount * 100, 1) : 0 }),
                });
            }
            else if (question.Type == SurveyQuestionType.Rating)
            {
                var ratings = new List<double>();
                foreach (var answer in answers)
                {
                    try
                    {
                        var val = JsonSerializer.Deserialize<double>(answer.ValueJson);
                        ratings.Add(val);
                    }
                    catch { /* skip */ }
                }

                questionAnalytics.Add(new
                {
                    question.Id, question.Order, question.Type,
                    question.TextAr, question.TextEn,
                    AnsweredCount = answeredCount,
                    AverageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 2) : 0,
                    MinRating = ratings.Count > 0 ? ratings.Min() : 0,
                    MaxRating = ratings.Count > 0 ? ratings.Max() : 0,
                    Distribution = Enumerable.Range(1, 5).Select(r => new { Rating = r, Count = ratings.Count(v => (int)v == r) }),
                });
            }
            else // Text
            {
                var textAnswers = answers
                    .Select(a => { try { return JsonSerializer.Deserialize<string>(a.ValueJson); } catch { return null; } })
                    .Where(a => !string.IsNullOrWhiteSpace(a))
                    .ToList();

                questionAnalytics.Add(new
                {
                    question.Id, question.Order, question.Type,
                    question.TextAr, question.TextEn,
                    AnsweredCount = answeredCount,
                    SampleResponses = textAnswers.Take(10),
                    TotalTextResponses = textAnswers.Count,
                });
            }
        }

        // Word cloud data for text questions
        var wordCloudData = new List<object>();
        foreach (var question in survey.Questions.Where(q => q.Type == SurveyQuestionType.Text))
        {
            var textAnswers = responses
                .SelectMany(r => r.Answers)
                .Where(a => a.SurveyQuestionId == question.Id)
                .Select(a => { try { return JsonSerializer.Deserialize<string>(a.ValueJson); } catch { return null; } })
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();

            var wordFreq = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
                "have", "has", "had", "do", "does", "did", "will", "would", "could",
                "should", "may", "might", "shall", "can", "to", "of", "in", "for",
                "on", "with", "at", "by", "from", "as", "into", "about", "it", "its",
                "this", "that", "these", "those", "and", "but", "or", "not", "no",
                "so", "if", "then", "than", "too", "very", "just", "also", "i", "me",
                "my", "we", "our", "you", "your", "he", "she", "they", "them",
                "هو", "هي", "هم", "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه",
                "ذلك", "تلك", "أن", "لا", "ما", "لم", "كان", "كانت", "قد", "و", "أو",
            };

            foreach (var text in textAnswers)
            {
                var words = text!.Split(new[] { ' ', '\t', '\n', '\r', ',', '.', '!', '?', ';', ':', '(', ')', '[', ']', '{', '}', '"', '\'' },
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var word in words)
                {
                    if (word.Length < 2 || stopWords.Contains(word)) continue;
                    wordFreq.TryGetValue(word, out var count);
                    wordFreq[word] = count + 1;
                }
            }

            wordCloudData.Add(new
            {
                QuestionId = question.Id,
                question.Order,
                question.TextAr,
                question.TextEn,
                Words = wordFreq.OrderByDescending(kv => kv.Value).Take(50)
                    .Select(kv => new { Text = kv.Key, Value = kv.Value }),
            });
        }

        // Demographics breakdown
        var demographics = new
        {
            ByDepartment = responses.Where(r => !string.IsNullOrWhiteSpace(r.Department))
                .GroupBy(r => r.Department!).OrderByDescending(g => g.Count())
                .Select(g => new { Label = g.Key, Count = g.Count() }).ToList(),
            ByGender = responses.Where(r => !string.IsNullOrWhiteSpace(r.Gender))
                .GroupBy(r => r.Gender!).OrderByDescending(g => g.Count())
                .Select(g => new { Label = g.Key, Count = g.Count() }).ToList(),
        };

        // Response timeline (responses per day)
        var timeline = responses
            .GroupBy(r => r.SubmittedAtUtc.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .ToList();

        return Ok(new
        {
            survey.Id, survey.TitleAr, survey.TitleEn,
            survey.Status, survey.StartAtUtc, survey.EndAtUtc,
            TotalResponses = totalResponses,
            QuestionCount = survey.Questions.Count,
            ResponseRate = survey.EndAtUtc < DateTime.UtcNow && totalResponses > 0
                ? totalResponses : totalResponses,
            Questions = questionAnalytics,
            Timeline = timeline,
            WordCloud = wordCloudData,
            Demographics = demographics,
        });
    }

    // ── Export Excel ───────────────────────────────────────────────────────

    [HttpGet("{id:guid}/export.xlsx")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> ExportExcel(Guid id, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking().Include(s => s.Questions.OrderBy(q => q.Order)).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();

        var responses = await db.SurveyResponses
            .AsNoTracking()
            .Where(r => r.SurveyId == id)
            .Include(r => r.Answers)
            .OrderByDescending(r => r.SubmittedAtUtc)
            .ToListAsync(ct);

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("responses");

        ws.Cell(1, 1).Value = "submittedAtUtc";
        ws.Cell(1, 2).Value = "respondentObjectId";

        for (var i = 0; i < survey.Questions.Count; i++)
        {
            ws.Cell(1, 3 + i).Value = $"Q{i + 1}: {survey.Questions[i].TextEn}";
        }

        for (var r = 0; r < responses.Count; r++)
        {
            var row = 2 + r;
            ws.Cell(row, 1).Value = responses[r].SubmittedAtUtc.ToString("o");
            ws.Cell(row, 2).Value = responses[r].RespondentObjectId ?? "";

            var answerByQ = responses[r].Answers.ToDictionary(a => a.SurveyQuestionId, a => a.ValueJson);
            for (var i = 0; i < survey.Questions.Count; i++)
            {
                answerByQ.TryGetValue(survey.Questions[i].Id, out var val);
                ws.Cell(row, 3 + i).Value = val ?? "";
            }
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        var bytes = ms.ToArray();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"survey_{id:N}.xlsx");
    }

    // ── Export PDF ─────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/export.pdf")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> ExportPdf(Guid id, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();

        var responses = await db.SurveyResponses
            .AsNoTracking()
            .Where(r => r.SurveyId == id)
            .Include(r => r.Answers)
            .ToListAsync(ct);

        // Build HTML report
        var html = new System.Text.StringBuilder();
        html.Append("<!DOCTYPE html><html dir='rtl'><head><meta charset='utf-8'/>");
        html.Append("<style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl}");
        html.Append("h1{color:#1a365d;border-bottom:2px solid #2b6cb0;padding-bottom:10px}");
        html.Append("h2{color:#2b6cb0;margin-top:30px}");
        html.Append(".stats{display:flex;gap:20px;margin:20px 0}");
        html.Append(".stat{background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;flex:1;text-align:center}");
        html.Append(".stat-value{font-size:24px;font-weight:bold;color:#2b6cb0}");
        html.Append(".stat-label{font-size:12px;color:#718096;margin-top:4px}");
        html.Append("table{width:100%;border-collapse:collapse;margin:16px 0}");
        html.Append("th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:right}");
        html.Append("th{background:#edf2f7;font-weight:600}");
        html.Append(".bar{background:#e2e8f0;border-radius:4px;height:20px;margin:2px 0}");
        html.Append(".bar-fill{background:#3182ce;border-radius:4px;height:100%}");
        html.Append("</style></head><body>");

        html.Append($"<h1>{survey.TitleAr}</h1>");
        html.Append($"<p style='color:#718096'>{survey.TitleEn}</p>");

        html.Append("<div class='stats'>");
        html.Append($"<div class='stat'><div class='stat-value'>{responses.Count}</div><div class='stat-label'>إجمالي الردود</div></div>");
        html.Append($"<div class='stat'><div class='stat-value'>{survey.Questions.Count}</div><div class='stat-label'>عدد الأسئلة</div></div>");
        html.Append($"<div class='stat'><div class='stat-value'>{survey.Status}</div><div class='stat-label'>الحالة</div></div>");
        html.Append("</div>");

        foreach (var question in survey.Questions)
        {
            html.Append($"<h2>السؤال {question.Order}: {question.TextAr}</h2>");
            html.Append($"<p style='color:#718096;font-size:13px'>{question.TextEn}</p>");

            var answers = responses.SelectMany(r => r.Answers).Where(a => a.SurveyQuestionId == question.Id).ToList();

            if (question.Type == SurveyQuestionType.Single || question.Type == SurveyQuestionType.Multi)
            {
                var options = question.OptionsJson is not null
                    ? JsonSerializer.Deserialize<List<string>>(question.OptionsJson) ?? new()
                    : new List<string>();

                var tallies = options.ToDictionary(o => o, _ => 0);
                foreach (var answer in answers)
                {
                    try
                    {
                        if (question.Type == SurveyQuestionType.Single)
                        {
                            var val = JsonSerializer.Deserialize<string>(answer.ValueJson);
                            if (val is not null && tallies.ContainsKey(val)) tallies[val]++;
                        }
                        else
                        {
                            var vals = JsonSerializer.Deserialize<List<string>>(answer.ValueJson);
                            if (vals is not null) foreach (var v in vals) if (tallies.ContainsKey(v)) tallies[v]++;
                        }
                    }
                    catch { }
                }

                html.Append("<table><tr><th>الخيار</th><th>العدد</th><th>النسبة</th><th>الرسم البياني</th></tr>");
                foreach (var (opt, count) in tallies)
                {
                    var pct = answers.Count > 0 ? Math.Round((double)count / answers.Count * 100, 1) : 0;
                    html.Append($"<tr><td>{opt}</td><td>{count}</td><td>{pct}%</td>");
                    html.Append($"<td><div class='bar'><div class='bar-fill' style='width:{pct}%'></div></div></td></tr>");
                }
                html.Append("</table>");
            }
            else if (question.Type == SurveyQuestionType.Rating)
            {
                var ratings = new List<double>();
                foreach (var a in answers) { try { ratings.Add(JsonSerializer.Deserialize<double>(a.ValueJson)); } catch { } }
                var avg = ratings.Count > 0 ? Math.Round(ratings.Average(), 2) : 0;
                html.Append($"<p><strong>متوسط التقييم:</strong> {avg} / 5 ({ratings.Count} إجابات)</p>");
            }
            else
            {
                var texts = answers.Select(a => { try { return JsonSerializer.Deserialize<string>(a.ValueJson); } catch { return null; } })
                    .Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
                html.Append($"<p><strong>عدد الإجابات النصية:</strong> {texts.Count}</p>");
                if (texts.Count > 0)
                {
                    html.Append("<table><tr><th>#</th><th>الإجابة</th></tr>");
                    foreach (var (text, idx) in texts.Take(20).Select((t, i) => (t, i)))
                        html.Append($"<tr><td>{idx + 1}</td><td>{text}</td></tr>");
                    html.Append("</table>");
                }
            }
        }

        html.Append($"<p style='margin-top:40px;color:#a0aec0;font-size:11px;text-align:center'>تم إنشاء هذا التقرير في {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>");
        html.Append("</body></html>");

        var htmlBytes = System.Text.Encoding.UTF8.GetBytes(html.ToString());
        return File(htmlBytes, "text/html", $"survey_report_{id:N}.html");
    }

    // ── Survey Report for ReportsPage ─────────────────────────────────────

    [HttpGet("report")]
    [Authorize]
    public async Task<IActionResult> GetSurveyReport(
        [FromQuery] string? from = null,
        [FromQuery] string? to = null,
        CancellationToken ct = default)
    {
        var fromDate = DateTime.TryParse(from, out var f) ? f : DateTime.UtcNow.AddMonths(-3);
        var toDate = DateTime.TryParse(to, out var t2) ? t2.AddDays(1) : DateTime.UtcNow.AddDays(1);

        var surveys = await db.Surveys.AsNoTracking()
            .Where(s => s.CreatedAtUtc >= fromDate && s.CreatedAtUtc <= toDate)
            .ToListAsync(ct);

        var surveyIds = surveys.Select(s => s.Id).ToHashSet();
        var responseCounts = await db.SurveyResponses
            .Where(r => surveyIds.Contains(r.SurveyId))
            .GroupBy(r => r.SurveyId)
            .Select(g => new { SurveyId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var countMap = responseCounts.ToDictionary(x => x.SurveyId, x => x.Count);

        var rows = surveys.Select(s => new
        {
            s.Id, s.TitleAr, s.TitleEn, s.Type, s.Status,
            s.StartAtUtc, s.EndAtUtc,
            ResponseCount = countMap.GetValueOrDefault(s.Id, 0),
        }).OrderByDescending(s => s.ResponseCount).ToList();

        return Ok(new
        {
            TotalSurveys = surveys.Count,
            TotalActive = surveys.Count(s => s.Status == SurveyStatus.Active),
            TotalClosed = surveys.Count(s => s.Status == SurveyStatus.Closed),
            TotalResponses = countMap.Values.Sum(),
            AverageResponsesPerSurvey = surveys.Count > 0 ? Math.Round((double)countMap.Values.Sum() / surveys.Count, 1) : 0,
            rows,
        });
    }

    // ── Save as Template ──────────────────────────────────────────────────

    [HttpPost("{id:guid}/save-as-template")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> SaveAsTemplate(Guid id, [FromBody] SaveAsTemplateRequest req, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();

        var oid = User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        var template = new SurveyTemplate
        {
            NameAr = req.NameAr?.Trim() ?? survey.TitleAr,
            NameEn = req.NameEn?.Trim() ?? survey.TitleEn,
            DescriptionAr = req.DescriptionAr,
            DescriptionEn = req.DescriptionEn,
            Type = survey.Type,
            TargetAudience = survey.TargetAudience,
            CreatedByObjectId = oid,
            Questions = survey.Questions.Select(q => new SurveyTemplateQuestion
            {
                Order = q.Order,
                Type = q.Type,
                TextAr = q.TextAr,
                TextEn = q.TextEn,
                OptionsJson = q.OptionsJson,
            }).ToList(),
        };

        db.SurveyTemplates.Add(template);
        await db.SaveChangesAsync(ct);
        return Ok(new { template.Id });
    }

    public sealed record SaveAsTemplateRequest(string? NameAr, string? NameEn, string? DescriptionAr = null, string? DescriptionEn = null);

    // ── Templates CRUD ────────────────────────────────────────────────────

    [HttpGet("templates")]
    [Authorize]
    public async Task<IActionResult> ListTemplates(CancellationToken ct)
    {
        var templates = await db.SurveyTemplates.AsNoTracking()
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new
            {
                t.Id, t.NameAr, t.NameEn, t.DescriptionAr, t.DescriptionEn,
                t.Type, t.TargetAudience, t.CreatedAtUtc,
                QuestionCount = t.Questions.Count,
            })
            .ToListAsync(ct);
        return Ok(templates);
    }

    [HttpGet("templates/{templateId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetTemplate(Guid templateId, CancellationToken ct)
    {
        var template = await db.SurveyTemplates.AsNoTracking()
            .Include(t => t.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(t => t.Id == templateId, ct);
        return template is null ? NotFound() : Ok(template);
    }

    public sealed record CreateTemplateRequest(
        string NameAr, string NameEn,
        string? DescriptionAr, string? DescriptionEn,
        string Type, string TargetAudience,
        List<QuestionDto> Questions
    );

    [HttpPost("templates")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest req, CancellationToken ct)
    {
        var oid = User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        var template = new SurveyTemplate
        {
            NameAr = req.NameAr.Trim(),
            NameEn = req.NameEn.Trim(),
            DescriptionAr = req.DescriptionAr,
            DescriptionEn = req.DescriptionEn,
            Type = req.Type,
            TargetAudience = req.TargetAudience,
            CreatedByObjectId = oid,
            Questions = req.Questions
                .OrderBy(q => q.Order)
                .Select(q => new SurveyTemplateQuestion
                {
                    Order = q.Order,
                    Type = q.Type,
                    TextAr = q.TextAr.Trim(),
                    TextEn = q.TextEn.Trim(),
                    OptionsJson = q.Options is null ? null : JsonSerializer.Serialize(q.Options),
                })
                .ToList(),
        };

        db.SurveyTemplates.Add(template);
        await db.SaveChangesAsync(ct);
        return Ok(new { template.Id });
    }

    [HttpDelete("templates/{templateId:guid}")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> DeleteTemplate(Guid templateId, CancellationToken ct)
    {
        var template = await db.SurveyTemplates
            .Include(t => t.Questions)
            .FirstOrDefaultAsync(t => t.Id == templateId, ct);
        if (template is null) return NotFound();

        db.SurveyTemplateQuestions.RemoveRange(template.Questions);
        db.SurveyTemplates.Remove(template);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Email Results ──────────────────────────────────────────────────────

    public sealed record EmailResultsRequest(List<string> Recipients, string? MessageAr = null, string? MessageEn = null);

    [HttpPost("{id:guid}/email-results")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> EmailResults(Guid id, [FromBody] EmailResultsRequest req, CancellationToken ct)
    {
        if (req.Recipients is null || req.Recipients.Count == 0)
            return BadRequest(new { code = "NO_RECIPIENTS" });

        var survey = await db.Surveys.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();

        var responseCount = await db.SurveyResponses.CountAsync(r => r.SurveyId == id, ct);

        var payloads = req.Recipients
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => new NotificationPayload(
                RecipientObjectId: "",
                RecipientEmail: email.Trim(),
                Type: "SurveyResults",
                TitleAr: $"نتائج استبيان: {survey.TitleAr}",
                TitleEn: $"Survey Results: {survey.TitleEn}",
                BodyAr: req.MessageAr ?? $"تم إرسال نتائج الاستبيان ({responseCount} رد). يمكنك مراجعة التفاصيل عبر المنصة.",
                BodyEn: req.MessageEn ?? $"Survey results have been shared ({responseCount} responses). You can review the details on the platform.",
                EntityType: "Survey",
                EntityId: survey.Id,
                ActionUrl: $"/surveys"
            ))
            .ToList();

        if (payloads.Count > 0)
            await notificationService.NotifyManyAsync(payloads, ct);

        return Ok(new { SentCount = payloads.Count });
    }

    // ── Lucky Draw / Raffle ─────────────────────────────────────────────

    public sealed record DrawWinnersRequest(int Count = 1);

    [HttpPost("{id:guid}/draw-winners")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> DrawWinners(Guid id, [FromBody] DrawWinnersRequest req, CancellationToken ct)
    {
        var survey = await db.Surveys.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
        if (survey is null) return NotFound();
        if (!survey.AllowLuckyDraw) return BadRequest(new { code = "LUCKY_DRAW_NOT_ENABLED" });

        var count = Math.Clamp(req.Count, 1, 100);

        var responses = await db.SurveyResponses
            .AsNoTracking()
            .Where(r => r.SurveyId == id)
            .Select(r => new
            {
                r.Id,
                r.RespondentObjectId,
                r.RespondentName,
                r.RespondentEmail,
                r.EmployeeId,
                r.Department,
                r.SubmittedAtUtc,
            })
            .ToListAsync(ct);

        if (responses.Count == 0)
            return BadRequest(new { code = "NO_RESPONSES" });

        var winnersCount = Math.Min(count, responses.Count);
        var winners = responses
            .OrderBy(_ => Guid.NewGuid())
            .Take(winnersCount)
            .Select(r => new
            {
                r.Id,
                r.RespondentName,
                r.RespondentEmail,
                r.EmployeeId,
                r.Department,
                r.SubmittedAtUtc,
            })
            .ToList();

        return Ok(new
        {
            surveyId = id,
            surveyTitleAr = survey.TitleAr,
            surveyTitleEn = survey.TitleEn,
            totalResponses = responses.Count,
            winnersCount,
            winners,
            drawnAtUtc = DateTime.UtcNow,
        });
    }
}
