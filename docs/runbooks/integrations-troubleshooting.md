# Runbook: Integrations troubleshooting

## Microsoft Graph (Teams/Exchange)
- تحقق من App Registration: **Application permissions** المطلوبة (OnlineMeetings.ReadWrite.All, Calendars.ReadWrite) + Admin consent.
- تحقق من القيم في `Integrations:Teams:*` (TenantId/ClientId/ClientSecret/OrganizerUpn).
- راقب أخطاء throttling (HTTP 429) وتأكد من وجود retries.

## Zoom
- تحقق من `Integrations:Zoom:BearerToken`.\n- راقب حدود المعدل (Rate limits) وخصّص retries.

## SMTP
- تحقق من Host/Port وTLS وبيانات الحساب.\n- في حال Relay داخلي: تأكد من السماح من IP الخادم.

## FCM
- في التشغيل الإنتاجي: يُفضل استخدام OAuth لخدمة Google بدل Bearer ثابت.\n- تحقق من صلاحيات المشروع وتسجيل device tokens.

