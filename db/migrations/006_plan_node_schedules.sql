-- 006_plan_node_schedules.sql — Plan-specific schedule overrides per node

CREATE TABLE plan_node_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES access_plan(id) ON DELETE CASCADE,
  node_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE CASCADE,
  day_type VARCHAR(20) NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  scope VARCHAR(20) DEFAULT 'local' CHECK (scope IN ('local', 'cascade')),
  UNIQUE(plan_id, node_id, day_type)
);
