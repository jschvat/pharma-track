-- Enhance inventory snapshot to retain last 5 snapshots with historical data
-- Simple version compatible with MySQL 5.7+

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

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_history_store_drug_rank ON store_inventory_snapshot_history (store_id, drug_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_history_transaction_type ON store_inventory_snapshot_history (transaction_type);
CREATE INDEX IF NOT EXISTS idx_history_performed_by ON store_inventory_snapshot_history (performed_by);

-- Populate history table with existing data from audit log (last 5 transactions per drug)
INSERT IGNORE INTO store_inventory_snapshot_history (
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
    WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
) ial
WHERE ial.rn <= 5;