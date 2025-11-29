-- Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock_grams BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
