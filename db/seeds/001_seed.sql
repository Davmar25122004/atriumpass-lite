-- Seed data for AtriumPass Lite demo

-- Container types
INSERT INTO container_type (id, label, color, light_color) VALUES
  ('urbanizacion',   'Urbanizacion',    '#3B4E32', '#EEF3EC'),
  ('zona_exterior',  'Zona Exterior',   '#28536B', '#EAF1F5'),
  ('edificio_viv',   'Edificio',        '#5A405A', '#F2EBEE'),
  ('planta',         'Planta',          '#D68C45', '#FBF3E7'),
  ('sala_comunal',   'Sala Comunal',    '#81667A', '#F0EAF0'),
  ('vivienda',       'Vivienda',        '#689689', '#ECF2F0');

-- Container relations
INSERT INTO container_relation (from_type, to_type, label) VALUES
  ('urbanizacion',  'zona_exterior', 'contiene'),
  ('urbanizacion',  'edificio_viv',  'contiene'),
  ('edificio_viv',  'planta',        'contiene'),
  ('planta',        'sala_comunal',  'contiene'),
  ('planta',        'vivienda',      'contiene');

-- Container instances (zone tree)
INSERT INTO container_instance (id, name, type_id, parent_id, path_id) VALUES
  ('URB_CENTRO',  'Urbanizacion Centro',  'urbanizacion', NULL,         'URB_CENTRO'),
  ('EDIF_A',      'Edificio A',           'edificio_viv', 'URB_CENTRO', 'URB_CENTRO.EDIF_A'),
  ('PL_BAJA',     'Planta Baja',          'planta',       'EDIF_A',     'URB_CENTRO.EDIF_A.PL_BAJA'),
  ('PL_1',        'Planta 1',             'planta',       'EDIF_A',     'URB_CENTRO.EDIF_A.PL_1'),
  ('SALA_GYM',    'Gimnasio',             'sala_comunal', 'PL_BAJA',    'URB_CENTRO.EDIF_A.PL_BAJA.SALA_GYM'),
  ('VIV_101',     'Vivienda 101',         'vivienda',     'PL_1',       'URB_CENTRO.EDIF_A.PL_1.VIV_101'),
  ('VIV_102',     'Vivienda 102',         'vivienda',     'PL_1',       'URB_CENTRO.EDIF_A.PL_1.VIV_102');

-- Persons
INSERT INTO person (first_name, last_name, dni, email, node_id, path_id, hire_date) VALUES
  ('David',  'Garcia',    '11111111A', 'david@demo.com',  'VIV_101', 'URB_CENTRO.EDIF_A.PL_1.VIV_101', '2021-01-10'),
  ('Laura',  'Martinez',  '22222222B', 'laura@demo.com',  'VIV_102', 'URB_CENTRO.EDIF_A.PL_1.VIV_102', '2024-02-01'),
  ('Carlos', 'Lopez',     '33333333C', 'carlos@demo.com', 'SALA_GYM','URB_CENTRO.EDIF_A.PL_BAJA.SALA_GYM', '2022-06-15');

-- Admin user (password: admin123)
INSERT INTO app_user (username, password_hash, full_name, role, pin_code)
VALUES ('admin', '$2b$10$5iNXEjb/57P55MkbldwgdOj4EZH4uAulJThdkY33g90ULhmf31p2i', 'Administrador', 'superadmin', '0000');

-- Access points
INSERT INTO access_point (node_id, path_id, name, direction, device_type, entry_method, exit_method, device_id) VALUES
  ('URB_CENTRO', 'URB_CENTRO', 'Verja Principal', 'ambas', 'barrera', 'nfc', 'nfc', 'VER-001'),
  ('EDIF_A', 'URB_CENTRO.EDIF_A', 'Portal Edificio A', 'ambas', 'puerta', 'nfc', 'qr', 'PRT-A-001'),
  ('SALA_GYM', 'URB_CENTRO.EDIF_A.PL_BAJA.SALA_GYM', 'Acceso Gimnasio', 'ambas', 'torno', 'nfc', 'libre', 'GYM-001');

-- Access schedule (Horario Oficina L-V 8:00-20:00)
INSERT INTO access_schedule (name, description) VALUES ('Horario Oficina', 'Lunes a Viernes 8:00 a 20:00');

INSERT INTO access_schedule_slot (schedule_id, day_of_week, time_from, time_to)
SELECT s.id, d.dow, '08:00', '20:00'
FROM access_schedule s, generate_series(1, 5) AS d(dow)
WHERE s.name = 'Horario Oficina';

-- Access route (Zona General)
INSERT INTO access_route (name, description) VALUES ('Zona General', 'Acceso a verja y portal');

INSERT INTO access_route_point (route_id, access_point_id, order_index)
SELECT r.id, ap.id, ROW_NUMBER() OVER ()
FROM access_route r, access_point ap
WHERE r.name = 'Zona General' AND ap.device_id IN ('VER-001', 'PRT-A-001');

-- Access profile
INSERT INTO access_profile (name, description) VALUES ('Perfil Estandar', 'Zona general en horario oficina');

INSERT INTO access_profile_item (profile_id, route_id, schedule_id)
SELECT p.id, r.id, s.id
FROM access_profile p, access_route r, access_schedule s
WHERE p.name = 'Perfil Estandar' AND r.name = 'Zona General' AND s.name = 'Horario Oficina';

-- Access plan
INSERT INTO access_plan (name, description, default_profile_id)
SELECT 'Plan Residentes', 'Plan basico para residentes', p.id
FROM access_profile p WHERE p.name = 'Perfil Estandar';
