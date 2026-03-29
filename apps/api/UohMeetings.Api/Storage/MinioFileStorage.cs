using Minio;
using Minio.DataModel.Args;

namespace UohMeetings.Api.Storage;

public sealed class MinioFileStorage(IConfiguration config) : IFileStorage
{
    public string Provider => "minio";

    private IMinioClient CreateClient()
    {
        var endpoint = config["Storage:Minio:Endpoint"] ?? "localhost:9000";
        var accessKey = config["Storage:Minio:AccessKey"] ?? "minioadmin";
        var secretKey = config["Storage:Minio:SecretKey"] ?? "minioadmin";
        var secure = config.GetValue("Storage:Minio:Secure", false);

        return new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey)
            .WithSSL(secure)
            .Build();
    }

    public async Task EnsureContainerAsync(string bucketOrContainer, CancellationToken ct)
    {
        var client = CreateClient();
        var exists = await client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketOrContainer), ct);
        if (!exists)
        {
            await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketOrContainer), ct);
        }
    }

    public async Task<PresignResult> PresignUploadAsync(PresignUploadRequest request, TimeSpan ttl, CancellationToken ct)
    {
        var client = CreateClient();
        await EnsureContainerAsync(request.BucketOrContainer, ct);

        var expires = DateTime.UtcNow.Add(ttl);
        var url = await client.PresignedPutObjectAsync(new PresignedPutObjectArgs()
            .WithBucket(request.BucketOrContainer)
            .WithObject(request.ObjectKey)
            .WithExpiry((int)ttl.TotalSeconds));

        // For MinIO/S3 PUT presign, Content-Type header should be set by client.
        var headers = new Dictionary<string, string> { ["Content-Type"] = request.ContentType };
        return new PresignResult(url, headers, expires);
    }

    public async Task<PresignResult> PresignDownloadAsync(string bucketOrContainer, string objectKey, TimeSpan ttl, CancellationToken ct)
    {
        var client = CreateClient();
        await EnsureContainerAsync(bucketOrContainer, ct);

        var expires = DateTime.UtcNow.Add(ttl);
        var url = await client.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(bucketOrContainer)
            .WithObject(objectKey)
            .WithExpiry((int)ttl.TotalSeconds));

        return new PresignResult(url, new Dictionary<string, string>(), expires);
    }

    public async Task UploadAsync(string bucketOrContainer, string objectKey, string contentType, byte[] bytes, CancellationToken ct)
    {
        var client = CreateClient();
        await EnsureContainerAsync(bucketOrContainer, ct);

        using var ms = new MemoryStream(bytes);
        var args = new PutObjectArgs()
            .WithBucket(bucketOrContainer)
            .WithObject(objectKey)
            .WithStreamData(ms)
            .WithObjectSize(ms.Length)
            .WithContentType(contentType);

        await client.PutObjectAsync(args, ct);
    }
}

