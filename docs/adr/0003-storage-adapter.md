# ADR 0003: File storage via adapter (Azure Blob / MinIO)

## Status

Accepted

## Context

المنصة تحتاج رفع/تحميل وثائق (تشكيل لجنة، مرفقات اجتماع، محاضر Word/PDF). بيئة Hybrid تفرض مرونة بين On-Prem وAzure.

## Decision

توفير واجهة `IFileStorage` داخل طبقة Infrastructure مع تطبيقين:

- `AzureBlobFileStorage` عند السماح بالتخزين السحابي
- `MinioFileStorage` كبديل On-Prem

مع توحيد: توليد روابط موقعة (Signed URLs) + سياسة صلاحية + تصنيف الوثائق + مسارات/Prefixes باللجنة/الاجتماع.

## Consequences

- قابلية تبديل backend التخزين بدون تغيير الكود التجاري.
- تحتاج مراقبة دقيقة لصلاحيات الوصول للملفات وسياسات الاحتفاظ (NDMO).

