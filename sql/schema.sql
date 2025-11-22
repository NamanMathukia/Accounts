-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_unit_grams INTEGER NOT NULL,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock_grams BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'txn_type') THEN
    CREATE TYPE txn_type AS ENUM ('purchase', 'sale');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  txn_type txn_type NOT NULL,
  quantity_grams BIGINT NOT NULL,
  packet_size_grams INTEGER NOT NULL,
  count_packets INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_settings (
  product_id UUID PRIMARY KEY REFERENCES products(id),
  reorder_threshold_grams BIGINT DEFAULT 1000
);

CREATE OR REPLACE FUNCTION insert_transaction_and_update_inventory(
  p_product_id UUID,
  p_txn_type txn_type,
  p_quantity_grams BIGINT,
  p_packet_size_grams INTEGER,
  p_count_packets INTEGER,
  p_unit_price NUMERIC,
  p_total_price NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO transactions (
    product_id, txn_type, quantity_grams,
    packet_size_grams, count_packets,
    unit_price, total_price, notes
  ) VALUES (
    p_product_id, p_txn_type, p_quantity_grams,
    p_packet_size_grams, p_count_packets,
    p_unit_price, p_total_price, p_notes
  );

  PERFORM 1 FROM inventory WHERE product_id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO inventory (product_id, stock_grams, last_updated)
    VALUES (p_product_id, 0, NOW());
  END IF;

  IF p_txn_type = 'purchase' THEN
    UPDATE inventory SET stock_grams = stock_grams + p_quantity_grams, last_updated = NOW() WHERE product_id = p_product_id;
  ELSE
    UPDATE inventory SET stock_grams = stock_grams - p_quantity_grams, last_updated = NOW() WHERE product_id = p_product_id;
  END IF;
END;
$$;
