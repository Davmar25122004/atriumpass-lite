-- 012_access_methods.sql — Catalog of access methods

CREATE TABLE access_method (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(40) UNIQUE NOT NULL,
  label VARCHAR(80) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

INSERT INTO access_method (key, label) VALUES
  ('nfc', 'Tarjeta NFC'),
  ('qr', 'Codigo QR'),
  ('pin', 'Codigo PIN'),
  ('huella', 'Huella dactilar'),
  ('facial', 'Reconocimiento facial'),
  ('llavero', 'Llavero RFID'),
  ('libre', 'Paso libre');
