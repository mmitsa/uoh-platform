using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

/// <summary>Internal chat/messaging system.</summary>
[ApiController]
[Route("api/v1/chat")]
[Authorize]
public sealed class ChatController(IChatService chatService) : ControllerBase
{
    private string GetUserOid() =>
        User.FindFirst("oid")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

    private string GetUserName() =>
        User.FindFirst("name")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";

    private string GetUserEmail() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
        ?? User.FindFirst("email")?.Value
        ?? User.FindFirst("preferred_username")?.Value ?? "";

    // GET /api/v1/chat/conversations
    [HttpGet("conversations")]
    public async Task<IActionResult> ListConversations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (total, items) = await chatService.GetUserConversationsAsync(GetUserOid(), page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }

    // POST /api/v1/chat/conversations
    public sealed record CreateConversationDto(
        string Type,
        string? TargetOid,
        string? TargetDisplay,
        string? TargetEmail,
        string? NameAr,
        string? NameEn,
        List<ChatContactDto>? Participants);

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto, CancellationToken ct)
    {
        var userOid = GetUserOid();
        var userName = GetUserName();
        var userEmail = GetUserEmail();

        if (dto.Type == "direct")
        {
            if (string.IsNullOrWhiteSpace(dto.TargetOid))
                return BadRequest(new { error = "TargetOid is required for direct conversations." });

            var conversation = await chatService.GetOrCreateDirectAsync(
                userOid, userName, userEmail,
                dto.TargetOid, dto.TargetDisplay ?? "", dto.TargetEmail ?? "",
                ct);
            return Ok(conversation);
        }

        if (dto.Type == "group")
        {
            if (string.IsNullOrWhiteSpace(dto.NameAr) || string.IsNullOrWhiteSpace(dto.NameEn))
                return BadRequest(new { error = "NameAr and NameEn are required for group conversations." });

            var conversation = await chatService.CreateGroupAsync(
                userOid, userName, userEmail,
                dto.NameAr, dto.NameEn,
                dto.Participants ?? new List<ChatContactDto>(),
                ct);
            return Ok(conversation);
        }

        return BadRequest(new { error = "Type must be 'direct' or 'group'." });
    }

    // GET /api/v1/chat/conversations/{id}/messages
    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<IActionResult> ListMessages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var (total, items) = await chatService.GetMessagesAsync(id, GetUserOid(), page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }

    // POST /api/v1/chat/conversations/{id}/messages
    public sealed record SendMessageDto(string Content, string? Type, List<Guid>? AttachmentFileIds);

    [HttpPost("conversations/{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendMessageDto dto,
        CancellationToken ct)
    {
        var message = await chatService.SendMessageAsync(
            id, GetUserOid(), GetUserName(),
            dto.Content, dto.Type ?? "text", dto.AttachmentFileIds,
            ct);
        return Ok(message);
    }

    // POST /api/v1/chat/conversations/{id}/read
    [HttpPost("conversations/{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        await chatService.MarkAsReadAsync(id, GetUserOid(), ct);
        return Ok();
    }

    // GET /api/v1/chat/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct)
    {
        var count = await chatService.GetTotalUnreadCountAsync(GetUserOid(), ct);
        return Ok(new { count });
    }

    // GET /api/v1/chat/search?q=...
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new { page, pageSize, total = 0, items = Array.Empty<object>() });

        var (total, items) = await chatService.SearchArchiveAsync(GetUserOid(), q, page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }

    // GET /api/v1/chat/contacts
    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts(CancellationToken ct)
    {
        var contacts = await chatService.GetContactsAsync(GetUserOid(), ct);
        return Ok(contacts);
    }

    // GET /api/v1/chat/my-attachments
    [HttpGet("my-attachments")]
    public async Task<IActionResult> MyAttachments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (total, items) = await chatService.GetUserAttachmentsAsync(GetUserOid(), page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }
}
