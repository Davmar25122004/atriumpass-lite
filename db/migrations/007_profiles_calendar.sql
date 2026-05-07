-- 007_profiles_calendar.sql — Profile items linking route + schedule

CREATE TABLE access_profile_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES access_profile(id) ON DELETE CASCADE,
  route_id UUID REFERENCES access_route(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES access_schedule(id) ON DELETE CASCADE
);

CREATE TABLE access_schedule_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES access_schedule(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  CHECK (time_from < time_to)
);
