# Infrastructure

## Local dev infra

```bash
docker compose -f docker-compose.yml up -d
```

## Full stack (api + web + db + redis)

```bash
docker compose -f docker-compose.app.yml up --build
```

## Load testing (k6)

```bash
k6 run infra/k6/smoke.js
```

