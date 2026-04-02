-- Opening hours table for restaurant schedule management
-- Each restaurant has 7 rows (one per day of week: 0=Monday, 6=Sunday)
CREATE TABLE IF NOT EXISTS opening_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time     time,
  close_time    time,
  is_closed     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week)
);

ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_opening_hours" ON opening_hours FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));

CREATE POLICY "manage_own_opening_hours" ON opening_hours FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
