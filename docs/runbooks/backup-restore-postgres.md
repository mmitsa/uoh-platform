# Runbook: Backup & Restore (PostgreSQL)

## Backup (logical)

```bash
pg_dump -h <host> -U <user> -d <db> -Fc -f uoh_meetings.dump
```

## Restore

```bash
createdb -h <host> -U <user> uoh_meetings_restored
pg_restore -h <host> -U <user> -d uoh_meetings_restored --clean --if-exists uoh_meetings.dump
```

## Notes

- التشفير أثناء النقل: استخدم TLS/VPN حسب بيئة الجامعة.\n- احتفظ بنسخ يومية + أسبوعية حسب سياسة NDMO.

