-- 009_person_override.sql — Personal calendar overrides

CREATE TABLE person_calendar_override (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profile_id UUID REFERENCES access_profile(id) ON DELETE SET NULL,
  custom_slots JSONB,
  custom_access_point_ids JSONB,
  note TEXT,
  UNIQUE(person_id, date, profile_id)
);
