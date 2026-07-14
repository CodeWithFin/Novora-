CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  quantity         INTEGER NOT NULL,
  shop_id          UUID REFERENCES shops(id),
  notes            TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_org_id ON transactions(org_id);
CREATE INDEX idx_transactions_item_id ON transactions(item_id);
CREATE INDEX idx_transactions_created_at ON transactions(org_id, created_at DESC);
