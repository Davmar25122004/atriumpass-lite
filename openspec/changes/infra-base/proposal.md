# Proposal: infra-base

## Summary
Set up the foundational infrastructure for AtriumPass Lite: Docker Compose with 3 services (PostgreSQL 16, Fastify backend, Vite frontend), 15 SQL migrations defining the complete schema, seed data with demo users, and minimal running services.

## Motivation
The project needs a working database schema, backend API skeleton, and frontend shell before any feature work can begin. This phase establishes the development environment and data model.

## Changes
1. `docker-compose.yml` — 3 services: db (postgres:16-alpine), backend (Fastify :3001), frontend (Vite :5174)
2. `db/migrations/001-015` — Complete SQL schema (container types, instances, persons, users, access points, plans, profiles, routes, schedules, permissions, logs, methods, holidays)
3. `db/seeds/001_seed.sql` — Demo data: types, zones, persons, admin user (admin/admin123)
4. `backend/` — Fastify with /health endpoint, postgres.js client
5. `frontend/` — Vite + React + TailwindCSS with Vivaldi design system CSS

## Verification
- `docker compose up -d` → 3 services healthy
- `curl localhost:3001/health` → `{"status":"ok"}`
- Frontend accessible at localhost:5174
