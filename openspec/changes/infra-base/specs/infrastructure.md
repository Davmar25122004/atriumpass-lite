# Spec: Infrastructure Base

## Requirements
- Docker Compose with 3 services: db, backend, frontend
- PostgreSQL 16 Alpine with healthcheck
- Backend depends on db healthy
- Frontend depends on backend
- Hot reload for both backend and frontend via volume mounts
- 15 SQL migrations covering full data model
- Seed with demo data including admin superuser

## Acceptance Criteria
- [ ] `docker compose up -d` starts all 3 services
- [ ] `pg_isready` healthcheck passes within 50s
- [ ] `curl localhost:3001/health` returns `{"status":"ok"}`
- [ ] Frontend loads at localhost:5174
- [ ] All 15 migrations execute without errors
- [ ] Seed data populates tables correctly
