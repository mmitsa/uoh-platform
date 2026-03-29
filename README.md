<div align="center">

# UOH Platform

### منصة إدارة المجالس واللجان والاجتماعات — جامعة حائل

**University of Hail — Meetings & Committees Management Platform**

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Expo 55](https://img.shields.io/badge/Expo-55-000020?logo=expo)](https://expo.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

</div>

---

## Overview

**UOH Platform** is an enterprise-grade meetings and committees governance system built for the **University of Hail**. It provides a complete digital workflow — from scheduling meetings and managing committees to real-time voting, live surveys, and automated task tracking — with full **Arabic (RTL) / English (LTR)** bilingual support.

> منصة مؤسسية متكاملة لإدارة الاجتماعات والمجالس واللجان، مع دعم كامل للغة العربية والإنجليزية، وتكامل مع منظومة Microsoft 365، وتطبيق جوال لنظامي iOS و Android.

---

## Key Features

| Module | Description |
|--------|-------------|
| **Committee Management** | Hierarchical structure (councils → committees → sub-committees) with lifecycle tracking and KPIs |
| **Meeting Scheduling** | In-person, online (Teams/Zoom), or hybrid meetings with calendar sync |
| **Meeting Minutes (MoM)** | Attendance tracking, decisions, recommendations auto-converted to tasks, export to PDF/Word |
| **Task Management** | Auto-generated from MoM recommendations, priority levels, sub-tasks, progress tracking |
| **Real-time Voting** | Anonymous or named voting sessions with live results via SignalR |
| **Surveys & Live Polls** | Multiple question types, public surveys, QR-based live polls, analytics & word clouds |
| **Chat System** | Real-time messaging with file attachments and conversation management |
| **Notifications** | Push (FCM), Web Push, Email (SMTP), and in-app notifications |
| **Reports & Analytics** | Dashboards with charts, export to Excel/PDF, customizable widgets |
| **Workflow Engine** | Configurable approval workflows for committees, minutes, and change requests |
| **Room Booking** | Physical meeting room reservation and availability management |
| **Document Management** | File attachments with secure sharing links and access control |
| **SSO Authentication** | Microsoft Entra ID (Azure AD) integration with RBAC |
| **Audit Trail** | Full audit logging for compliance and governance |

---

## Tech Stack

### Backend — `apps/api`

| Technology | Purpose |
|-----------|---------|
| .NET 8 / ASP.NET Core | REST API framework |
| Entity Framework Core 8 | ORM & database migrations |
| PostgreSQL 16 | Primary database |
| Redis 7 | Distributed caching |
| SignalR | Real-time WebSocket communication |
| Microsoft Identity Web | Entra ID authentication |
| Microsoft Graph | Microsoft 365 calendar & user sync |
| MinIO / Azure Blob Storage | File storage (S3-compatible) |
| FluentValidation | Input validation |
| OpenTelemetry | Observability & tracing |

### Frontend — `apps/web`

| Technology | Purpose |
|-----------|---------|
| React 19 + TypeScript | UI framework |
| Vite 7.3 | Build tool & dev server |
| Tailwind CSS 4.2 | Utility-first styling |
| React Router 7 | Client-side routing |
| i18next | Internationalization (AR/EN) |
| @microsoft/signalr | Real-time communication |
| Recharts | Data visualization |
| @dnd-kit | Drag & drop (dashboard) |
| Leaflet | Location mapping |
| PWA (vite-plugin-pwa) | Progressive Web App support |

### Mobile — `apps/mobile`

| Technology | Purpose |
|-----------|---------|
| React Native + Expo 55 | Cross-platform mobile |
| React Navigation 7 | Native navigation |
| TanStack React Query | Server state management |
| expo-notifications | Push notifications |
| expo-local-authentication | Biometric login |
| React Native Reanimated | Animations |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker Compose | Local dev environment |
| GitHub Actions | CI/CD pipelines |
| K6 | Performance / load testing |
| PowerShell | Deployment automation |

---

## Project Structure

```
uoh-platform/
├── apps/
│   ├── api/                          # .NET 8 Web API + SignalR Hubs
│   │   └── UohMeetings.Api/
│   │       ├── Controllers/          # 30 REST controllers
│   │       ├── Services/             # Business logic layer
│   │       ├── Entities/             # 37 EF Core entities
│   │       ├── Hubs/                 # SignalR (Chat, Notifications, LiveSurvey)
│   │       ├── Integrations/         # Teams, Zoom, Graph, FCM, SMTP
│   │       ├── Storage/              # MinIO & Azure Blob adapters
│   │       ├── Validators/           # FluentValidation rules
│   │       ├── Data/                 # DbContext & migrations
│   │       └── Middleware/           # Auth, error handling, rate limiting
│   │
│   ├── web/                          # React 19 + Vite + Tailwind
│   │   └── src/
│   │       ├── pages/                # 26+ page components
│   │       ├── components/           # Shared UI components
│   │       ├── contexts/             # React Context providers
│   │       ├── hooks/                # Custom hooks (useApi, useAsyncData)
│   │       └── locales/              # AR/EN translations
│   │
│   └── mobile/                       # React Native + Expo 55
│       └── src/
│           ├── screens/              # 13 feature screens
│           ├── components/           # Mobile UI components
│           ├── navigation/           # Tab & stack navigators
│           └── services/             # API client layer
│
├── packages/
│   ├── shared/                       # Shared TypeScript types & utilities
│   ├── ui/                           # Design tokens & component library
│   └── config/                       # Shared ESLint/Prettier/TSConfig
│
├── infra/                            # Docker Compose & K6 load tests
├── deploy/                           # Deployment scripts (PowerShell)
├── docs/                             # ADRs, runbooks, architecture docs
├── scripts/                          # Build utilities
└── .github/workflows/                # CI/CD (ci.yml, cd.yml)
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 8.0+ |
| Node.js | 20+ |
| Docker & Docker Compose | Latest |

### 1. Clone the repository

```bash
git clone https://github.com/mmitsa/uoh-platform.git
cd uoh-platform
```

### 2. Start infrastructure services

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts **PostgreSQL 16**, **Redis 7**, and **MinIO** (S3-compatible storage).

### 3. Run the API

```bash
cd apps/api/UohMeetings.Api
cp .env.example .env          # configure your secrets
dotnet restore
dotnet run                     # → http://localhost:5062
```

### 4. Run the Web App

```bash
cd apps/web
npm install
npm run dev                    # → http://localhost:5173
```

### 5. Run the Mobile App

```bash
cd apps/mobile
npm install
npx expo start                 # scan QR with Expo Go
```

### Full Stack (Docker)

```bash
docker compose -f infra/docker-compose.app.yml up --build
```

---

## API Documentation

Swagger UI is available in development mode:

```
http://localhost:5062/swagger
```

---

## Architecture

```
┌──────────────┐   ┌──────────────────┐   ┌───────────────────┐
│  Mobile App  │   │    Web App       │   │   External Users  │
│  (Expo 55)   │   │  (React + Vite)  │   │  (Public Surveys) │
└──────┬───────┘   └────────┬─────────┘   └─────────┬─────────┘
       │                    │                        │
       └────────────┬───────┘────────────────────────┘
                    │
            ┌───────▼────────┐
            │   .NET 8 API   │
            │  REST+SignalR   │
            └───┬────┬───┬───┘
                │    │   │
    ┌───────────┘    │   └───────────┐
    │                │               │
┌───▼───┐     ┌─────▼─────┐   ┌─────▼─────┐
│ Postgres│    │   Redis   │   │   MinIO   │
│  16    │    │    7      │   │ (Storage) │
└────────┘    └───────────┘   └───────────┘
```

**Deployment model:** Hybrid (On-Premises + Azure optional)

---

## Running Tests

```bash
# Backend unit tests
cd apps/api && dotnet test

# Frontend unit tests
cd apps/web && npm test

# Load tests
cd infra/k6 && k6 run smoke.js
```

---

## Development Standards

- **Backend:** Controller → Service → DbContext pattern, FluentValidation on all DTOs
- **Frontend:** `useApi()` hook for API calls, `t('key')` for all user-facing text
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- **i18n:** All strings must be translated — no hardcoded text
- **Database:** snake_case columns, PascalCase C# properties

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup and coding standards.

---

## License

This project is proprietary software developed for the **University of Hail**. All rights reserved.

---

<div align="center">

**Built for [University of Hail](https://www.uoh.edu.sa/) (جامعة حائل)**

</div>
