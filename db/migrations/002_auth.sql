-- 002_auth.sql — app_user table

CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (role IN ('superadmin', 'admin', 'usuario')),
  pin_code VARCHAR(6) UNIQUE,
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  face_descriptor TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_username ON app_user(username);
CREATE INDEX idx_user_person ON app_user(person_id);
