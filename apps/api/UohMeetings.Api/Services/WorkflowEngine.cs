using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public sealed class WorkflowEngine(AppDbContext db)
{
    public sealed record Transition(string Action, string From, string To, string? RequiredRole);
    public sealed record Definition(string InitialState, IReadOnlyList<Transition> Transitions);

    public async Task<WorkflowTemplate> CreateTemplateAsync(string name, string domain, Definition def, CancellationToken ct, string? builderMetadataJson = null)
    {
        var json = JsonSerializer.Serialize(def, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var t = new WorkflowTemplate { Name = name.Trim(), Domain = domain.Trim(), DefinitionJson = json, BuilderMetadataJson = builderMetadataJson };
        db.WorkflowTemplates.Add(t);
        await db.SaveChangesAsync(ct);
        return t;
    }

    public async Task<WorkflowInstance> StartInstanceAsync(Guid templateId, string domain, Guid entityId, CancellationToken ct)
    {
        var template = await db.WorkflowTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == templateId, ct);
        if (template is null) throw new InvalidOperationException("WORKFLOW_TEMPLATE_NOT_FOUND");

        var def = ParseDefinition(template.DefinitionJson);
        var instance = new WorkflowInstance
        {
            TemplateId = templateId,
            Domain = domain,
            EntityId = entityId,
            CurrentState = def.InitialState,
            Status = WorkflowStatus.Active,
        };
        instance.History.Add(new WorkflowInstanceHistory
        {
            InstanceId = instance.Id,
            FromState = "",
            ToState = def.InitialState,
            Action = "start",
        });

        db.WorkflowInstances.Add(instance);
        await db.SaveChangesAsync(ct);
        return instance;
    }

    public async Task<WorkflowInstance> ApplyAsync(Guid instanceId, string action, ClaimsPrincipal actor, CancellationToken ct)
    {
        var instance = await db.WorkflowInstances
            .Include(i => i.History)
            .FirstOrDefaultAsync(i => i.Id == instanceId, ct);

        if (instance is null) throw new InvalidOperationException("WORKFLOW_INSTANCE_NOT_FOUND");

        var template = await db.WorkflowTemplates.AsNoTracking().FirstAsync(t => t.Id == instance.TemplateId, ct);
        var def = ParseDefinition(template.DefinitionJson);

        var transition = def.Transitions.FirstOrDefault(t =>
            t.Action.Equals(action, StringComparison.OrdinalIgnoreCase) &&
            t.From.Equals(instance.CurrentState, StringComparison.OrdinalIgnoreCase));

        if (transition is null) throw new InvalidOperationException("WORKFLOW_TRANSITION_NOT_ALLOWED");

        if (!string.IsNullOrWhiteSpace(transition.RequiredRole))
        {
            var roles = actor.FindAll(ClaimTypes.Role).Select(r => r.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (!roles.Contains(transition.RequiredRole))
                throw new UnauthorizedAccessException("WORKFLOW_ROLE_REQUIRED");
        }

        var from = instance.CurrentState;
        instance.CurrentState = transition.To;
        instance.UpdatedAtUtc = DateTime.UtcNow;

        instance.History.Add(new WorkflowInstanceHistory
        {
            InstanceId = instance.Id,
            FromState = from,
            ToState = transition.To,
            Action = transition.Action,
            ActorObjectId = actor.FindFirstValue("oid") ?? actor.FindFirstValue(ClaimTypes.NameIdentifier),
            ActorDisplayName = actor.FindFirstValue("name") ?? actor.FindFirstValue(ClaimTypes.Name),
        });

        await db.SaveChangesAsync(ct);
        return instance;
    }

    private static Definition ParseDefinition(string json)
    {
        var def = JsonSerializer.Deserialize<Definition>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (def is null || string.IsNullOrWhiteSpace(def.InitialState))
            throw new InvalidOperationException("WORKFLOW_DEFINITION_INVALID");
        return def;
    }
}

