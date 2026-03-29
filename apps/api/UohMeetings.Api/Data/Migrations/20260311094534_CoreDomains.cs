using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CoreDomains : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "committees",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    name_ar = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    workflow_template_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_committees", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vote_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    meeting_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    opened_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    closed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vote_sessions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "committee_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    committee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_object_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_committee_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_committee_members_committees_committee_id",
                        column: x => x.committee_id,
                        principalTable: "committees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "meetings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    committee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    start_datetime_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_datetime_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    location = table.Column<string>(type: "text", nullable: true),
                    online_platform = table.Column<string>(type: "text", nullable: true),
                    online_join_url = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meetings", x => x.id);
                    table.ForeignKey(
                        name: "FK_meetings_committees_committee_id",
                        column: x => x.committee_id,
                        principalTable: "committees",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "vote_ballots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vote_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    voter_object_id = table.Column<string>(type: "text", nullable: false),
                    voter_display_name = table.Column<string>(type: "text", nullable: true),
                    selected_option_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cast_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vote_ballots", x => x.id);
                    table.ForeignKey(
                        name: "FK_vote_ballots_vote_sessions_vote_session_id",
                        column: x => x.vote_session_id,
                        principalTable: "vote_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vote_options",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    vote_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "text", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vote_options", x => x.id);
                    table.ForeignKey(
                        name: "FK_vote_options_vote_sessions_vote_session_id",
                        column: x => x.vote_session_id,
                        principalTable: "vote_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agenda_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    meeting_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agenda_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_agenda_items_meetings_meeting_id",
                        column: x => x.meeting_id,
                        principalTable: "meetings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "moms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    meeting_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    word_doc_url = table.Column<string>(type: "text", nullable: true),
                    pdf_doc_url = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_moms", x => x.id);
                    table.ForeignKey(
                        name: "FK_moms_meetings_meeting_id",
                        column: x => x.meeting_id,
                        principalTable: "meetings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agenda_minutes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    mom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    agenda_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agenda_minutes", x => x.id);
                    table.ForeignKey(
                        name: "FK_agenda_minutes_moms_mom_id",
                        column: x => x.mom_id,
                        principalTable: "moms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "decisions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    mom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_decisions", x => x.id);
                    table.ForeignKey(
                        name: "FK_decisions_moms_mom_id",
                        column: x => x.mom_id,
                        principalTable: "moms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mom_attendance",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    mom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_object_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    is_present = table.Column<bool>(type: "boolean", nullable: false),
                    absence_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mom_attendance", x => x.id);
                    table.ForeignKey(
                        name: "FK_mom_attendance_moms_mom_id",
                        column: x => x.mom_id,
                        principalTable: "moms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recommendation_tasks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    mom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    committee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    assigned_to_object_id = table.Column<string>(type: "text", nullable: false),
                    assigned_to_display_name = table.Column<string>(type: "text", nullable: true),
                    assigned_to_email = table.Column<string>(type: "text", nullable: true),
                    due_date_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    priority = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    progress = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recommendation_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_recommendation_tasks_moms_mom_id",
                        column: x => x.mom_id,
                        principalTable: "moms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subtasks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recommendation_task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    due_date_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subtasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_subtasks_recommendation_tasks_recommendation_task_id",
                        column: x => x.recommendation_task_id,
                        principalTable: "recommendation_tasks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agenda_items_meeting_id_order",
                table: "agenda_items",
                columns: new[] { "meeting_id", "order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agenda_minutes_mom_id_agenda_item_id",
                table: "agenda_minutes",
                columns: new[] { "mom_id", "agenda_item_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_committee_members_committee_id_user_object_id",
                table: "committee_members",
                columns: new[] { "committee_id", "user_object_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_committees_status",
                table: "committees",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_decisions_mom_id",
                table: "decisions",
                column: "mom_id");

            migrationBuilder.CreateIndex(
                name: "IX_meetings_committee_id",
                table: "meetings",
                column: "committee_id");

            migrationBuilder.CreateIndex(
                name: "IX_meetings_start_datetime_utc",
                table: "meetings",
                column: "start_datetime_utc");

            migrationBuilder.CreateIndex(
                name: "IX_meetings_status",
                table: "meetings",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_mom_attendance_mom_id_user_object_id",
                table: "mom_attendance",
                columns: new[] { "mom_id", "user_object_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_moms_meeting_id",
                table: "moms",
                column: "meeting_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_recommendation_tasks_assigned_to_object_id",
                table: "recommendation_tasks",
                column: "assigned_to_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_recommendation_tasks_mom_id",
                table: "recommendation_tasks",
                column: "mom_id");

            migrationBuilder.CreateIndex(
                name: "IX_recommendation_tasks_status",
                table: "recommendation_tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_subtasks_recommendation_task_id",
                table: "subtasks",
                column: "recommendation_task_id");

            migrationBuilder.CreateIndex(
                name: "IX_vote_ballots_vote_session_id_voter_object_id",
                table: "vote_ballots",
                columns: new[] { "vote_session_id", "voter_object_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vote_options_vote_session_id_order",
                table: "vote_options",
                columns: new[] { "vote_session_id", "order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vote_sessions_meeting_id",
                table: "vote_sessions",
                column: "meeting_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agenda_items");

            migrationBuilder.DropTable(
                name: "agenda_minutes");

            migrationBuilder.DropTable(
                name: "committee_members");

            migrationBuilder.DropTable(
                name: "decisions");

            migrationBuilder.DropTable(
                name: "mom_attendance");

            migrationBuilder.DropTable(
                name: "subtasks");

            migrationBuilder.DropTable(
                name: "vote_ballots");

            migrationBuilder.DropTable(
                name: "vote_options");

            migrationBuilder.DropTable(
                name: "recommendation_tasks");

            migrationBuilder.DropTable(
                name: "vote_sessions");

            migrationBuilder.DropTable(
                name: "moms");

            migrationBuilder.DropTable(
                name: "meetings");

            migrationBuilder.DropTable(
                name: "committees");
        }
    }
}
