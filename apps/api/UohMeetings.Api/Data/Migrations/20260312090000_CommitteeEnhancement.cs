using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CommitteeEnhancement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description_ar",
                table: "committees",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "committees",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "parent_committee_id",
                table: "committees",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "start_date",
                table: "committees",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "end_date",
                table: "committees",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "max_members",
                table: "committees",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "objectives_ar",
                table: "committees",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "objectives_en",
                table: "committees",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_committees_type",
                table: "committees",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_committees_parent_committee_id",
                table: "committees",
                column: "parent_committee_id");

            migrationBuilder.AddForeignKey(
                name: "FK_committees_committees_parent_committee_id",
                table: "committees",
                column: "parent_committee_id",
                principalTable: "committees",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_committees_committees_parent_committee_id",
                table: "committees");

            migrationBuilder.DropIndex(
                name: "IX_committees_type",
                table: "committees");

            migrationBuilder.DropIndex(
                name: "IX_committees_parent_committee_id",
                table: "committees");

            migrationBuilder.DropColumn(name: "description_ar", table: "committees");
            migrationBuilder.DropColumn(name: "description_en", table: "committees");
            migrationBuilder.DropColumn(name: "parent_committee_id", table: "committees");
            migrationBuilder.DropColumn(name: "start_date", table: "committees");
            migrationBuilder.DropColumn(name: "end_date", table: "committees");
            migrationBuilder.DropColumn(name: "max_members", table: "committees");
            migrationBuilder.DropColumn(name: "objectives_ar", table: "committees");
            migrationBuilder.DropColumn(name: "objectives_en", table: "committees");
        }
    }
}
