-- 010_plan_day_override.sql — Plan day overrides

CREATE TABLE access_plan_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES access_plan(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profile_id UUID REFERENCES access_profile(id) ON DELETE SET NULL,
  custom_slots JSONB,
  custom_route_id UUID REFERENCES access_route(id) ON DELETE SET NULL,
  UNIQUE(plan_id, date, profile_id)
);
