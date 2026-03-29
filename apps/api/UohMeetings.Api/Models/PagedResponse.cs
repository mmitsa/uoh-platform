namespace UohMeetings.Api.Models;

public sealed class PagedResponse<T>
{
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int Total { get; init; }
    public IReadOnlyList<T> Items { get; init; } = [];

    public static PagedResponse<T> Create(int page, int pageSize, int total, IReadOnlyList<T> items) =>
        new() { Page = page, PageSize = pageSize, Total = total, Items = items };
}
