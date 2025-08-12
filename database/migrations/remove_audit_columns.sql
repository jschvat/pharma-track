-- Migration: Remove unit_cost, total_value_change, lot_number, and expiration_date from inventory_audit_log
-- Date: 2025-01-10
-- Description: Remove fields that are not needed for audit logging

USE pharmatrak;

-- Remove columns from inventory_audit_log table
ALTER TABLE inventory_audit_log 
DROP COLUMN IF EXISTS unit_cost,
DROP COLUMN IF EXISTS total_value_change,
DROP COLUMN IF EXISTS lot_number,
DROP COLUMN IF EXISTS expiration_date;

-- Remove the lot_number index that's no longer needed
DROP INDEX IF EXISTS idx_lot_number ON inventory_audit_log;

-- Confirm the changes
DESCRIBE inventory_audit_log;