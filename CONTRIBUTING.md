# Contributing to UOH Meetings Platform

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 8.0+ |
| Node.js | 20+ |
| Docker & Docker Compose | Latest |
| PostgreSQL (or use Docker) | 16+ |

## Quick Start

```bash
# 1. Clone
git clone <repo-url> && cd meeting-platform

# 2. Start infrastructure (Postgres, Redis, MinIO)
docker compose -f infra/docker-compose.yml up -d

# 3. Backend
cd apps/api/UohMeetings.Api
cp .env.example .env               # configure secrets
dotnet restore
dotnet run                          # starts on http://localhost:5062

# 4. Frontend
cd apps/web
npm install
npm run dev                         # starts on http://localhost:5173
```

## Project Structure

```
meeting-platform/
├── apps/
│   ├── api/                        # .NET 8 Web API
│   │   └── UohMeetings.Api/
│   │       ├── Controllers/        # Thin REST controllers
│   │       ├── Services/           # Business logic layer
│   │       ├── Entities/           # EF Core entities
│   │       ├── Enums/              # Strongly-typed enums
│   │       ├── Validators/         # FluentValidation rules
│   │       ├── Middleware/         # Request pipeline middleware
│   │       ├── Data/               # DbContext + EF configurations
│   │       ├── Options/            # IOptions<T> config classes
│   │       ├── Models/             # API response models
│   │       ├── Integrations/       # External service adapters
│   │       └── Storage/            # File storage providers
│   ├── web/                        # React 19 + Vite + Tailwind
│   │   └── src/
│   │       ├── app/                # API client, auth, i18n
│   │       ├── components/         # Shared UI components
│   │       ├── hooks/              # Custom React hooks
│   │       ├── pages/              # Page components
│   │       └── locales/            # i18n translations (ar/en)
│   └── mobile/                     # React Native + Expo
├── packages/shared/                # Shared TypeScript types
├── infra/                          # Docker Compose, k6 scripts
└── .github/workflows/              # CI pipeline
```

## Development Standards

### Backend (.NET)

- **Architecture**: Controllers → Services → DbContext (no business logic in controllers)
- **Enums**: Always use strongly-typed enums, never raw strings
- **Validation**: FluentValidation on all request DTOs
- **Exceptions**: Use domain exceptions (`NotFoundException`, `ConflictException`, etc.)
- **Configuration**: `IOptions<T>` pattern, never raw `IConfiguration` in services
- **EF Core**: Each entity gets its own `IEntityTypeConfiguration<T>` class
- **Naming**: snake_case for DB columns, PascalCase for C# properties

### Frontend (React)

- **API calls**: Use `useApi()` hook, never pass `msal` as props
- **State management**: `useAsyncData` hook for server data
- **i18n**: All user-facing text must use `t('key')`, no hardcoded strings
- **Styling**: Tailwind CSS utility classes
- **Components**: Functional components with TypeScript types

### Commit Messages

Follow conventional commits:
```
feat: add committee approval workflow
fix: correct meeting timezone conversion
refactor: extract voting service from controller
test: add committee service unit tests
docs: update API endpoint documentation
```

## Running Tests

```bash
# Backend
cd apps/api
dotnet test

# Frontend
cd apps/web
npm test
```

## API Documentation

Swagger UI is available in development mode at:
```
http://localhost:5062/swagger
```

## Docker (Full Stack)

```bash
# Infrastructure only
docker compose -f infra/docker-compose.yml up -d

# Full stack (API + Web + Infra)
docker compose -f infra/docker-compose.app.yml up --build
```
