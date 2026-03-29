namespace UohMeetings.Api.Models;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; } = true;
    public T? Data { get; init; }

    public static ApiResponse<T> Ok(T data) => new() { Data = data };
}

public sealed class ApiResponse
{
    public bool Success { get; init; } = true;

    public static ApiResponse Ok() => new();
    public static ApiResponse<T> Ok<T>(T data) => new() { Data = data };
}
