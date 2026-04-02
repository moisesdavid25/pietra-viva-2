-- Tables management for per-table QR code generation (Fase 5 - Personalizzazione)
CREATE TABLE IF NOT EXISTS tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  table_number   text NOT NULL,
  position       smallint NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_tables" ON tables FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));

CREATE POLICY "manage_own_tables" ON tables FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
