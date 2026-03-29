# UOH Meetings Platform

منصة إدارة المجالس واللجان والاجتماعات (جامعة حائل) بواجهات **عربية/إنجليزية**، وتكامل SSO مع **Microsoft Entra ID**، وتطبيق جوال، ومحرك Workflow، مع الالتزام بمتطلبات الأمن والحوكمة.

## Monorepo structure

```
/
├── apps/
│   ├── api/          # .NET 8 API (REST + SignalR)
│   ├── web/          # React 18 Web App
│   └── mobile/       # React Native (Expo)
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── ui/           # Shared UI components + design tokens
│   └── config/       # Shared configs (eslint/prettier/tsconfig)
├── infra/            # Docker compose + IaC stubs
└── docs/             # Documentation (ADR, runbooks, security)
```

## Quick start (dev)

1) Start infrastructure

```bash
cd infra
docker compose up -d
```

2) Run API

```bash
cd apps/api
dotnet run
```

3) Run Web

```bash
cd apps/web
npm install
npm run dev
```

## Notes

- هذا المشروع مُصمم لبيئة **Hybrid** (On-Prem + Azure) ويمكن تشغيله بالكامل On-Prem في التطوير عبر Docker.
