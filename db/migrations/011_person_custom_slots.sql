-- 011_person_custom_slots.sql — Access points and permissions

CREATE TABLE access_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE SET NULL,
  path_id TEXT,
  name VARCHAR(120) NOT NULL,
  direction VARCHAR(20) DEFAULT 'ambas' CHECK (direction IN ('entrada', 'salida', 'ambas')),
  device_type VARCHAR(40) DEFAULT 'puerta' CHECK (device_type IN ('puerta', 'barrera', 'torno')),
  entry_method VARCHAR(40) DEFAULT 'nfc',
  exit_method VARCHAR(40) DEFAULT 'nfc',
  device_id VARCHAR(80) UNIQUE,
  relay_duration_ms INT DEFAULT 5000,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ap_node ON access_point(node_id);
CREATE INDEX idx_ap_path ON access_point(path_id);

CREATE TABLE access_permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  access_point_id UUID REFERENCES access_point(id) ON DELETE CASCADE,
  direction VARCHAR(20) DEFAULT 'ambas',
  anti_passback VARCHAR(20) DEFAULT 'none',
  last_direction VARCHAR(20),
  last_access_at TIMESTAMPTZ,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, access_point_id, direction)
);

CREATE TABLE access_route_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES access_route(id) ON DELETE CASCADE,
  access_point_id UUID REFERENCES access_point(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0
);
