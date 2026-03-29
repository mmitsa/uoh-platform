namespace UohMeetings.Api.Exceptions;

public sealed class NotFoundException(string entity, object key)
    : DomainException($"{entity} with key '{key}' was not found.", "NOT_FOUND")
{
    public string Entity { get; } = entity;
    public object Key { get; } = key;
}
