using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

/// <summary>Dashboard statistics, layout, widgets, and external data endpoints.</summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public sealed class DashboardController(
    IDashboardService dashboardService,
    IDashboardLayoutService layoutService,
    IExternalDataService externalDataService) : ControllerBase
{
    private string ObjectId => User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier") ?? "";

    /// <summary>Get aggregated platform statistics, optionally filtered by committee.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] Guid? committeeId, CancellationToken ct)
    {
        // Verify the user is a member of the requested committee
        if (committeeId.HasValue)
        {
            var isMember = await layoutService.IsUserCommitteeMemberAsync(ObjectId, committeeId.Value, ct);
            if (!isMember)
                return Forbid();
        }

        var stats = await dashboardService.GetStatsAsync(committeeId, ct);
        return Ok(stats);
    }

    // ── Widget definitions ──────────────────────────────────────────────

    /// <summary>Get available widgets for the current user.</summary>
    [HttpGet("widgets")]
    public async Task<IActionResult> GetWidgets(CancellationToken ct)
    {
        var widgets = await layoutService.GetAvailableWidgetsAsync(ObjectId, ct);
        return Ok(widgets);
    }

    // ── Layout ──────────────────────────────────────────────────────────

    /// <summary>Get the current user's dashboard layout.</summary>
    [HttpGet("layout")]
    public async Task<IActionResult> GetLayout(CancellationToken ct)
    {
        var layout = await layoutService.GetUserLayoutAsync(ObjectId, ct);
        return Ok(layout);
    }

    /// <summary>Save the current user's dashboard layout.</summary>
    [HttpPut("layout")]
    public async Task<IActionResult> SaveLayout([FromBody] SaveLayoutRequest request, CancellationToken ct)
    {
        await layoutService.SaveUserLayoutAsync(ObjectId, request, ct);
        return NoContent();
    }

    /// <summary>Reset the current user's dashboard layout to the role default.</summary>
    [HttpPost("layout/reset")]
    public async Task<IActionResult> ResetLayout(CancellationToken ct)
    {
        await layoutService.ResetToDefaultAsync(ObjectId, ct);
        return NoContent();
    }

    // ── External Data Sources ───────────────────────────────────────────

    /// <summary>List all external data sources.</summary>
    [HttpGet("external-sources")]
    [Authorize(Policy = "Permission.admin.view")]
    public async Task<IActionResult> GetExternalSources(CancellationToken ct)
    {
        var sources = await externalDataService.GetAllSourcesAsync(ct);
        return Ok(sources);
    }

    /// <summary>Create a new external data source.</summary>
    [HttpPost("external-sources")]
    [Authorize(Policy = "Permission.admin.view")]
    public async Task<IActionResult> CreateExternalSource([FromBody] CreateExternalSourceRequest request, CancellationToken ct)
    {
        var source = await externalDataService.CreateSourceAsync(request, ObjectId, ct);
        return Ok(source);
    }

    /// <summary>Update an external data source.</summary>
    [HttpPut("external-sources/{id:guid}")]
    [Authorize(Policy = "Permission.admin.view")]
    public async Task<IActionResult> UpdateExternalSource(Guid id, [FromBody] UpdateExternalSourceRequest request, CancellationToken ct)
    {
        var source = await externalDataService.UpdateSourceAsync(id, request, ct);
        return Ok(source);
    }

    /// <summary>Delete an external data source.</summary>
    [HttpDelete("external-sources/{id:guid}")]
    [Authorize(Policy = "Permission.admin.view")]
    public async Task<IActionResult> DeleteExternalSource(Guid id, CancellationToken ct)
    {
        await externalDataService.DeleteSourceAsync(id, ct);
        return NoContent();
    }

    /// <summary>Fetch data from an external source.</summary>
    [HttpGet("external-sources/{id:guid}/data")]
    public async Task<IActionResult> FetchExternalData(Guid id, CancellationToken ct)
    {
        var data = await externalDataService.FetchDataAsync(id, ct);
        return Ok(data);
    }

    /// <summary>Test an external API connection.</summary>
    [HttpPost("external-sources/test")]
    [Authorize(Policy = "Permission.admin.view")]
    public async Task<IActionResult> TestExternalConnection([FromBody] TestConnectionRequest request, CancellationToken ct)
    {
        var result = await externalDataService.TestConnectionAsync(request, ct);
        return Ok(result);
    }

    // ── University Rankings ─────────────────────────────────────────────

    /// <summary>Get university rankings data (demo: static data).</summary>
    [HttpGet("rankings")]
    public IActionResult GetRankings()
    {
        // Static rankings data — in production, these would come from an external provider or DB
        var rankings = new[]
        {
            new { Source = "QS World University Rankings", Rank = 601, PreviousRank = 650, Year = 2025, Change = 49 },
            new { Source = "Times Higher Education (THE)", Rank = 801, PreviousRank = 801, Year = 2025, Change = 0 },
            new { Source = "Academic Ranking (Shanghai/ARWU)", Rank = 901, PreviousRank = 0, Year = 2025, Change = 0 },
        };
        return Ok(rankings);
    }
}
