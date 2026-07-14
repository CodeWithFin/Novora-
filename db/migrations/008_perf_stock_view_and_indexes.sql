-- Recreate stock view without expensive batch JSON aggregation.
DROP VIEW IF EXISTS items_with_stock;

CREATE VIEW items_with_stock AS
SELECT
  i.*,
  COALESCE(SUM(b.quantity), 0)::INTEGER AS total_stock,
  MIN(b.expiry_date) AS earliest_expiry
FROM items i
LEFT JOIN item_batches b ON b.item_id = i.id AND b.quantity > 0
GROUP BY i.id;

CREATE INDEX IF NOT EXISTS idx_batches_org_qty_expiry
  ON item_batches (org_id, expiry_date)
  WHERE quantity > 0 AND expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_org_created
  ON transactions (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_org_date_type
  ON transactions (org_id, transaction_date, type);
