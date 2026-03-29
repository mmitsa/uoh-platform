using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UohMeetings.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_recommendation_tasks_mom_id",
                table: "recommendation_tasks");

            migrationBuilder.AddColumn<string>(
                name: "builder_metadata_json",
                table: "workflow_templates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "workflow_templates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at_utc",
                table: "workflow_templates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastEscalatedAtUtc",
                table: "workflow_instances",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SlaHoursUntilEscalation",
                table: "workflow_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "collect_personal_data",
                table: "surveys",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_public",
                table: "surveys",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "require_employee_id",
                table: "surveys",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "department",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "employee_id",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gender",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_proxy_submission",
                table: "survey_responses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "proxy_submitted_by",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "respondent_email",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "respondent_name",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "respondent_phone",
                table: "survey_responses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "allow_comment",
                table: "survey_questions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "branching_rules_json",
                table: "survey_questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "survey_questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "points",
                table: "survey_questions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "section_ar",
                table: "survey_questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "section_en",
                table: "survey_questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "slider_max",
                table: "survey_questions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "slider_min",
                table: "survey_questions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "weight",
                table: "survey_questions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "progress",
                table: "subtasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "attachments_json",
                table: "recommendation_tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "beneficiary",
                table: "recommendation_tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "recommendation_tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "receipt_number",
                table: "recommendation_tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "attendance_status",
                table: "mom_attendance",
                type: "text",
                nullable: false,
                defaultValue: "present");

            migrationBuilder.AddColumn<DateTime>(
                name: "checked_in_at_utc",
                table: "mom_attendance",
                type: "timestamp with time zone",
                nullable: true);

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

            migrationBuilder.AddColumn<Guid>(
                name: "meeting_room_id",
                table: "meetings",
                type: "uuid",
                nullable: true);

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

            migrationBuilder.AddColumn<string>(
                name: "description_ar",
                table: "agenda_items",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "agenda_items",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                table: "agenda_items",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "presenter_name",
                table: "agenda_items",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ad_sync_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sync_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    triggered_by_object_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    started_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    total_processed = table.Column<int>(type: "integer", nullable: false),
                    users_created = table.Column<int>(type: "integer", nullable: false),
                    users_updated = table.Column<int>(type: "integer", nullable: false),
                    roles_assigned = table.Column<int>(type: "integer", nullable: false),
                    roles_removed = table.Column<int>(type: "integer", nullable: false),
                    photos_synced = table.Column<int>(type: "integer", nullable: false),
                    errors = table.Column<int>(type: "integer", nullable: false),
                    error_details_json = table.Column<string>(type: "text", nullable: true),
                    group_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ad_sync_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_permissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    route = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_system = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    object_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    display_name_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    display_name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    job_title_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    job_title_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    department = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_synced = table.Column<bool>(type: "boolean", nullable: false),
                    last_login_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_sync_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chat_conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    name_ar = table.Column<string>(type: "text", nullable: true),
                    name_en = table.Column<string>(type: "text", nullable: true),
                    created_by_oid = table.Column<string>(type: "text", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_message_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_conversations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CommitteeChangeRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommitteeId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterObjectId = table.Column<string>(type: "text", nullable: false),
                    RequesterDisplayName = table.Column<string>(type: "text", nullable: false),
                    ReasonAr = table.Column<string>(type: "text", nullable: false),
                    ReasonEn = table.Column<string>(type: "text", nullable: false),
                    ChangesJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReviewerObjectId = table.Column<string>(type: "text", nullable: true),
                    ReviewerDisplayName = table.Column<string>(type: "text", nullable: true),
                    ReviewNotesAr = table.Column<string>(type: "text", nullable: true),
                    ReviewNotesEn = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommitteeChangeRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommitteeChangeRequests_committees_CommitteeId",
                        column: x => x.CommitteeId,
                        principalTable: "committees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "dashboard_widgets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    default_width = table.Column<int>(type: "integer", nullable: false),
                    default_height = table.Column<int>(type: "integer", nullable: false),
                    min_width = table.Column<int>(type: "integer", nullable: false),
                    min_height = table.Column<int>(type: "integer", nullable: false),
                    icon_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    required_permission = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    required_role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    config_schema = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dashboard_widgets", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Directives",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TitleAr = table.Column<string>(type: "text", nullable: false),
                    TitleEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionAr = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    IssuedBy = table.Column<string>(type: "text", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    IssueDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Directives", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NameAr = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionAr = table.Column<string>(type: "text", nullable: true),
                    DescriptionEn = table.Column<string>(type: "text", nullable: true),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "external_data_sources",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    api_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    headers_json = table.Column<string>(type: "text", nullable: true),
                    request_body_template = table.Column<string>(type: "text", nullable: true),
                    response_mapping = table.Column<string>(type: "text", nullable: false),
                    refresh_interval_minutes = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_fetch_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_fetch_status = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_by_object_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_external_data_sources", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "live_survey_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_id = table.Column<Guid>(type: "uuid", nullable: false),
                    join_code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    presenter_key = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    current_question_index = table.Column<int>(type: "integer", nullable: false),
                    participant_count = table.Column<int>(type: "integer", nullable: false),
                    accepting_votes = table.Column<bool>(type: "boolean", nullable: false),
                    created_by_object_id = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_live_survey_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_live_survey_sessions_surveys_survey_id",
                        column: x => x.survey_id,
                        principalTable: "surveys",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: true),
                    longitude = table.Column<double>(type: "double precision", nullable: true),
                    map_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meeting_rooms", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_object_id = table.Column<string>(type: "text", nullable: false),
                    recipient_email = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    title_ar = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    body_ar = table.Column<string>(type: "text", nullable: true),
                    body_en = table.Column<string>(type: "text", nullable: true),
                    entity_type = table.Column<string>(type: "text", nullable: true),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action_url = table.Column<string>(type: "text", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    read_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "survey_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ar = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: false),
                    description_ar = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    target_audience = table.Column<string>(type: "text", nullable: false),
                    created_by_object_id = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "system_settings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    value = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    is_encrypted = table.Column<bool>(type: "boolean", nullable: false),
                    group_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    data_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    updated_by_object_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_dashboard_layouts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_object_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    layout_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    widgets_json = table.Column<string>(type: "text", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_dashboard_layouts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ad_group_role_mappings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ad_group_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ad_group_display_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    created_by_object_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ad_group_role_mappings", x => x.id);
                    table.ForeignKey(
                        name: "FK_ad_group_role_mappings_app_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "app_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "app_role_permissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    granted_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_role_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_role_permissions_app_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "app_permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_app_role_permissions_app_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "app_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "app_user_roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by_object_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    assigned_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_user_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_user_roles_app_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "app_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_app_user_roles_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    theme = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    notify_by_email = table.Column<bool>(type: "boolean", nullable: false),
                    notify_by_push = table.Column<bool>(type: "boolean", nullable: false),
                    notify_by_sms = table.Column<bool>(type: "boolean", nullable: false),
                    email_digest_frequency = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_preferences_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_object_id = table.Column<string>(type: "text", nullable: false),
                    sender_display_name = table.Column<string>(type: "text", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_messages_chat_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chat_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_participants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_object_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    joined_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_read_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    unread_count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_participants", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_participants_chat_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chat_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DirectiveDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DirectiveId = table.Column<Guid>(type: "uuid", nullable: false),
                    TitleAr = table.Column<string>(type: "text", nullable: false),
                    TitleEn = table.Column<string>(type: "text", nullable: false),
                    NotesAr = table.Column<string>(type: "text", nullable: true),
                    NotesEn = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CommitteeId = table.Column<Guid>(type: "uuid", nullable: true),
                    WorkflowInstanceId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DirectiveDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DirectiveDecisions_Directives_DirectiveId",
                        column: x => x.DirectiveId,
                        principalTable: "Directives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DirectiveDecisions_committees_CommitteeId",
                        column: x => x.CommitteeId,
                        principalTable: "committees",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "CommitteeEvaluations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommitteeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    EvaluatorObjectId = table.Column<string>(type: "text", nullable: false),
                    EvaluatorDisplayName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    OverallNotesAr = table.Column<string>(type: "text", nullable: true),
                    OverallNotesEn = table.Column<string>(type: "text", nullable: true),
                    TotalScore = table.Column<double>(type: "double precision", nullable: false),
                    MaxPossibleScore = table.Column<double>(type: "double precision", nullable: false),
                    ScorePercentage = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommitteeEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommitteeEvaluations_EvaluationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "EvaluationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommitteeEvaluations_committees_CommitteeId",
                        column: x => x.CommitteeId,
                        principalTable: "committees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationCriteria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    LabelAr = table.Column<string>(type: "text", nullable: false),
                    LabelEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionAr = table.Column<string>(type: "text", nullable: true),
                    DescriptionEn = table.Column<string>(type: "text", nullable: true),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationCriteria_EvaluationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "EvaluationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "live_session_responses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    live_survey_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_response_id = table.Column<Guid>(type: "uuid", nullable: false),
                    participant_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    submitted_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_live_session_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_live_session_responses_live_survey_sessions_live_survey_ses~",
                        column: x => x.live_survey_session_id,
                        principalTable: "live_survey_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_live_session_responses_survey_responses_survey_response_id",
                        column: x => x.survey_response_id,
                        principalTable: "survey_responses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_template_questions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    text_ar = table.Column<string>(type: "text", nullable: false),
                    text_en = table.Column<string>(type: "text", nullable: false),
                    options_json = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_template_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_survey_template_questions_survey_templates_survey_template_~",
                        column: x => x.survey_template_id,
                        principalTable: "survey_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_message_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    chat_message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stored_file_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_message_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_message_attachments_chat_messages_chat_message_id",
                        column: x => x.chat_message_id,
                        principalTable: "chat_messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chat_message_attachments_stored_files_stored_file_id",
                        column: x => x.stored_file_id,
                        principalTable: "stored_files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EvaluationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriteriaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationResponses_CommitteeEvaluations_EvaluationId",
                        column: x => x.EvaluationId,
                        principalTable: "CommitteeEvaluations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EvaluationResponses_EvaluationCriteria_CriteriaId",
                        column: x => x.CriteriaId,
                        principalTable: "EvaluationCriteria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_recommendation_tasks_mom_id_status",
                table: "recommendation_tasks",
                columns: new[] { "mom_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_mom_attendance_mom_id_is_present",
                table: "mom_attendance",
                columns: new[] { "mom_id", "is_present" });

            migrationBuilder.CreateIndex(
                name: "IX_meetings_meeting_room_id",
                table: "meetings",
                column: "meeting_room_id");

            migrationBuilder.CreateIndex(
                name: "IX_committees_parent_committee_id",
                table: "committees",
                column: "parent_committee_id");

            migrationBuilder.CreateIndex(
                name: "IX_committees_type",
                table: "committees",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_occurred_at_utc",
                table: "audit_log_entries",
                column: "occurred_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_user_object_id",
                table: "audit_log_entries",
                column: "user_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_ad_group_role_mappings_ad_group_id_role_id",
                table: "ad_group_role_mappings",
                columns: new[] { "ad_group_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ad_group_role_mappings_is_active",
                table: "ad_group_role_mappings",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "IX_ad_group_role_mappings_role_id",
                table: "ad_group_role_mappings",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_ad_sync_logs_started_at_utc",
                table: "ad_sync_logs",
                column: "started_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_ad_sync_logs_status",
                table: "ad_sync_logs",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_app_permissions_category",
                table: "app_permissions",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_app_permissions_key",
                table: "app_permissions",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_role_permissions_permission_id",
                table: "app_role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_role_permissions_role_id_permission_id",
                table: "app_role_permissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_roles_key",
                table: "app_roles",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_role_id",
                table: "app_user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_user_id_role_id",
                table: "app_user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_users_email",
                table: "app_users",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "IX_app_users_is_active",
                table: "app_users",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "IX_app_users_object_id",
                table: "app_users",
                column: "object_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_conversations_created_by_oid",
                table: "chat_conversations",
                column: "created_by_oid");

            migrationBuilder.CreateIndex(
                name: "IX_chat_conversations_last_message_at_utc",
                table: "chat_conversations",
                column: "last_message_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_chat_message_attachments_chat_message_id",
                table: "chat_message_attachments",
                column: "chat_message_id");

            migrationBuilder.CreateIndex(
                name: "IX_chat_message_attachments_stored_file_id",
                table: "chat_message_attachments",
                column: "stored_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_conversation_id_created_at_utc",
                table: "chat_messages",
                columns: new[] { "conversation_id", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_sender_object_id",
                table: "chat_messages",
                column: "sender_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_chat_participants_conversation_id_user_object_id",
                table: "chat_participants",
                columns: new[] { "conversation_id", "user_object_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_participants_user_object_id",
                table: "chat_participants",
                column: "user_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteeChangeRequests_CommitteeId",
                table: "CommitteeChangeRequests",
                column: "CommitteeId");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteeEvaluations_CommitteeId",
                table: "CommitteeEvaluations",
                column: "CommitteeId");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteeEvaluations_TemplateId",
                table: "CommitteeEvaluations",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_dashboard_widgets_key",
                table: "dashboard_widgets",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DirectiveDecisions_CommitteeId",
                table: "DirectiveDecisions",
                column: "CommitteeId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectiveDecisions_DirectiveId",
                table: "DirectiveDecisions",
                column: "DirectiveId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationCriteria_TemplateId",
                table: "EvaluationCriteria",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResponses_CriteriaId",
                table: "EvaluationResponses",
                column: "CriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResponses_EvaluationId",
                table: "EvaluationResponses",
                column: "EvaluationId");

            migrationBuilder.CreateIndex(
                name: "IX_live_session_responses_live_survey_session_id_participant_f~",
                table: "live_session_responses",
                columns: new[] { "live_survey_session_id", "participant_fingerprint", "survey_response_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_live_session_responses_survey_response_id",
                table: "live_session_responses",
                column: "survey_response_id");

            migrationBuilder.CreateIndex(
                name: "IX_live_survey_sessions_join_code",
                table: "live_survey_sessions",
                column: "join_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_live_survey_sessions_status",
                table: "live_survey_sessions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_live_survey_sessions_survey_id",
                table: "live_survey_sessions",
                column: "survey_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_created_at_utc",
                table: "notifications",
                column: "created_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_object_id",
                table: "notifications",
                column: "recipient_object_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_object_id_is_read",
                table: "notifications",
                columns: new[] { "recipient_object_id", "is_read" });

            migrationBuilder.CreateIndex(
                name: "IX_survey_template_questions_survey_template_id_order",
                table: "survey_template_questions",
                columns: new[] { "survey_template_id", "order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_system_settings_group_key",
                table: "system_settings",
                column: "group_key");

            migrationBuilder.CreateIndex(
                name: "IX_system_settings_key",
                table: "system_settings",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_dashboard_layouts_user_object_id_layout_name",
                table: "user_dashboard_layouts",
                columns: new[] { "user_object_id", "layout_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_preferences_user_id",
                table: "user_preferences",
                column: "user_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_committees_committees_parent_committee_id",
                table: "committees",
                column: "parent_committee_id",
                principalTable: "committees",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

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
                name: "FK_committees_committees_parent_committee_id",
                table: "committees");

            migrationBuilder.DropForeignKey(
                name: "FK_meetings_meeting_rooms_meeting_room_id",
                table: "meetings");

            migrationBuilder.DropTable(
                name: "ad_group_role_mappings");

            migrationBuilder.DropTable(
                name: "ad_sync_logs");

            migrationBuilder.DropTable(
                name: "app_role_permissions");

            migrationBuilder.DropTable(
                name: "app_user_roles");

            migrationBuilder.DropTable(
                name: "chat_message_attachments");

            migrationBuilder.DropTable(
                name: "chat_participants");

            migrationBuilder.DropTable(
                name: "CommitteeChangeRequests");

            migrationBuilder.DropTable(
                name: "dashboard_widgets");

            migrationBuilder.DropTable(
                name: "DirectiveDecisions");

            migrationBuilder.DropTable(
                name: "EvaluationResponses");

            migrationBuilder.DropTable(
                name: "external_data_sources");

            migrationBuilder.DropTable(
                name: "live_session_responses");

            migrationBuilder.DropTable(
                name: "meeting_rooms");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "survey_template_questions");

            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropTable(
                name: "user_dashboard_layouts");

            migrationBuilder.DropTable(
                name: "user_preferences");

            migrationBuilder.DropTable(
                name: "app_permissions");

            migrationBuilder.DropTable(
                name: "app_roles");

            migrationBuilder.DropTable(
                name: "chat_messages");

            migrationBuilder.DropTable(
                name: "Directives");

            migrationBuilder.DropTable(
                name: "CommitteeEvaluations");

            migrationBuilder.DropTable(
                name: "EvaluationCriteria");

            migrationBuilder.DropTable(
                name: "live_survey_sessions");

            migrationBuilder.DropTable(
                name: "survey_templates");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "chat_conversations");

            migrationBuilder.DropTable(
                name: "EvaluationTemplates");

            migrationBuilder.DropIndex(
                name: "IX_recommendation_tasks_mom_id_status",
                table: "recommendation_tasks");

            migrationBuilder.DropIndex(
                name: "IX_mom_attendance_mom_id_is_present",
                table: "mom_attendance");

            migrationBuilder.DropIndex(
                name: "IX_meetings_meeting_room_id",
                table: "meetings");

            migrationBuilder.DropIndex(
                name: "IX_committees_parent_committee_id",
                table: "committees");

            migrationBuilder.DropIndex(
                name: "IX_committees_type",
                table: "committees");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_entries_occurred_at_utc",
                table: "audit_log_entries");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_entries_user_object_id",
                table: "audit_log_entries");

            migrationBuilder.DropColumn(
                name: "builder_metadata_json",
                table: "workflow_templates");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "workflow_templates");

            migrationBuilder.DropColumn(
                name: "updated_at_utc",
                table: "workflow_templates");

            migrationBuilder.DropColumn(
                name: "LastEscalatedAtUtc",
                table: "workflow_instances");

            migrationBuilder.DropColumn(
                name: "SlaHoursUntilEscalation",
                table: "workflow_instances");

            migrationBuilder.DropColumn(
                name: "collect_personal_data",
                table: "surveys");

            migrationBuilder.DropColumn(
                name: "is_public",
                table: "surveys");

            migrationBuilder.DropColumn(
                name: "require_employee_id",
                table: "surveys");

            migrationBuilder.DropColumn(
                name: "department",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "employee_id",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "gender",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "is_proxy_submission",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "proxy_submitted_by",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "respondent_email",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "respondent_name",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "respondent_phone",
                table: "survey_responses");

            migrationBuilder.DropColumn(
                name: "allow_comment",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "branching_rules_json",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "points",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "section_ar",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "section_en",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "slider_max",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "slider_min",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "weight",
                table: "survey_questions");

            migrationBuilder.DropColumn(
                name: "progress",
                table: "subtasks");

            migrationBuilder.DropColumn(
                name: "attachments_json",
                table: "recommendation_tasks");

            migrationBuilder.DropColumn(
                name: "beneficiary",
                table: "recommendation_tasks");

            migrationBuilder.DropColumn(
                name: "category",
                table: "recommendation_tasks");

            migrationBuilder.DropColumn(
                name: "receipt_number",
                table: "recommendation_tasks");

            migrationBuilder.DropColumn(
                name: "attendance_status",
                table: "mom_attendance");

            migrationBuilder.DropColumn(
                name: "checked_in_at_utc",
                table: "mom_attendance");

            migrationBuilder.DropColumn(
                name: "description_ar",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "meeting_room_id",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "description_ar",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "end_date",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "max_members",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "objectives_ar",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "objectives_en",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "parent_committee_id",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "start_date",
                table: "committees");

            migrationBuilder.DropColumn(
                name: "description_ar",
                table: "agenda_items");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "agenda_items");

            migrationBuilder.DropColumn(
                name: "duration_minutes",
                table: "agenda_items");

            migrationBuilder.DropColumn(
                name: "presenter_name",
                table: "agenda_items");

            migrationBuilder.CreateIndex(
                name: "IX_recommendation_tasks_mom_id",
                table: "recommendation_tasks",
                column: "mom_id");
        }
    }
}
