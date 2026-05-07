-- 004_plan_instances.sql — Link plan to container_instance and person

ALTER TABLE container_instance
  ADD CONSTRAINT fk_instance_plan FOREIGN KEY (plan_id) REFERENCES access_plan(id) ON DELETE SET NULL;

ALTER TABLE person
  ADD CONSTRAINT fk_person_plan FOREIGN KEY (plan_id) REFERENCES access_plan(id) ON DELETE SET NULL;
