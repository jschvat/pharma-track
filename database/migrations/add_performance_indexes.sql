-- Performance Indexes Migration
-- Adds strategic indexes to improve query performance for frequently used operations

-- =====================================================
-- INVENTORY AUDIT LOG PERFORMANCE INDEXES
-- =====================================================

-- Composite index for store + transaction date (used in store history queries)
-- Improves: /audit/store/:storeId queries with date filtering
CREATE INDEX idx_audit_store_date 
ON inventory_audit_log (store_id, transaction_date DESC);

-- Composite index for store + drug + transaction date (used in NDC reports)
-- Improves: NDC audit reports and drug history queries
CREATE INDEX  idx_audit_store_drug_date 
ON inventory_audit_log (store_id, drug_id, transaction_date DESC);

-- Composite index for inventory + transaction date (used in inventory history)
-- Improves: inventory item transaction history queries
CREATE INDEX  idx_audit_inventory_date 
ON inventory_audit_log (inventory_id, transaction_date DESC);

-- Index for performed_by + transaction_date (used in user activity reports)
-- Improves: queries filtering by who performed transactions
CREATE INDEX  idx_audit_user_date 
ON inventory_audit_log (performed_by, transaction_date DESC);

-- =====================================================
-- STORE INVENTORY PERFORMANCE INDEXES  
-- =====================================================

-- Composite index for low stock queries (store + active + quantity comparison)
-- Improves: getLowStock() method performance
CREATE INDEX  idx_inventory_low_stock 
ON store_inventory (store_id, is_active, quantity_on_hand, reorder_level);

-- Composite index for expiring items (store + active + expiration date)
-- Improves: getExpiring() method performance
CREATE INDEX  idx_inventory_expiring 
ON store_inventory (store_id, is_active, expiration_date);

-- Index for last_updated (used in recently modified queries)
-- Improves: queries for recently updated inventory items
CREATE INDEX  idx_inventory_last_updated 
ON store_inventory (last_updated DESC);

-- =====================================================
-- DRUG SEARCH PERFORMANCE INDEXES
-- =====================================================

-- Composite index for active drugs with names (used in drug searches)
-- Improves: drug search and filtering queries (with length limits for VARCHAR fields)
CREATE INDEX  idx_drugs_active_names 
ON drugs (is_active, generic_name(100), brand_name(100));

-- Index for dosage_form (used in filtering)
-- Improves: queries filtering by dosage form
CREATE INDEX  idx_drugs_dosage_form 
ON drugs (dosage_form);

-- Index for substance_name (used in search queries)
-- Improves: substance-based drug searches
CREATE INDEX  idx_drugs_substance 
ON drugs (substance_name);

-- =====================================================
-- USER MANAGEMENT PERFORMANCE INDEXES
-- =====================================================

-- Composite index for user role and store filtering
-- Improves: user management queries filtering by role and store
CREATE INDEX  idx_users_role_store 
ON users (role, store_id, is_active);

-- Index for created_at (used in user registration reports)
-- Improves: queries for recently created users
CREATE INDEX  idx_users_created_at 
ON users (created_at DESC);

-- =====================================================
-- STORE SETTINGS PERFORMANCE INDEXES
-- =====================================================

-- Composite index for store settings lookups
-- Improves: store-specific setting queries
CREATE INDEX  idx_store_settings_lookup 
ON store_settings (store_id, setting_key, is_active);

-- Index for updated_at (used in recent changes queries)
-- Improves: queries for recently modified settings
CREATE INDEX  idx_store_settings_updated 
ON store_settings (updated_at DESC);

-- =====================================================
-- STORE INVENTORY SNAPSHOT PERFORMANCE INDEXES
-- =====================================================

-- Index for transaction type (used in transaction type filtering)
-- Improves: snapshot queries filtered by transaction type
CREATE INDEX  idx_snapshot_transaction_type 
ON store_inventory_snapshot (last_transaction_type);

-- Composite index for store + quantity analysis
-- Improves: store-wide quantity analysis queries
CREATE INDEX  idx_snapshot_store_quantity 
ON store_inventory_snapshot (store_id, quantity_on_hand DESC);

-- =====================================================
-- COVERING INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Covering index for inventory list queries (includes commonly selected columns)
-- Improves: main inventory listing with drug details (with length limit for lot_number)
CREATE INDEX  idx_inventory_covering 
ON store_inventory (store_id, is_active, quantity_on_hand, drug_id, expiration_date, lot_number(50));

-- =====================================================
-- CLEANUP AND VERIFICATION
-- =====================================================

-- Show index usage statistics (MySQL 5.7+ only)
-- This helps monitor which indexes are being used effectively
-- SELECT 
--   TABLE_SCHEMA,
--   TABLE_NAME,
--   INDEX_NAME,
--   CARDINALITY
-- FROM INFORMATION_SCHEMA.STATISTICS 
-- WHERE TABLE_SCHEMA = 'pharmatrak'
-- ORDER BY TABLE_NAME, INDEX_NAME;