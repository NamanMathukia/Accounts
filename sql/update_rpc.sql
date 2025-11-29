CREATE OR REPLACE FUNCTION insert_transaction_and_update_inventory(
  p_product_id UUID,
  p_txn_type txn_type,
  p_quantity_grams BIGINT,
  p_packet_size_grams INTEGER,
  p_count_packets INTEGER,
  p_unit_price NUMERIC,
  p_total_price NUMERIC,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO transactions (
    product_id, txn_type, quantity_grams,
    packet_size_grams, count_packets,
    unit_price, total_price, notes, user_id
  ) VALUES (
    p_product_id, p_txn_type, p_quantity_grams,
    p_packet_size_grams, p_count_packets,
    p_unit_price, p_total_price, p_notes, p_user_id
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
