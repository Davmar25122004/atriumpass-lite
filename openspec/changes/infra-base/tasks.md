# Tasks: infra-base

- [ ] Create docker-compose.yml (3 services)
- [ ] Create db/migrations/001-015 SQL files
- [ ] Create db/seeds/001_seed.sql with demo data
- [ ] Create backend/Dockerfile + package.json + tsconfig.json
- [ ] Create backend/src/index.ts (Fastify + /health)
- [ ] Create backend/src/db/client.ts (postgres.js)
- [ ] Create frontend/Dockerfile + package.json + configs
- [ ] Create frontend/src/index.css (Vivaldi design system)
- [ ] Create frontend/src/App.tsx + main.tsx (minimal shell)
- [ ] Verify docker compose up -d → 3 healthy services
- [ ] Verify curl localhost:3001/health → ok
