using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AcknowledgmentTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TitleAr = table.Column<string>(type: "text", nullable: false),
                    TitleEn = table.Column<string>(type: "text", nullable: false),
                    BodyAr = table.Column<string>(type: "text", nullable: false),
                    BodyEn = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresRenewal = table.Column<bool>(type: "boolean", nullable: false),
                    RenewalDays = table.Column<int>(type: "integer", nullable: true),
                    AppliesToRoles = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcknowledgmentTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "push_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_object_id = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    endpoint = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    p256dh = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    auth = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_push_subscriptions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "UserAcknowledgments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateVersion = table.Column<int>(type: "integer", nullable: false),
                    AcknowledgedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAcknowledgments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAcknowledgments_AcknowledgmentTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "AcknowledgmentTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAcknowledgments_app_users_UserId",
                        column: x => x.UserId,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_push_subscriptions_endpoint",
                table: "push_subscriptions",
                column: "endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_push_subscriptions_user_object_id",
                table: "push_subscriptions",
                column: "user_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_UserAcknowledgments_TemplateId",
                table: "UserAcknowledgments",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAcknowledgments_UserId",
                table: "UserAcknowledgments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "push_subscriptions");

            migrationBuilder.DropTable(
                name: "UserAcknowledgments");

            migrationBuilder.DropTable(
                name: "AcknowledgmentTemplates");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "app_users");
        }
    }
}
