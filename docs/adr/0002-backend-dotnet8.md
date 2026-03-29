# ADR 0002: Backend technology (.NET 8)

## Status

Accepted

## Context

مطلوب API مؤسسي عالي الاعتمادية، تكاملات متعددة، أداء مرتفع، ونضج في أدوات الأمن والمراقبة والـ CI.

## Decision

اعتماد **ASP.NET Core (.NET 8)** لبناء API:

- REST APIs (versioned: `/api/v1/...`)
- SignalR للـ realtime (تصويت/إشعارات/تحديثات Workflow)
- EF Core + PostgreSQL
- Redis للتخزين المؤقت والـ rate limit والـ background jobs

## Consequences

- إنتاجية عالية ونضج tooling في بيئات المؤسسات.
- يتطلب توحيد نمط المعمارية (Clean Architecture) لتقليل التعقيد مع توسع المجالات.

