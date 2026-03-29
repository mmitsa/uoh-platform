# Architecture Overview

## System Architecture

```
┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│   React SPA  │───▶│   .NET API   │───▶│  PostgreSQL    │
│  (Vite/TS)   │    │  (ASP.NET 8) │    │  (EF Core)     │
└──────────────┘    └──────┬───────┘    └────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
    ┌────▼────┐     ┌──────▼─────┐     ┌─────▼──────┐
    │  Redis  │     │ MinIO/Azure│     │  External  │
    │ (cache) │     │  (files)   │     │  Services  │
    └─────────┘     └────────────┘     └────────────┘
                                        ├─ MS Teams
                                        ├─ Zoom
                                        ├─ SMTP
                                        ├─ FCM Push
                                        └─ MS Graph
```

## Backend Layers

### 1. Controllers (Thin)
- Route handling and HTTP concerns only
- Delegates all business logic to services
- Returns `IActionResult` with proper status codes

### 2. Services (Business Logic)
- `ICommitteeService` — Committee CRUD, member management
- `IMeetingService` — Meeting lifecycle (create → publish → complete/cancel)
- `IMomService` — Minutes of Meeting with approval workflow
- `ITaskService` — Task tracking with progress and subtasks
- `IVotingService` — Vote sessions (create → open → cast → close)
- `ISurveyService` — Survey lifecycle with Excel export
- `WorkflowEngine` — Generic state machine for approval workflows
- `MomExportService` — Word/PDF document generation

### 3. Data Layer
- `AppDbContext` — EF Core context with 20+ entity sets
- `Data/Configurations/` — One `IEntityTypeConfiguration<T>` per entity
- PostgreSQL with snake_case naming convention
- Enums stored as strings with `HasConversion<string>()`

### 4. Middleware Pipeline
```
Request → GlobalExceptionHandler → RateLimiter → CORS
        → Authentication → Authorization
        → SecurityHeaders → AuditMiddleware → Controller
```

## Authentication
- **Provider**: Microsoft Entra ID (Azure AD)
- **Frontend**: MSAL Browser with redirect flow
- **Backend**: JWT Bearer validation via Microsoft.Identity.Web
- **Roles**: SystemAdmin, CommitteeHead, CommitteeSecretary, CommitteeMember, Observer

## Key Patterns
- **Domain Exceptions** → RFC 7807 ProblemDetails via GlobalExceptionHandler
- **Audit Logging** → Background queue (Channel<T>) for non-blocking writes
- **File Storage** → Strategy pattern (MinIO / Azure Blob via IFileStorage)
- **Online Meetings** → Strategy pattern (Teams / Zoom via IOnlineMeetingProvider)
- **Configuration** → Strongly-typed IOptions<T> (StorageOptions, IntegrationOptions, etc.)

## Frontend Architecture
- **React 19** with functional components
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **react-i18next** for Arabic/English localization (RTL supported)
- **useApi()** hook wraps MSAL token acquisition + fetch
- **useAsyncData()** for loading/error/data state management
- **ErrorBoundary** for graceful error handling
- **ProtectedRoute** for authentication guards
