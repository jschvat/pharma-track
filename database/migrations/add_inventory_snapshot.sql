-- Add inventory snapshot table for real-time current on-hand tracking
-- This table maintains current inventory levels per store/drug combination
-- and is automatically updated by all inventory transactions

USE pharmatrak;

-- Create the inventory snapshot table
CREATE TABLE IF NOT EXISTS store_inventory_snapshot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    last_transaction_id INT NULL COMMENT 'Reference to the most recent audit log entry',
    last_transaction_date TIMESTAMP NULL COMMENT 'Date of the most recent transaction',
    last_transaction_type ENUM('prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory') NULL,
    last_updated_by INT NULL COMMENT 'User who performed the last transaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
    FOREIGN KEY (last_transaction_id) REFERENCES inventory_audit_log(id) ON DELETE SET NULL,
    FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_store_drug (store_id, drug_id),
    INDEX idx_store (store_id),
    INDEX idx_drug (drug_id),
    INDEX idx_last_transaction (last_transaction_id),
    INDEX idx_last_transaction_date (last_transaction_date),
    INDEX idx_quantity (quantity_on_hand),
    
    -- Unique constraint - one record per store/drug combination
    UNIQUE KEY unique_store_drug_snapshot (store_id, drug_id)
);

-- Create an index for efficient queries on low stock items
CREATE INDEX idx_store_low_stock ON store_inventory_snapshot (store_id, quantity_on_hand);

-- Populate the snapshot table with current data from store_inventory
-- This consolidates quantities by store_id and drug_id (in case there are multiple lots)
INSERT INTO store_inventory_snapshot (store_id, drug_id, quantity_on_hand, last_transaction_date)
SELECT 
    si.store_id,
    si.drug_id,
    SUM(si.quantity_on_hand) as total_quantity,
    MAX(si.last_updated) as last_updated
FROM store_inventory si
WHERE si.is_active = TRUE
GROUP BY si.store_id, si.drug_id
ON DUPLICATE KEY UPDATE
    quantity_on_hand = VALUES(quantity_on_hand),
    last_transaction_date = VALUES(last_transaction_date),
    updated_at = CURRENT_TIMESTAMP;

-- Update snapshot with most recent transaction information where available
UPDATE store_inventory_snapshot sis
INNER JOIN (
    SELECT 
        ial.store_id,
        ial.drug_id,
        ial.id as transaction_id,
        ial.transaction_date,
        ial.transaction_type,
        ial.performed_by,
        ial.quantity_after,
        ROW_NUMBER() OVER (PARTITION BY ial.store_id, ial.drug_id ORDER BY ial.transaction_date DESC) as rn
    FROM inventory_audit_log ial
) latest_transactions ON sis.store_id = latest_transactions.store_id 
    AND sis.drug_id = latest_transactions.drug_id
    AND latest_transactions.rn = 1
SET 
    sis.quantity_on_hand = latest_transactions.quantity_after,
    sis.last_transaction_id = latest_transactions.transaction_id,
    sis.last_transaction_date = latest_transactions.transaction_date,
    sis.last_transaction_type = latest_transactions.transaction_type,
    sis.last_updated_by = latest_transactions.performed_by,
    sis.updated_at = CURRENT_TIMESTAMP;

-- Create a view for easy querying of inventory with drug information
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT 
    sis.id as snapshot_id,
    sis.store_id,
    s.name as store_name,
    sis.drug_id,
    d.ndc,
    d.generic_name,
    d.brand_name,
    d.dosage_form,
    d.strength,
    d.manufacturer_name,
    sis.quantity_on_hand,
    sis.last_transaction_id,
    sis.last_transaction_date,
    sis.last_transaction_type,
    sis.last_updated_by,
    u.name as last_updated_by_name,
    sis.updated_at,
    -- Calculate status flags
    CASE 
        WHEN sis.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
        WHEN sis.quantity_on_hand <= 10 THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END as stock_status,
    -- Get reorder level from store_inventory if available
    (SELECT MIN(si.reorder_level) 
     FROM store_inventory si 
     WHERE si.store_id = sis.store_id 
       AND si.drug_id = sis.drug_id 
       AND si.is_active = TRUE) as reorder_level
FROM store_inventory_snapshot sis
INNER JOIN stores s ON sis.store_id = s.id
INNER JOIN drugs d ON sis.drug_id = d.id
LEFT JOIN users u ON sis.last_updated_by = u.id
ORDER BY s.name, d.generic_name;

-- Create indexes on the view's underlying tables for better performance
CREATE INDEX IF NOT EXISTS idx_store_inventory_active ON store_inventory (store_id, drug_id, is_active);

DELIMITER //

-- Create a stored procedure to safely update inventory snapshot
-- This procedure should be called whenever inventory transactions occur
CREATE PROCEDURE UpdateInventorySnapshot(
    IN p_store_id INT,
    IN p_drug_id INT,
    IN p_quantity_change INT,
    IN p_transaction_id INT,
    IN p_transaction_type VARCHAR(50),
    IN p_user_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert or update the snapshot record
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
        p_store_id,
        p_drug_id,
        p_quantity_change,
        p_transaction_id,
        NOW(),
        p_transaction_type,
        p_user_id
    )
    ON DUPLICATE KEY UPDATE
        quantity_on_hand = quantity_on_hand + p_quantity_change,
        last_transaction_id = p_transaction_id,
        last_transaction_date = NOW(),
        last_transaction_type = p_transaction_type,
        last_updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP;
    
    COMMIT;
END//

DELIMITER ;

-- Grant necessary permissions (adjust as needed for your user setup)
-- GRANT SELECT, INSERT, UPDATE ON store_inventory_snapshot TO 'pharmatrak_user'@'localhost';
-- GRANT SELECT ON v_current_inventory TO 'pharmatrak_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE UpdateInventorySnapshot TO 'pharmatrak_user'@'localhost';