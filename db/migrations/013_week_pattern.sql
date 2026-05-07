-- 013_week_pattern.sql — Weekly recurring profile pattern

CREATE TABLE access_plan_week_pattern (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES access_plan(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  profile_id UUID REFERENCES access_profile(id) ON DELETE CASCADE,
  UNIQUE(plan_id, day_of_week, profile_id)
);
