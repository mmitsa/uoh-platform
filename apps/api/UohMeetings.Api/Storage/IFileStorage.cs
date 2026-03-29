namespace UohMeetings.Api.Storage;

public sealed record PresignUploadRequest(string BucketOrContainer, string ObjectKey, string ContentType);
public sealed record PresignResult(string Url, IReadOnlyDictionary<string, string> Headers, DateTime ExpiresAtUtc);

public interface IFileStorage
{
    string Provider { get; }
    Task EnsureContainerAsync(string bucketOrContainer, CancellationToken ct);
    Task<PresignResult> PresignUploadAsync(PresignUploadRequest request, TimeSpan ttl, CancellationToken ct);
    Task<PresignResult> PresignDownloadAsync(string bucketOrContainer, string objectKey, TimeSpan ttl, CancellationToken ct);
    Task UploadAsync(string bucketOrContainer, string objectKey, string contentType, byte[] bytes, CancellationToken ct);
}

