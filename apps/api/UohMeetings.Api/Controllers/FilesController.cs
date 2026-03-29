using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Storage;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/files")]
[Authorize]
public sealed class FilesController(AppDbContext db, IFileStorage storage, IConfiguration config) : ControllerBase
{
    public sealed record PresignUploadDto(string FileName, string ContentType, long SizeBytes, FileClassification Classification, string? Prefix);

    [HttpPost("presign-upload")]
    public async Task<IActionResult> PresignUpload([FromBody] PresignUploadDto dto, CancellationToken ct)
    {
        var bucket = config["Storage:Minio:Bucket"] ?? "uoh-meetings";
        var container = config["Storage:AzureBlob:Container"] ?? "uoh-meetings";
        var bucketOrContainer = storage.Provider == "azure" ? container : bucket;

        var safeName = dto.FileName.Trim();
        var ext = Path.GetExtension(safeName);
        var key = $"{(dto.Prefix ?? "misc").Trim().Trim('/')}/{Guid.NewGuid():N}{ext}";

        var presign = await storage.PresignUploadAsync(
            new PresignUploadRequest(bucketOrContainer, key, dto.ContentType),
            ttl: TimeSpan.FromMinutes(15),
            ct
        );

        var stored = new StoredFile
        {
            Provider = storage.Provider,
            BucketOrContainer = bucketOrContainer,
            ObjectKey = key,
            FileName = safeName,
            ContentType = dto.ContentType,
            SizeBytes = dto.SizeBytes,
            Classification = dto.Classification,
        };

        db.StoredFiles.Add(stored);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            fileId = stored.Id,
            presign.Url,
            presign.Headers,
            presign.ExpiresAtUtc,
        });
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> PresignDownload(Guid id, CancellationToken ct)
    {
        var file = await db.StoredFiles.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (file is null) return NotFound();

        var presign = await storage.PresignDownloadAsync(file.BucketOrContainer, file.ObjectKey, TimeSpan.FromMinutes(10), ct);
        return Ok(new { presign.Url, presign.Headers, presign.ExpiresAtUtc });
    }
}

