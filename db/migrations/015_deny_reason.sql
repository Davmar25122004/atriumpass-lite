-- 015_deny_reason.sql — Holiday table + path sync triggers

CREATE TABLE holiday (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name VARCHAR(120) NOT NULL,
  scope_node_id VARCHAR(80) REFERENCES container_instance(id) ON DELETE CASCADE,
  recurring BOOLEAN DEFAULT false
);

-- Trigger: sync path_id on person when node_id changes
CREATE OR REPLACE FUNCTION sync_person_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.node_id IS NOT NULL THEN
    SELECT path_id INTO NEW.path_id FROM container_instance WHERE id = NEW.node_id;
  ELSE
    NEW.path_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_path
  BEFORE INSERT OR UPDATE OF node_id ON person
  FOR EACH ROW EXECUTE FUNCTION sync_person_path();

-- Trigger: sync path_id on access_point when node_id changes
CREATE OR REPLACE FUNCTION sync_ap_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.node_id IS NOT NULL THEN
    SELECT path_id INTO NEW.path_id FROM container_instance WHERE id = NEW.node_id;
  ELSE
    NEW.path_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ap_path
  BEFORE INSERT OR UPDATE OF node_id ON access_point
  FOR EACH ROW EXECUTE FUNCTION sync_ap_path();
