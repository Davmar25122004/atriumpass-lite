-- 014_multi_profiles_day.sql — Access log table

CREATE TABLE access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_point_id UUID REFERENCES access_point(id) ON DELETE SET NULL,
  path_id TEXT,
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  direction VARCHAR(20),
  method_used VARCHAR(40),
  granted BOOLEAN NOT NULL,
  deny_reason TEXT,
  device_id VARCHAR(80),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_granted_ts ON access_log(granted, timestamp);
CREATE INDEX idx_log_person ON access_log(person_id);
CREATE INDEX idx_log_ap ON access_log(access_point_id);
