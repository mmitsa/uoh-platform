# ADR 0001: Hybrid hosting topology

## Status

Accepted

## Context

المنصة يجب أن تدعم تكاملات Microsoft 365 (Graph/Teams/Exchange) مع متطلبات NCA/NDMO، وتعمل في بيئة جامعة قد تتطلب إبقاء البيانات الحساسة داخل الشبكة الداخلية.

## Decision

اعتماد بنية **Hybrid**:

- **On-Prem (داخل الجامعة)**: API + PostgreSQL + Redis + Audit Logs + مفاتيح التشفير الأساسية + خدمات Workflow الأساسية.
- **Cloud (Azure) - اختياري حسب السياسة**: تخزين ملفات كبير (Azure Blob) + مراقبة (Azure Monitor) + Key Vault (إن سمح) + بوابات/حماية طرفية.

مع طبقة تجريد للتخزين (Storage Adapter) تسمح بالتحويل بين Azure Blob وMinIO بدون تغيير في Domain.

## Consequences

- يحقق تقليل مخاطر تسرب البيانات الحساسة ويعطي مرونة تشغيل.
- يزيد تعقيد التشغيل (شبكات/VPN/Firewall) ويستلزم Runbooks واضحة.

