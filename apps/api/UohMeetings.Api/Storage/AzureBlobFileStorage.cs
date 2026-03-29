using Azure.Storage.Blobs;
using Azure.Storage.Sas;

namespace UohMeetings.Api.Storage;

public sealed class AzureBlobFileStorage(IConfiguration config) : IFileStorage
{
    public string Provider => "azure";

    private BlobServiceClient CreateClient()
    {
        var cs = config["Storage:AzureBlob:ConnectionString"];
        if (string.IsNullOrWhiteSpace(cs))
            throw new InvalidOperationException("AzureBlob connection string is not configured.");
        return new BlobServiceClient(cs);
    }

    public async Task EnsureContainerAsync(string bucketOrContainer, CancellationToken ct)
    {
        var svc = CreateClient();
        var container = svc.GetBlobContainerClient(bucketOrContainer);
        await container.CreateIfNotExistsAsync(cancellationToken: ct);
    }

    public async Task<PresignResult> PresignUploadAsync(PresignUploadRequest request, TimeSpan ttl, CancellationToken ct)
    {
        var svc = CreateClient();
        var container = svc.GetBlobContainerClient(request.BucketOrContainer);
        await container.CreateIfNotExistsAsync(cancellationToken: ct);

        var blob = container.GetBlobClient(request.ObjectKey);
        if (!blob.CanGenerateSasUri)
            throw new InvalidOperationException("Blob client cannot generate SAS. Use a connection string with account key.");

        var sas = new BlobSasBuilder
        {
            BlobContainerName = request.BucketOrContainer,
            BlobName = request.ObjectKey,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(ttl),
        };
        sas.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

        var uri = blob.GenerateSasUri(sas);
        var headers = new Dictionary<string, string> { ["x-ms-blob-type"] = "BlockBlob", ["Content-Type"] = request.ContentType };
        return new PresignResult(uri.ToString(), headers, sas.ExpiresOn.UtcDateTime);
    }

    public Task<PresignResult> PresignDownloadAsync(string bucketOrContainer, string objectKey, TimeSpan ttl, CancellationToken ct)
    {
        var svc = CreateClient();
        var container = svc.GetBlobContainerClient(bucketOrContainer);
        var blob = container.GetBlobClient(objectKey);

        if (!blob.CanGenerateSasUri)
            throw new InvalidOperationException("Blob client cannot generate SAS. Use a connection string with account key.");

        var sas = new BlobSasBuilder
        {
            BlobContainerName = bucketOrContainer,
            BlobName = objectKey,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(ttl),
        };
        sas.SetPermissions(BlobSasPermissions.Read);

        var uri = blob.GenerateSasUri(sas);
        return Task.FromResult(new PresignResult(uri.ToString(), new Dictionary<string, string>(), sas.ExpiresOn.UtcDateTime));
    }

    public async Task UploadAsync(string bucketOrContainer, string objectKey, string contentType, byte[] bytes, CancellationToken ct)
    {
        var svc = CreateClient();
        var container = svc.GetBlobContainerClient(bucketOrContainer);
        await container.CreateIfNotExistsAsync(cancellationToken: ct);

        var blob = container.GetBlobClient(objectKey);
        using var ms = new MemoryStream(bytes);
        await blob.UploadAsync(ms, overwrite: true, cancellationToken: ct);
        await blob.SetHttpHeadersAsync(new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
    }
}

