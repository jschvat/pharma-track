-- Enhance inventory snapshot to retain last 5 snapshots with historical data
-- This extends the current snapshot system to maintain a rolling history  
-- of the last 5 quantity changes for better tracking and auditing

-- Create the enhanced inventory snapshot history table
CREATE TABLE IF NOT EXISTS store_inventory_snapshot_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_change INT NOT NULL DEFAULT 0 COMMENT 'The change amount that led to this snapshot',
    transaction_id INT NULL COMMENT 'Reference to the audit log entry that caused this snapshot',
    transaction_type ENUM('prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory') NULL,
    transaction_description VARCHAR(500) NULL COMMENT 'Description of the transaction/change',
    performed_by INT NULL COMMENT 'User who performed the transaction',
    reference_number VARCHAR(100) NULL COMMENT 'Reference number (prescription, invoice, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES inventory_audit_log(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_store_drug_date (store_id, drug_id, snapshot_date DESC),
    INDEX idx_store_drug (store_id, drug_id),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_transaction_type (transaction_type)
);

-- Create a view to easily get the last 5 snapshots for any drug
CREATE OR REPLACE VIEW v_inventory_snapshot_last5 AS
SELECT 
    ssh.id,
    ssh.store_id,
    s.name as store_name,
    ssh.drug_id,
    d.ndc,
    d.generic_name,
    d.brand_name,
    d.dosage_form,
    d.strength,
    d.manufacturer_name,
    ssh.snapshot_date,
    ssh.quantity_on_hand,
    ssh.quantity_change,
    ssh.transaction_type,
    ssh.transaction_description,
    ssh.reference_number,
    ssh.performed_by,
    u.name as performed_by_name,
    ROW_NUMBER() OVER (
        PARTITION BY ssh.store_id, ssh.drug_id 
        ORDER BY ssh.snapshot_date DESC
    ) as snapshot_rank
FROM store_inventory_snapshot_history ssh
INNER JOIN stores s ON ssh.store_id = s.id
INNER JOIN drugs d ON ssh.drug_id = d.id
LEFT JOIN users u ON ssh.performed_by = u.id
HAVING snapshot_rank <= 5
ORDER BY ssh.store_id, ssh.drug_id, ssh.snapshot_date DESC;

-- Create a view for the current snapshot (most recent) with enhanced info
CREATE OR REPLACE VIEW v_current_inventory_enhanced AS
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
    -- Get the description from the most recent audit log
    ial.reason as last_transaction_description,
    ial.reference_number as last_reference_number,
    ial.quantity_change as last_quantity_change,
    -- Calculate status flags
    CASE 
        WHEN sis.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
        WHEN sis.quantity_on_hand <= COALESCE(
            (SELECT MIN(si.reorder_level) 
             FROM store_inventory si 
             WHERE si.store_id = sis.store_id 
               AND si.drug_id = sis.drug_id 
               AND si.is_active = TRUE), 10) THEN 'LOW_STOCK'
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
LEFT JOIN inventory_audit_log ial ON sis.last_transaction_id = ial.id
ORDER BY s.name, d.generic_name;

DELIMITER //

-- Enhanced stored procedure to update both current snapshot and history
CREATE OR REPLACE PROCEDURE UpdateInventorySnapshotWithHistory(
    IN p_store_id INT,
    IN p_drug_id INT,
    IN p_quantity_after INT,
    IN p_quantity_change INT,
    IN p_transaction_id INT,
    IN p_transaction_type VARCHAR(50),
    IN p_transaction_description VARCHAR(500),
    IN p_reference_number VARCHAR(100),
    IN p_user_id INT
)
BEGIN
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 1. Update the current snapshot table (existing functionality)
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
        p_quantity_after,
        p_transaction_id,
        NOW(),
        p_transaction_type,
        p_user_id
    )
    ON DUPLICATE KEY UPDATE
        quantity_on_hand = p_quantity_after,
        last_transaction_id = p_transaction_id,
        last_transaction_date = NOW(),
        last_transaction_type = p_transaction_type,
        last_updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP;
    
    -- 2. Add entry to history table
    INSERT INTO store_inventory_snapshot_history (
        store_id,
        drug_id,
        snapshot_date,
        quantity_on_hand,
        quantity_change,
        transaction_id,
        transaction_type,
        transaction_description,
        performed_by,
        reference_number
    )
    VALUES (
        p_store_id,
        p_drug_id,
        NOW(),
        p_quantity_after,
        p_quantity_change,
        p_transaction_id,
        p_transaction_type,
        p_transaction_description,
        p_user_id,
        p_reference_number
    );
    
    -- 3. Maintain only last 5 records per store/drug combination
    DELETE FROM store_inventory_snapshot_history 
    WHERE store_id = p_store_id 
      AND drug_id = p_drug_id 
      AND id NOT IN (
          SELECT id FROM (
              SELECT id 
              FROM store_inventory_snapshot_history 
              WHERE store_id = p_store_id AND drug_id = p_drug_id
              ORDER BY snapshot_date DESC 
              LIMIT 5
          ) as keep_records
      );
    
    COMMIT;
