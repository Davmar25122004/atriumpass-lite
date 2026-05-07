-- 005_node_schedules.sql — Schedule slots per node

CREATE TABLE node_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE CASCADE,
  day_type VARCHAR(20) NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(node_id, day_type)
);
