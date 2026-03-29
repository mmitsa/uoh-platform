namespace UohMeetings.Api.Exceptions;

public abstract class DomainException(string message, string? code = null) : Exception(message)
{
    public string? Code { get; } = code;
}
