-- 008_person_plan.sql — Already handled via person.plan_id FK in 004
-- This migration ensures index exists

CREATE INDEX IF NOT EXISTS idx_person_plan ON person(plan_id);
