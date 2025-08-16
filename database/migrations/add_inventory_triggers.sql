-- Add database triggers for automatic inventory snapshot updates
-- This ensures that the snapshot table is always kept in sync
-- even if application code fails to update it manually

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_inventory_audit_insert;
DROP TRIGGER IF EXISTS after_inventory_audit_update;

DELIMITER //

-- Trigger to automatically update snapshot when audit log entries are created
CREATE TRIGGER after_inventory_audit_insert
AFTER INSERT ON inventory_audit_log
FOR EACH ROW
BEGIN
    -- Update the inventory snapshot
    INSERT INTO store_inventory_snapshot (
        store_id, 
        drug_id, 
        quantity_on_hand, 
        last_transaction_id,
        last_transaction_date,
        last_transaction_type,
        last_updated_by
    )
    VALUES (
        NEW.store_id,
        NEW.drug_id,
        NEW.quantity_after,
        NEW.id,
        NEW.transaction_date,
        NEW.transaction_type,
        NEW.performed_by
    )
    ON DUPLICATE KEY UPDATE
        quantity_on_hand = NEW.quantity_after,
        last_transaction_id = NEW.id,
        last_transaction_date = NEW.transaction_date,
        last_transaction_type = NEW.transaction_type,
        last_updated_by = NEW.performed_by,
        updated_at = CURRENT_TIMESTAMP;
END//

-- Optional: Trigger for audit log updates (in case audit entries are ever modified)
CREATE TRIGGER after_inventory_audit_update
AFTER UPDATE ON inventory_audit_log
FOR EACH ROW
BEGIN
    -- Only update if the quantity_after or other relevant fields changed
    IF NEW.quantity_after != OLD.quantity_after OR 
       NEW.transaction_type != OLD.transaction_type OR
       NEW.performed_by != OLD.performed_by THEN
        
        UPDATE store_inventory_snapshot
        SET 
            quantity_on_hand = NEW.quantity_after,
            last_transaction_id = NEW.id,
            last_transaction_date = NEW.transaction_date,
            last_transaction_type = NEW.transaction_type,
            last_updated_by = NEW.performed_by,
            updated_at = CURRENT_TIMESTAMP
        WHERE store_id = NEW.store_id AND drug_id = NEW.drug_id;
    END IF;
END//

DELIMITER ;

-- Create an index on audit log for better trigger performance
CREATE INDEX IF NOT EXISTS idx_audit_store_drug_date ON inventory_audit_log (store_id, drug_id, transaction_date);

-- Grant necessary permissions
-- GRANT INSERT, UPDATE ON store_inventory_snapshot TO 'pharmatrak_user'@'localhost';

-- Test the triggers by running a simple audit log insert
-- This should automatically update the snapshot table
/*
INSERT INTO inventory_audit_log (
    inventory_id, store_id, drug_id, transaction_type, quantity_change,
    quantity_before, quantity_after, reason, performed_by
) VALUES (
    1, 1, 1, 'test_trigger', 10, 0, 10, 'Testing trigger functionality', 1
);

-- Check if snapshot was updated
SELECT * FROM store_inventory_snapshot WHERE store_id = 1 AND drug_id = 1;

-- Clean up test data
DELETE FROM inventory_audit_log WHERE transaction_type = 'test_trigger';
DELETE FROM store_inventory_snapshot WHERE store_id = 1 AND drug_id = 1 AND last_transaction_type = 'test_trigger';
*/

COMMIT;

-- Documentation: Trigger behavior
-- These triggers will automatically maintain the store_inventory_snapshot table
-- whenever inventory_audit_log entries are inserted or updated.
-- This provides a safety net in case application code fails to update the snapshot.
-- 
-- Benefits:
-- 1. Data consistency guaranteed at database level
-- 2. Automatic backup if application logic fails
-- 3. Real-time inventory tracking always accurate
-- 4. Simplified application code (snapshot updates are automatic)
-- 
-- Performance considerations:
-- - Triggers add minimal overhead to audit log operations
-- - Snapshot table remains optimized for fast queries
-- - Indexes support efficient trigger operations