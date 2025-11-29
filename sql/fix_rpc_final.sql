-- 1. Ensure Enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'gpay', 'lend');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('paid', 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'txn_type') THEN
    CREATE TYPE txn_type AS ENUM ('purchase', 'sale');
  END IF;
END$$;

-- 2. Ensure Transactions Table has new columns
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS payment_method payment_method,
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'paid';

-- 3. Ensure Products Table has stock columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_packets_250 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_packets_500 INTEGER DEFAULT 0;

-- 4. Drop old inventory table (cleanup)
DROP TABLE IF EXISTS inventory;

-- 5. Update RPC Function to use Products table columns
CREATE OR REPLACE FUNCTION insert_transaction_and_update_inventory(
  p_product_id UUID,
  p_txn_type txn_type,
  p_quantity_grams BIGINT,
  p_packet_size_grams INTEGER,
  p_count_packets INTEGER,
  p_unit_price NUMERIC,
  p_total_price NUMERIC,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL,
  p_payment_status payment_status DEFAULT 'paid'
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  -- Insert into transactions
  INSERT INTO transactions (
    product_id, txn_type, quantity_grams,
    packet_size_grams, count_packets,
    unit_price, total_price, notes, user_id,
    customer_name, payment_method, payment_status
  ) VALUES (
    p_product_id, p_txn_type, p_quantity_grams,
    p_packet_size_grams, p_count_packets,
    p_unit_price, p_total_price, p_notes, p_user_id,
    p_customer_name, p_payment_method, p_payment_status
  );

  -- Update Product Stock Columns
  IF p_txn_type = 'purchase' THEN
    IF p_packet_size_grams = 250 THEN
      UPDATE products SET stock_packets_250 = COALESCE(stock_packets_250, 0) + p_count_packets WHERE id = p_product_id;
    ELSE
      UPDATE products SET stock_packets_500 = COALESCE(stock_packets_500, 0) + p_count_packets WHERE id = p_product_id;
    END IF;
  ELSE -- Sale
    IF p_packet_size_grams = 250 THEN
      UPDATE products SET stock_packets_250 = GREATEST(COALESCE(stock_packets_250, 0) - p_count_packets, 0) WHERE id = p_product_id;
    ELSE
      UPDATE products SET stock_packets_500 = GREATEST(COALESCE(stock_packets_500, 0) - p_count_packets, 0) WHERE id = p_product_id;
    END IF;
  END IF;
END;
$$;
