-- CRM improvements: accurate At-Risk detection + campaign history (Fase 4)

-- 1. Add last_visited_at to customers for correct churn detection
--    (replaces incorrect use of created_at in isAtRisk logic)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visited_at timestamptz;

-- 2. Backfill existing customers from their most recent transaction
UPDATE customers c
SET last_visited_at = (
  SELECT MAX(lt.created_at)
  FROM loyalty_transactions lt
  WHERE lt.customer_id = c.id
)
WHERE last_visited_at IS NULL;

-- 3. Trigger to auto-update last_visited_at on each new loyalty transaction
CREATE OR REPLACE FUNCTION update_customer_last_visited()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE customers
  SET last_visited_at = NEW.created_at
  WHERE id = NEW.customer_id
    AND (last_visited_at IS NULL OR last_visited_at < NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_last_visited ON loyalty_transactions;
CREATE TRIGGER trg_customer_last_visited
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION update_customer_last_visited();

-- 4. CRM campaigns table
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  segment          text NOT NULL CHECK (segment IN ('green','gold','reserve','at_risk','new','all')),
  message_template text NOT NULL,
  recipient_count  integer NOT NULL DEFAULT 0,
  sent_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_own_campaigns" ON crm_campaigns FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
