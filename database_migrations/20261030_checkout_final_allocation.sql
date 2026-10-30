-- Stop the old application before applying. Intended for the existing PostgreSQL entity schema.
BEGIN;
CREATE TABLE IF NOT EXISTS checkout_schema_migrations (name VARCHAR(100) PRIMARY KEY);
LOCK TABLE orders IN EXCLUSIVE MODE;
DO $$
DECLARE constraint_row RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM checkout_schema_migrations WHERE name = '20261030_final_allocation') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_key VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_allocated BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS unavailable_product_id BIGINT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS unavailable_product_name VARCHAR(255);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(255);

    -- Hibernate may have generated CHECK constraints for the previous Java enum values.
    FOR constraint_row IN
      SELECT conrelid::regclass AS relation_name, conname FROM pg_constraint
      WHERE contype = 'c' AND conrelid IN ('orders'::regclass, 'payments'::regclass)
        AND pg_get_constraintdef(oid) ~ '\m(payment_)?status\M'
    LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', constraint_row.relation_name, constraint_row.conname);
    END LOOP;
    ALTER TABLE orders ADD CONSTRAINT orders_checkout_status_check
      CHECK (status IN ('PENDING_PAYMENT','CONFIRMED','PROCESSING','COMPLETED','FAILED','CANCELLED','STOCK_UNAVAILABLE'));
    ALTER TABLE orders ADD CONSTRAINT orders_checkout_payment_status_check
      CHECK (payment_status IN ('PENDING','INITIATED','SUCCESS','FAILED','CANCELLED','DUE_ON_DELIVERY','REFUND_PENDING','REFUNDED'));
    ALTER TABLE payments ADD CONSTRAINT payments_checkout_status_check
      CHECK (status IN ('PENDING','INITIATED','SUCCESS','FAILED','CANCELLED','DUE_ON_DELIVERY','REFUND_PENDING','REFUNDED'));

    -- The previous implementation deducted stock at creation for pending online orders.
    UPDATE products p SET available_stock = p.available_stock + reserved.quantity
    FROM (
      SELECT oi.product_id, SUM(oi.quantity) AS quantity
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'PENDING_PAYMENT' GROUP BY oi.product_id
    ) reserved WHERE p.id = reserved.product_id;
    UPDATE payments SET status = 'CANCELLED'
      WHERE order_id IN (SELECT id FROM orders WHERE status = 'PENDING_PAYMENT');
    UPDATE orders SET status = 'CANCELLED', payment_status = 'CANCELLED'
      WHERE status = 'PENDING_PAYMENT';
    UPDATE orders SET stock_allocated = TRUE WHERE status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED');
    CREATE UNIQUE INDEX IF NOT EXISTS orders_user_checkout_key ON orders(user_id, checkout_key);
    INSERT INTO checkout_schema_migrations VALUES ('20261030_final_allocation');
  END IF;
END $$;
COMMIT;
