using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UohMeetings.Api.Data;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    public sealed record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });

        var user = await db.AppUsers
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user is null || string.IsNullOrEmpty(user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        // Update last login
        user.LastLoginAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Collect roles
        var now = DateTime.UtcNow;
        var roles = user.UserRoles
            .Where(ur => ur.Role is not null && ur.Role.IsActive && (ur.ExpiresAtUtc == null || ur.ExpiresAtUtc > now))
            .Select(ur => ur.Role!.Key)
            .ToList();

        // Generate JWT token
        var token = GenerateToken(user.Id, user.ObjectId, user.DisplayNameEn, user.Email, roles);

        return Ok(new
        {
            user = new
            {
                id = user.ObjectId,
                displayName = user.DisplayNameAr,
                email = user.Email,
                roles,
            },
            token,
        });
    }

    private string GenerateToken(Guid userId, string objectId, string displayName, string email, List<string> roles)
    {
        var secret = config["Jwt:SecretKey"] ?? "UoH-Dev-SecretKey-2024-MinLength32Chars!";
        var issuer = config["Jwt:Issuer"] ?? "UohMeetings";
        var audience = config["Jwt:Audience"] ?? "UohMeetings";
        var hours = config.GetValue("Jwt:ExpirationHours", 24);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("oid", objectId),
            new("name", displayName),
            new("preferred_username", email),
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(hours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
