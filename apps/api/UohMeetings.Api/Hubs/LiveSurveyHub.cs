using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Hubs;

/// <summary>
/// SignalR hub for real-time live survey sessions.
/// AllowAnonymous because participants scan a QR code — they authenticate via joinCode / presenterKey.
/// </summary>
[AllowAnonymous]
public sealed class LiveSurveyHub(IServiceScopeFactory scopeFactory) : Hub
{
    private static string PresenterGroup(Guid sessionId) => $"live:{sessionId}:presenter";
    private static string ParticipantsGroup(Guid sessionId) => $"live:{sessionId}:participants";
    private static string AllGroup(Guid sessionId) => $"live:{sessionId}:all";

    /// <summary>Presenter joins with sessionId + presenterKey. Receives full session state.</summary>
    public async Task JoinAsPresenter(Guid sessionId, string presenterKey)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        var session = await svc.GetSessionAsync(sessionId);
        if (session.PresenterKey != presenterKey)
        {
            await Clients.Caller.SendAsync("Error", "Invalid presenter key.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, PresenterGroup(sessionId));
        await Groups.AddToGroupAsync(Context.ConnectionId, AllGroup(sessionId));
        Context.Items["sessionId"] = sessionId;
        Context.Items["role"] = "presenter";

        await Clients.Caller.SendAsync("SessionState", new
        {
            session.Id,
            session.SurveyId,
            session.JoinCode,
            session.Status,
            session.CurrentQuestionIndex,
            session.ParticipantCount,
            session.AcceptingVotes,
            Questions = session.Survey?.Questions.Select(q => new
            {
                q.Id,
                q.Order,
                q.Type,
                q.TextAr,
                q.TextEn,
                q.OptionsJson,
            }),
        });
    }

    /// <summary>Participant joins with joinCode. Receives current question.</summary>
    public async Task JoinAsParticipant(string joinCode)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        var session = await svc.GetByJoinCodeAsync(joinCode);
        if (session is null)
        {
            await Clients.Caller.SendAsync("Error", "Session not found.");
            return;
        }

        await svc.IncrementParticipantCountAsync(session.Id);

        await Groups.AddToGroupAsync(Context.ConnectionId, ParticipantsGroup(session.Id));
        await Groups.AddToGroupAsync(Context.ConnectionId, AllGroup(session.Id));
        Context.Items["sessionId"] = session.Id;
        Context.Items["role"] = "participant";

        var updatedSession = await svc.GetSessionAsync(session.Id);

        // Notify presenter about new participant count
        await Clients.Group(PresenterGroup(session.Id))
            .SendAsync("ParticipantCountChanged", new { count = updatedSession.ParticipantCount });

        // Send current state to participant
        object? currentQuestion = null;
        if (updatedSession.CurrentQuestionIndex >= 0 && updatedSession.Survey?.Questions is { } questions)
        {
            var q = questions.ElementAtOrDefault(updatedSession.CurrentQuestionIndex);
            if (q is not null)
            {
                currentQuestion = new { q.Id, q.Order, q.Type, q.TextAr, q.TextEn, q.OptionsJson };
            }
        }

        await Clients.Caller.SendAsync("SessionState", new
        {
            updatedSession.Id,
            updatedSession.Status,
            updatedSession.CurrentQuestionIndex,
            updatedSession.AcceptingVotes,
            CurrentQuestion = currentQuestion,
        });
    }

    /// <summary>Presenter advances to next question.</summary>
    public async Task NextQuestion(Guid sessionId, string presenterKey)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        await svc.AdvanceQuestionAsync(sessionId, presenterKey, 1);
        await BroadcastQuestionChanged(svc, sessionId);
    }

    /// <summary>Presenter goes to previous question.</summary>
    public async Task PreviousQuestion(Guid sessionId, string presenterKey)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        await svc.AdvanceQuestionAsync(sessionId, presenterKey, -1);
        await BroadcastQuestionChanged(svc, sessionId);
    }

    /// <summary>Presenter toggles accepting votes on/off.</summary>
    public async Task SetVotingState(Guid sessionId, string presenterKey, bool acceptingVotes)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        await svc.SetAcceptingVotesAsync(sessionId, presenterKey, acceptingVotes);

        await Clients.Group(AllGroup(sessionId))
            .SendAsync("VotingStateChanged", new { acceptingVotes });
    }

    /// <summary>Participant submits a vote.</summary>
    public async Task SubmitVote(Guid sessionId, Guid questionId, string valueJson, string fingerprint)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        try
        {
            var tallies = await svc.RecordVoteAsync(sessionId, questionId, valueJson, fingerprint);

            // Broadcast updated tallies to presenter and all participants
            await Clients.Group(AllGroup(sessionId))
                .SendAsync("VoteTallyUpdated", new { questionId, tallies });

            // Confirm to voter
            await Clients.Caller.SendAsync("VoteRecorded", new { questionId });
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    /// <summary>Presenter ends the session.</summary>
    public async Task EndSession(Guid sessionId, string presenterKey)
    {
        using var scope = scopeFactory.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

        await svc.EndSessionAsync(sessionId, presenterKey);

        await Clients.Group(AllGroup(sessionId)).SendAsync("SessionEnded");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Context.Items.TryGetValue("sessionId", out var raw) && raw is Guid sessionId
            && Context.Items.TryGetValue("role", out var roleRaw) && roleRaw is string role && role == "participant")
        {
            using var scope = scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ILiveSurveyService>();

            await svc.DecrementParticipantCountAsync(sessionId);

            var session = await svc.GetSessionAsync(sessionId);
            await Clients.Group(PresenterGroup(sessionId))
                .SendAsync("ParticipantCountChanged", new { count = session.ParticipantCount });
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task BroadcastQuestionChanged(ILiveSurveyService svc, Guid sessionId)
    {
        var session = await svc.GetSessionAsync(sessionId);
        object? questionData = null;
        Dictionary<string, int>? tallies = null;

        if (session.CurrentQuestionIndex >= 0 && session.Survey?.Questions is { } questions)
        {
            var q = questions.ElementAtOrDefault(session.CurrentQuestionIndex);
            if (q is not null)
            {
                questionData = new { q.Id, q.Order, q.Type, q.TextAr, q.TextEn, q.OptionsJson };
                tallies = await svc.GetTalliesAsync(sessionId, q.Id);
            }
        }

        await Clients.Group(AllGroup(sessionId)).SendAsync("QuestionChanged", new
        {
            session.CurrentQuestionIndex,
            session.AcceptingVotes,
            session.Status,
            Question = questionData,
            Tallies = tallies,
        });
    }
}
