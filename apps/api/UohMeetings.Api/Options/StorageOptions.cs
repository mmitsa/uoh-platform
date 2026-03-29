namespace UohMeetings.Api.Options;

public sealed class StorageOptions
{
    public const string Section = "Storage";
    public string DefaultProvider { get; set; } = "minio";
    public MinioOptions Minio { get; set; } = new();
    public AzureBlobOptions AzureBlob { get; set; } = new();
}

public sealed class MinioOptions
{
    public string Endpoint { get; set; } = "localhost:9000";
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSsl { get; set; }
    public string DefaultBucket { get; set; } = "uoh-meetings";
}

public sealed class AzureBlobOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DefaultContainer { get; set; } = "uoh-meetings";
}
