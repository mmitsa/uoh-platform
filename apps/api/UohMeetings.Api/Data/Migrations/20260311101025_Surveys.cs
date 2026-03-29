using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Surveys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "survey_responses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_id = table.Column<Guid>(type: "uuid", nullable: false),
                    respondent_object_id = table.Column<string>(type: "text", nullable: true),
                    submitted_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_responses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "surveys",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    committee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    recommendation_task_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    target_audience = table.Column<string>(type: "text", nullable: false),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    start_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    allow_lucky_draw = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_surveys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "survey_answers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_response_id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value_json = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_answers", x => x.id);
                    table.ForeignKey(
                        name: "FK_survey_answers_survey_responses_survey_response_id",
                        column: x => x.survey_response_id,
                        principalTable: "survey_responses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_questions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    text_ar = table.Column<string>(type: "text", nullable: false),
                    text_en = table.Column<string>(type: "text", nullable: false),
                    options_json = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_survey_questions_surveys_survey_id",
                        column: x => x.survey_id,
                        principalTable: "surveys",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_survey_answers_survey_response_id_survey_question_id",
                table: "survey_answers",
                columns: new[] { "survey_response_id", "survey_question_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_survey_questions_survey_id_order",
                table: "survey_questions",
                columns: new[] { "survey_id", "order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_survey_responses_survey_id",
                table: "survey_responses",
                column: "survey_id");

            migrationBuilder.CreateIndex(
                name: "IX_surveys_status",
                table: "surveys",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "survey_answers");

            migrationBuilder.DropTable(
                name: "survey_questions");

            migrationBuilder.DropTable(
                name: "survey_responses");

            migrationBuilder.DropTable(
                name: "surveys");
        }
    }
}