END//

-- Enhanced trigger to automatically update history when audit log entries are created
DROP TRIGGER IF EXISTS after_inventory_audit_insert_with_history;

CREATE TRIGGER after_inventory_audit_insert_with_history
AFTER INSERT ON inventory_audit_log
FOR EACH ROW
BEGIN
    -- Call the enhanced procedure to update both current and history
    CALL UpdateInventorySnapshotWithHistory(
        NEW.store_id,
        NEW.drug_id,
        NEW.quantity_after,
        NEW.quantity_change,
        NEW.id,
        NEW.transaction_type,
        NEW.reason,
        NEW.reference_number,
        NEW.performed_by
    );
END//

-- Function to get last N snapshots for a specific drug at a store
CREATE OR REPLACE FUNCTION GetInventorySnapshotHistory(
    p_store_id INT,
    p_drug_id INT,
    p_limit INT
)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'snapshot_date', snapshot_date,
            'quantity_on_hand', quantity_on_hand,
            'quantity_change', quantity_change,
            'transaction_type', transaction_type,
            'transaction_description', transaction_description,
            'reference_number', reference_number,
            'performed_by_name', performed_by_name
        )
    ) INTO result
    FROM v_inventory_snapshot_last5
    WHERE store_id = p_store_id 
      AND drug_id = p_drug_id 
      AND snapshot_rank <= p_limit
    ORDER BY snapshot_date DESC;
    
    RETURN COALESCE(result, JSON_ARRAY());
END//

DELIMITER ;

-- Populate history table with existing data from audit log (last 5 transactions per drug)
INSERT INTO store_inventory_snapshot_history (
    store_id,
    drug_id,
    snapshot_date,
    quantity_on_hand,
    quantity_change,
    transaction_id,
    transaction_type,
    transaction_description,
    performed_by,
    reference_number
)
SELECT 
    ial.store_id,
    ial.drug_id,
    ial.transaction_date,
    ial.quantity_after,
    ial.quantity_change,
    ial.id,
    ial.transaction_type,
    ial.reason,
    ial.performed_by,
    ial.reference_number
FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY store_id, drug_id 
               ORDER BY transaction_date DESC
           ) as rn
    FROM inventory_audit_log
    WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) -- Only last 30 days
) ial
WHERE ial.rn <= 5
ON DUPLICATE KEY UPDATE
    snapshot_date = VALUES(snapshot_date),
    quantity_on_hand = VALUES(quantity_on_hand),
    quantity_change = VALUES(quantity_change);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_history_store_drug_rank ON store_inventory_snapshot_history (store_id, drug_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_history_transaction_type ON store_inventory_snapshot_history (transaction_type);
CREATE INDEX IF NOT EXISTS idx_history_performed_by ON store_inventory_snapshot_history (performed_by);

-- Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON store_inventory_snapshot_history TO 'pharmatrak_user'@'localhost';
-- GRANT SELECT ON v_inventory_snapshot_last5 TO 'pharmatrak_user'@'localhost';
-- GRANT SELECT ON v_current_inventory_enhanced TO 'pharmatrak_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE UpdateInventorySnapshotWithHistory TO 'pharmatrak_user'@'localhost';
-- GRANT EXECUTE ON FUNCTION GetInventorySnapshotHistory TO 'pharmatrak_user'@'localhost';

COMMIT;

-- Example usage:
/*
-- Get last 5 snapshots for a specific drug at a store
SELECT * FROM v_inventory_snapshot_last5 
WHERE store_id = 1 AND drug_id = 1 
ORDER BY snapshot_date DESC;

-- Get current inventory with enhanced transaction info
SELECT * FROM v_current_inventory_enhanced 
WHERE store_id = 1 
ORDER BY generic_name;

-- Get JSON formatted history
SELECT GetInventorySnapshotHistory(1, 1, 5) as history;

-- Manual update (normally done automatically by triggers)
CALL UpdateInventorySnapshotWithHistory(
    1, 1, 95, -5, 123, 'prescription_fill', 
    'Prescription filled for patient John Doe', 'RX-123456', 1
);
*/