CREATE TABLE item_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity    INTEGER DEFAULT 0,
  expiry_date DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_batches_org_id ON item_batches(org_id);
CREATE INDEX idx_batches_item_id ON item_batches(item_id);
CREATE INDEX idx_batches_fefo ON item_batches(item_id, expiry_date NULLS LAST);

CREATE VIEW items_with_stock AS
SELECT
  i.*,
  COALESCE(SUM(b.quantity), 0)::INTEGER AS total_stock,
  MIN(b.expiry_date) AS earliest_expiry,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', b.id,
        'quantity', b.quantity,
        'expiry_date', b.expiry_date
      ) ORDER BY b.expiry_date NULLS LAST
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) AS batches
FROM items i
LEFT JOIN item_batches b ON b.item_id = i.id AND b.quantity > 0
GROUP BY i.id;
