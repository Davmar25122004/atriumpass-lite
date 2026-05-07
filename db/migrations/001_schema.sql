-- 001_schema.sql — Core tables: container_type, container_instance, container_relation, person, person_credential

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE container_type (
  id VARCHAR(60) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  color VARCHAR(7) DEFAULT '#666666',
  light_color VARCHAR(7) DEFAULT '#F0F0F0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE container_instance (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type_id VARCHAR(60) REFERENCES container_type(id) ON DELETE SET NULL,
  parent_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE SET NULL,
  path_id TEXT,
  attrs JSONB DEFAULT '{}',
  plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instance_parent ON container_instance(parent_id);
CREATE INDEX idx_instance_path ON container_instance(path_id);

CREATE TABLE container_relation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type VARCHAR(60) REFERENCES container_type(id) ON DELETE CASCADE,
  to_type VARCHAR(60) REFERENCES container_type(id) ON DELETE CASCADE,
  label VARCHAR(120),
  UNIQUE(from_type, to_type)
);

CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dni VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  node_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE SET NULL,
  path_id TEXT,
  plan_id UUID,
  hire_date DATE,
  photo TEXT,
  attrs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_person_node ON person(node_id);
CREATE INDEX idx_person_path ON person(path_id);
CREATE INDEX idx_person_dni ON person(dni);

CREATE TABLE person_credential (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  card_number BIGINT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
