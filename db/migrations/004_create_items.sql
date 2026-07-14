CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sku         TEXT,
  barcode     TEXT,
  category    TEXT,
  unit        TEXT DEFAULT 'pcs',
  price       NUMERIC(12,2),
  min_stock   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, sku),
  UNIQUE(org_id, barcode)
);

CREATE INDEX idx_items_org_id ON items(org_id);
CREATE INDEX idx_items_barcode ON items(org_id, barcode);
