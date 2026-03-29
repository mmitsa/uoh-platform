using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MeetingEnhancement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Meeting rooms table
            migrationBuilder.CreateTable(
                name: "meeting_rooms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ar = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    name_en = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    building = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    floor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    capacity = table.Column<int>(type: "integer", nullable: false),
                    has_video_conference = table.Column<bool>(type: "boolean", nullable: false),
                    has_projector = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    latitude = table.Column<double>(type: "double precision", nullable: true),
                    longitude = table.Column<double>(type: "double precision", nullable: true),
                    map_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meeting_rooms", x => x.id);
                });

            // Meeting description fields
            migrationBuilder.AddColumn<string>(
                name: "description_ar",
                table: "meetings",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "meetings",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            // Meeting room FK
            migrationBuilder.AddColumn<Guid>(
                name: "meeting_room_id",
                table: "meetings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_meetings_meeting_room_id",
                table: "meetings",
                column: "meeting_room_id");

            migrationBuilder.AddForeignKey(
                name: "FK_meetings_meeting_rooms_meeting_room_id",
                table: "meetings",
                column: "meeting_room_id",
                principalTable: "meeting_rooms",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_meetings_meeting_rooms_meeting_room_id",
                table: "meetings");

            migrationBuilder.DropIndex(
                name: "IX_meetings_meeting_room_id",
                table: "meetings");

            migrationBuilder.DropColumn(name: "description_ar", table: "meetings");
            migrationBuilder.DropColumn(name: "description_en", table: "meetings");
            migrationBuilder.DropColumn(name: "meeting_room_id", table: "meetings");

            migrationBuilder.DropTable(name: "meeting_rooms");
        }
    }
}
