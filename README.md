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
| React Native 0.83 + Expo 55 | Cross-platform mobile (iOS & Android) |
| React Navigation 7 | Tab & stack navigation (6 tabs, 38+ screens) |
| TanStack React Query 5 | Server state & cache management |
| Microsoft SignalR | Real-time chat, notifications, live surveys |
| i18next | Full Arabic (RTL) / English (LTR) support |
| expo-notifications | Push notifications (FCM/APNs) |
| expo-local-authentication | Biometric login (Face ID / Touch ID) |
| React Native Reanimated 3 | Fluid animations & gesture handling |
| expo-document-picker | File upload & attachment management |
| expo-file-system | File download & local storage |

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
│           ├── screens/              # 60+ screens across 19 modules
│           │   ├── DashboardScreen   # Role-based dashboard with KPIs
│           │   ├── committees/       # List, detail, form, members
│           │   ├── meetings/         # List, detail, form, calendar
│           │   ├── chat/             # Conversations, messaging, new chat
│           │   ├── tasks/            # List, detail, form
│           │   ├── moms/             # Minutes list & detail
│           │   ├── voting/           # Voting list & detail
│           │   ├── surveys/          # Surveys, responses, live polls
│           │   ├── directives/       # List, detail, form
│           │   ├── evaluations/      # List, detail, scoring form
│           │   ├── acknowledgments/  # Pending & history views
│           │   ├── approvals/        # Centralized approval center
│           │   ├── change-requests/  # List & detail views
│           │   ├── reports/          # Activity, attendance, tasks
│           │   ├── workflow/         # Workflow list & visual detail
│           │   ├── attachments/      # File browser with upload
│           │   ├── locations/        # Location hierarchy & detail
│           │   ├── rooms/            # Room booking & availability
│           │   ├── notifications/    # Notification center
│           │   ├── live-survey/      # Presenter & participant views
│           │   ├── public/           # Public share & check-in
│           │   ├── archive/          # Chat, files, announcements
│           │   ├── admin/            # Users, roles, permissions,
│           │   │                     # announcements, AD sync, acks
│           │   └── more/             # Menu hub & profile
│           ├── components/           # 20+ reusable UI components
│           │   ├── ui/               # DatePicker, Select, BottomSheet,
│           │   │                     # TabView, ActionSheet, ProgressBar
│           │   └── chat/             # MessageBubble, Input, Typing
│           ├── contexts/             # Auth, Theme, Chat providers
│           ├── navigation/           # 6-tab navigator + nested stacks
│           ├── services/             # API client, SignalR, file service
│           ├── hooks/                # SignalR, file upload/download
│           └── locales/              # AR/EN (~500 translation keys)
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

## Mobile App — Full Feature Coverage

The mobile app is a **complete, production-ready** implementation covering all platform features for all 5 stakeholder roles.

### Navigation Structure

```text
Bottom Tabs (6)
├── Dashboard        — Role-based KPIs, quick actions, recent items
├── Committees       — List → Detail → Form → Members
├── Meetings         — List → Detail → Form → Calendar
├── Chat             — Conversations → Messages (real-time via SignalR)
├── Tasks            — List → Detail → Form
└── More             — 19 feature modules organized in 3 sections
    ├── Features: MoMs, Voting, Surveys, Directives, Evaluations,
    │             Acknowledgments, Approvals, Change Requests
    ├── Resources: Reports, Workflow, Attachments, Locations,
    │              Room Booking, Archive
    └── System:   Admin Panel, Settings, Profile
```

### Stakeholder Roles

| Role | Access |
|------|--------|
| **SystemAdmin** | Full access + Admin panel (users, roles, permissions, AD sync, announcements) |
| **CommitteeHead** | Committee management, meeting creation, directive issuance, evaluations |
| **CommitteeSecretary** | Meeting minutes, agenda management, task assignment, workflow |
| **CommitteeMember** | Voting, surveys, task execution, acknowledgments, chat |
| **Observer** | Read-only access to meetings, documents, and reports |

### Real-time Features

- **Chat** — Instant messaging with typing indicators, read receipts, file attachments (SignalR `/hubs/chat`)
- **Notifications** — Live push notifications with badge counts (SignalR `/hubs/notifications`)
- **Live Surveys** — Presenter controls + participant voting with live result charts (SignalR `/hubs/live-survey`)

### Key Capabilities

- Full **Arabic (RTL) / English (LTR)** bilingual support (~500 translation keys)
- **Dark mode** / Light mode with system-aware theme switching
- **Demo mode** — Built-in offline demo with mock data for all 5 roles (no server required)
- **File management** — Upload via document picker, download with presigned URLs
- **Biometric login** — Face ID / Touch ID support
- **Pull-to-refresh** on all data screens
- **Role-based UI** — Admin features hidden for non-admin users

### Screen Count: 60+ screens across 19 feature modules

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
