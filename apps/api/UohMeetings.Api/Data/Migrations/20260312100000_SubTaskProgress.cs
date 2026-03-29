using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SubTaskProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "progress",
                table: "subtasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "progress",
                table: "subtasks");
        }
    }
}
