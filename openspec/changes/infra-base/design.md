# Design: infra-base

## Architecture
3-service Docker Compose: PostgreSQL 16 Alpine, Fastify backend (TypeScript via tsx), Vite React frontend.

## Database
- PostgreSQL 16 Alpine on port 5433 (host) / 5432 (container)
- 15 numbered migrations loaded via docker-entrypoint-initdb.d
- Seed loaded as 099_seed.sql (runs after migrations)

## Backend
- Fastify 4.x with TypeScript, executed via `npx tsx --watch`
- postgres.js for SQL (tag-template, no ORM)
- Single /health endpoint for Phase 1
- Port 3001

## Frontend
- React 18 + Vite 5 + TypeScript + TailwindCSS 3.4
- Vivaldi design system (CSS custom properties for colors, typography, layout)
- DM Sans font from Google Fonts
- Port 5174 with HMR
