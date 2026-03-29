using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/profile")]
[Authorize]
public sealed class ProfileController(IProfileService profileService, IConfiguration config) : ControllerBase
{
    private string GetOid() =>
        User.FindFirst("oid")?.Value
        ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var profile = await profileService.GetProfileAsync(GetOid(), ct);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var profile = await profileService.UpdateProfileAsync(GetOid(), req, ct);
        return Ok(profile);
    }

    [HttpPut("avatar")]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto dto, CancellationToken ct)
    {
        var profile = await profileService.UpdateAvatarAsync(GetOid(), dto.FileId, ct);
        return Ok(profile);
    }

    [HttpDelete("avatar")]
    public async Task<IActionResult> RemoveAvatar(CancellationToken ct)
    {
        await profileService.RemoveAvatarAsync(GetOid(), ct);
        return NoContent();
    }

    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences(CancellationToken ct)
    {
        var pref = await profileService.GetPreferencesAsync(GetOid(), ct);
        return Ok(pref);
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest req, CancellationToken ct)
    {
        var pref = await profileService.UpdatePreferencesAsync(GetOid(), req, ct);
        return Ok(pref);
    }

    [HttpPost("change-password")]
    public IActionResult ChangePassword()
    {
        var tenantId = config["AzureAd:TenantId"] ?? config["Integrations:Teams:TenantId"] ?? "common";
        var url = $"https://account.activedirectory.windowsazure.com/ChangePassword.aspx?tenantid={tenantId}";
        return Ok(new { url });
    }

    public sealed record UpdateAvatarDto(Guid FileId);
}
