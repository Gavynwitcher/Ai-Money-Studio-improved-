PRAGMA foreign_keys = ON;

-- Canonical orders captured from Orders / Order Items reports.
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  purchase_date TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  item_price FLOAT NOT NULL,
  item_tax FLOAT NOT NULL,
  shipping_price FLOAT NOT NULL,
  shipping_tax FLOAT NOT NULL,
  gift_wrap_price FLOAT NOT NULL,
  gift_wrap_tax FLOAT NOT NULL,
  promotion_discount FLOAT NOT NULL,
  currency TEXT NOT NULL,
  marketplace TEXT,
  status TEXT,
  last_update TEXT,
  settlement_id TEXT,
  FOREIGN KEY (sku) REFERENCES sku_master(sku),
  FOREIGN KEY (settlement_id) REFERENCES settlements(settlement_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_sku_date ON orders (sku, purchase_date);
CREATE INDEX IF NOT EXISTS idx_orders_settlement ON orders (settlement_id);

-- Settlement headers from Amazon Settlement Report.
CREATE TABLE IF NOT EXISTS settlements (
  settlement_id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  deposit_date TEXT,
  currency TEXT NOT NULL,
  total_amount FLOAT NOT NULL,
  processing_status TEXT,
  report_type TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settlements_dates ON settlements (start_date, end_date);

-- Settlement line items from Amazon settlement transaction report.
-- Columns are derived from the transaction CSV header (normalized to snake_case).
CREATE TABLE IF NOT EXISTS settlement_lines (
  line_id INTEGER PRIMARY KEY,
  date_time TEXT NOT NULL,
  settlement_id TEXT NOT NULL,
  type TEXT NOT NULL,
  order_id TEXT,
  sku TEXT,
  description TEXT,
  quantity INTEGER,
  marketplace TEXT,
  fulfillment TEXT,
  order_city TEXT,
  order_state TEXT,
  order_postal TEXT,
  tax_collection_model TEXT,
  product_sales FLOAT,
  product_sales_tax FLOAT,
  shipping_credits FLOAT,
  shipping_credits_tax FLOAT,
  gift_wrap_credits FLOAT,
  giftwrap_credits_tax FLOAT,
  regulatory_fee FLOAT,
  tax_on_regulatory_fee FLOAT,
  promotional_rebates FLOAT,
  promotional_rebates_tax FLOAT,
  marketplace_withheld_tax FLOAT,
  selling_fees FLOAT,
  fba_fees FLOAT,
  other_transaction_fees FLOAT,
  other FLOAT,
  total FLOAT,
  FOREIGN KEY (settlement_id) REFERENCES settlements(settlement_id),
  FOREIGN KEY (sku) REFERENCES sku_master(sku)
);

CREATE INDEX IF NOT EXISTS idx_settlement_lines_date ON settlement_lines (date_time);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_order ON settlement_lines (order_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_sku ON settlement_lines (sku);

-- Inventory snapshots from Inventory Snapshot Report.
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  snapshot_id INTEGER PRIMARY KEY,
  snapshot_date TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity_on_hand INTEGER NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_reserved INTEGER NOT NULL,
  quantity_inbound INTEGER NOT NULL,
  condition TEXT,
  warehouse TEXT,
  FOREIGN KEY (sku) REFERENCES sku_master(sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_sku_date
  ON inventory_snapshots (sku, snapshot_date);

-- FBA inventory events from FBA Inventory Event Report.
CREATE TABLE IF NOT EXISTS fba_events (
  event_id INTEGER PRIMARY KEY,
  event_date TEXT NOT NULL,
  sku TEXT NOT NULL,
  event_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  disposition TEXT,
  fulfillment_center TEXT,
  reference_id TEXT,
  amount FLOAT NOT NULL,
  currency TEXT,
  settlement_id TEXT,
  FOREIGN KEY (sku) REFERENCES sku_master(sku),
  FOREIGN KEY (settlement_id) REFERENCES settlements(settlement_id)
);

CREATE INDEX IF NOT EXISTS idx_fba_events_sku_date ON fba_events (sku, event_date);
CREATE INDEX IF NOT EXISTS idx_fba_events_settlement ON fba_events (settlement_id);

-- SKU master data and COGS. COGS is separate from Amazon fees.
CREATE TABLE IF NOT EXISTS sku_master (
  sku TEXT PRIMARY KEY,
  asin TEXT,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  unit_cost FLOAT NOT NULL,
  currency TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sku_master_asin ON sku_master (asin);
