# PharmaTraK Database Schema Documentation

This document provides a comprehensive overview of all database tables in the PharmaTraK pharmacy management system.

## Table of Contents

1. [Core Tables](#core-tables)
   - [stores](#stores)
   - [users](#users)
2. [Drug & Inventory Tables](#drug--inventory-tables)
   - [drugs](#drugs)
   - [store_inventory](#store_inventory)
   - [inventory_audit_log](#inventory_audit_log)
   - [fda_search_history](#fda_search_history)
3. [Configuration Tables](#configuration-tables)
   - [store_settings](#store_settings)
   - [store_settings_history](#store_settings_history)
4. [Data Validation](#data-validation)
5. [Indexes and Performance](#indexes-and-performance)

---

## Core Tables

### stores

Primary table for pharmacy store information with comprehensive validation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique store identifier |
| `name` | VARCHAR(100) | NOT NULL, CHECK validation | Store name (2-100 chars, alphanumeric + basic punctuation) |
| `address` | VARCHAR(500) | NOT NULL, CHECK validation | Street address (5-500 chars) |
| `state` | CHAR(2) | NOT NULL, CHECK validation | US state abbreviation (validates against all US states/territories) |
| `zipcode` | VARCHAR(10) | NOT NULL, CHECK validation | ZIP code (5 digits or 5+4 format) |
| `phone` | VARCHAR(11) | NOT NULL, CHECK validation | Phone number (10-11 digits only) |
| `fax` | VARCHAR(11) | CHECK validation, NULL allowed | Fax number (10-11 digits, optional) |
| `dea_registration_number` | CHAR(9) | UNIQUE, NOT NULL, CHECK validation | DEA number with format validation (AB1234567) |
| `npi` | CHAR(10) | UNIQUE, NOT NULL, CHECK validation | NPI number (10 digits) |
| `admin_user_id` | INT | FOREIGN KEY to users(id) | Store administrator user |
| `date_created` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Validation Rules:**
- Store names must be 2-100 characters with letters, numbers, spaces, and basic punctuation
- Addresses must be 5-500 characters 
- State codes validated against complete US state/territory list
- DEA numbers follow format: 2 letters + 7 digits
- NPI numbers are exactly 10 digits
- Phone/fax numbers are 10-11 digits only

### users

User accounts with role-based access control and store association.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL, CHECK validation | User name (2-100 chars, letters + spaces + basic punctuation) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, CHECK validation | Email address with format validation |
| `phone` | VARCHAR(11) | NOT NULL, CHECK validation | Phone number (10-11 digits only) |
| `password` | VARCHAR(255) | NOT NULL, CHECK validation | bcrypt hash (minimum 60 chars) |
| `address` | VARCHAR(500) | NOT NULL, CHECK validation | Street address (5-500 chars) |
| `store_id` | INT | NOT NULL, FOREIGN KEY to stores(id) | Associated store |
| `role` | ENUM | 'admin', 'user', DEFAULT 'user' | User role |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |
| `date_created` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Validation Rules:**
- User names must be 2-100 characters with letters, spaces, and basic punctuation only
- Email format validation with additional checks (no consecutive dots)
- Password must be at least 60 characters (bcrypt hash requirement)
- Phone numbers are 10-11 digits only

---

## Drug & Inventory Tables

### drugs

FDA drug information with NDC codes and comprehensive drug data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique drug identifier |
| `ndc` | VARCHAR(15) | UNIQUE, NOT NULL | National Drug Code |
| `product_ndc` | VARCHAR(15) | NOT NULL | Product NDC |
| `generic_name` | VARCHAR(500) | NULL | Generic drug name |
| `brand_name` | VARCHAR(500) | NULL | Brand/trade name |
| `dosage_form` | VARCHAR(100) | NULL | Dosage form (tablet, capsule, etc.) |
| `route` | VARCHAR(255) | NULL | Route of administration |
| `strength` | VARCHAR(255) | NULL | Drug strength |
| `manufacturer_name` | VARCHAR(255) | NULL | Manufacturer name |
| `labeler_name` | VARCHAR(255) | NULL | Labeler name |
| `substance_name` | TEXT | NULL | Active substance names |
| `product_type` | VARCHAR(100) | NULL | Product type |
| `marketing_status` | VARCHAR(50) | NULL | Marketing status |
| `listing_expiration_date` | DATE | NULL | FDA listing expiration |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `fda_data` | JSON | NULL | Complete FDA response data |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |
| `date_created` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
- Primary indexes on NDC, product_ndc
- Search indexes on generic_name, brand_name, manufacturer
- Full-text search indexes for drug names and substances

### store_inventory

Links drugs to specific stores with inventory quantities and costs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique inventory record |
| `store_id` | INT | NOT NULL, FOREIGN KEY to stores(id) | Store reference |
| `drug_id` | INT | NOT NULL, FOREIGN KEY to drugs(id) | Drug reference |
| `quantity_on_hand` | INT | DEFAULT 0 | Current quantity |
| `reorder_level` | INT | DEFAULT 0 | Reorder threshold |
| `unit_cost` | DECIMAL(10,4) | NULL | Cost per unit |
| `selling_price` | DECIMAL(10,4) | NULL | Selling price per unit |
| `lot_number` | VARCHAR(50) | NULL | Lot/batch number |
| `expiration_date` | DATE | NULL | Expiration date |
| `supplier` | VARCHAR(255) | NULL | Supplier name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `last_updated` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |
| `date_created` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Constraints:**
- Unique constraint on (store_id, drug_id, lot_number) to prevent duplicates
- Foreign key cascades for data integrity

### inventory_audit_log

Complete audit trail for all inventory transactions and changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique audit record |
| `inventory_id` | INT | NOT NULL, FOREIGN KEY to store_inventory(id) | Inventory record reference |
| `store_id` | INT | NOT NULL, FOREIGN KEY to stores(id) | Store reference |
| `drug_id` | INT | NOT NULL, FOREIGN KEY to drugs(id) | Drug reference |
| `transaction_type` | ENUM | NOT NULL | Transaction type (see below) |
| `quantity_change` | INT | NOT NULL | Quantity change (positive/negative) |
| `quantity_before` | INT | NOT NULL | Quantity before transaction |
| `quantity_after` | INT | NOT NULL | Quantity after transaction |
| `reason` | VARCHAR(500) | NULL | Reason for transaction |
| `reference_number` | VARCHAR(100) | NULL | Reference (prescription #, receipt #, etc.) |
| `performed_by` | INT | NOT NULL, FOREIGN KEY to users(id) | User who performed action |
| `transaction_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Transaction timestamp |

**Transaction Types:**
- `prescription_fill` - Dispensing for prescription
- `return_to_stock` - Return to inventory
- `expire` - Expired medication removal
- `audit` - Audit adjustment
- `shipment_received` - New stock received
- `initial_inventory` - Initial stock entry

### fda_search_history

Analytics and caching for FDA API searches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique search record |
| `user_id` | INT | FOREIGN KEY to users(id), NULL allowed | User who performed search |
| `store_id` | INT | FOREIGN KEY to stores(id), NULL allowed | Store context |
| `search_type` | ENUM | NOT NULL | Type of search performed |
| `search_query` | VARCHAR(1000) | NOT NULL | Search query string |
| `results_count` | INT | DEFAULT 0 | Number of results returned |
| `response_time_ms` | INT | NULL | Response time in milliseconds |
| `was_cached` | BOOLEAN | DEFAULT FALSE | Whether result was cached |
| `search_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Search timestamp |

**Search Types:**
- `ndc` - NDC code search
- `generic_name` - Generic name search
- `brand_name` - Brand name search
- `manufacturer` - Manufacturer search
- `advanced` - Multi-criteria search

---

## Configuration Tables

### store_settings

Store-level configuration settings accessible only to store administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique setting record |
| `store_id` | INT | NOT NULL, FOREIGN KEY to stores(id) | Store reference |
| `setting_key` | VARCHAR(100) | NOT NULL | Setting identifier |
| `setting_value` | JSON | NOT NULL | Setting value (flexible JSON format) |
| `description` | TEXT | NULL | Human-readable description |
| `data_type` | ENUM | NOT NULL, DEFAULT 'string' | Data type indicator |
| `is_system` | BOOLEAN | DEFAULT FALSE | System vs user-configurable |
| `created_by` | INT | NOT NULL, FOREIGN KEY to users(id) | User who created setting |
| `updated_by` | INT | NOT NULL, FOREIGN KEY to users(id) | User who last updated |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Data Types:**
- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `json` - Complex JSON objects
- `array` - JSON arrays

**Default Settings:**
- `default_theme` - UI theme ('bootstrap')
- `default_font_family` - Font family ('system')
- `default_font_size` - Font size ('medium')
- `session_timeout_hours` - Session timeout (8 hours)
- `auto_backup_enabled` - Auto backup flag (true)
- `low_stock_threshold` - Low stock alert threshold (10)
- `expiration_alert_days` - Days before expiration for alerts (30)
- `require_prescription_verification` - Prescription verification requirement (true)

**Constraints:**
- Unique constraint on (store_id, setting_key)
- Foreign key restrictions prevent deletion of referenced users

### store_settings_history

Audit trail for store settings changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique history record |
| `store_setting_id` | INT | NOT NULL, FOREIGN KEY to store_settings(id) | Setting reference |
| `store_id` | INT | NOT NULL, FOREIGN KEY to stores(id) | Store reference |
| `setting_key` | VARCHAR(100) | NOT NULL | Setting identifier |
| `old_value` | JSON | NULL | Previous value |
| `new_value` | JSON | NOT NULL | New value |
| `changed_by` | INT | NOT NULL, FOREIGN KEY to users(id) | User who made change |
| `change_reason` | TEXT | NULL | Optional reason for change |
| `changed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Change timestamp |

---

## Data Validation

### Field Format Validation

**Phone Numbers:**
- Format: 10-11 digits only (no formatting characters)
- Regex: `^[0-9]{10,11}$`

**Email Addresses:**
- Standard email format validation
- No consecutive dots allowed
- Maximum 255 characters
- Regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`

**DEA Registration Numbers:**
- Format: 2 letters followed by 7 digits
- Regex: `^[A-Z]{2}[0-9]{7}$`
- Must be unique across all stores

**NPI Numbers:**
- Format: Exactly 10 digits
- Regex: `^[0-9]{10}$`
- Must be unique across all stores

**ZIP Codes:**
- Format: 5 digits or 5+4 format
- Regex: `^[0-9]{5}(-[0-9]{4})?$`

**State Codes:**
- Validated against complete list of US states and territories
- Includes: 50 states + DC, PR, VI, GU, AS, MP

### Text Content Validation

**Names (Store/User):**
- 2-100 characters
- Letters, numbers, spaces, basic punctuation only
- Trimmed of extra whitespace

**Addresses:**
- 5-500 characters
- Alphanumeric + spaces + standard address characters
- Support for apartment numbers, building names

---

## Indexes and Performance

### Primary Indexes

**stores table:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY (dea_registration_number)`
- `UNIQUE KEY (npi)`
- `INDEX idx_stores_dea (dea_registration_number)`
- `INDEX idx_stores_npi (npi)`

**users table:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY (email)`
- `INDEX idx_users_email (email)`
- `INDEX idx_users_store_id (store_id)`

**drugs table:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY (ndc)`
- `INDEX idx_ndc (ndc)`
- `INDEX idx_product_ndc (product_ndc)`
- `INDEX idx_generic_name (generic_name(100))`
- `INDEX idx_brand_name (brand_name(100))`
- `INDEX idx_manufacturer (manufacturer_name(100))`
- `INDEX idx_active (is_active)`

### Full-Text Search Indexes

**drugs table:**
- `FULLTEXT idx_generic_fulltext (generic_name)`
- `FULLTEXT idx_brand_fulltext (brand_name)`
- `FULLTEXT idx_substance_fulltext (substance_name)`

### Composite Indexes

**store_inventory table:**
- `UNIQUE KEY unique_store_drug_lot (store_id, drug_id, lot_number)`
- `INDEX idx_store_drug (store_id, drug_id)`
- `INDEX idx_store_active (store_id, is_active)`
- `INDEX idx_expiration (expiration_date)`
- `INDEX idx_reorder (reorder_level, quantity_on_hand)`

**inventory_audit_log table:**
- `INDEX idx_store_drug (store_id, drug_id)`
- `INDEX idx_transaction_date (transaction_date)`
- `INDEX idx_transaction_type (transaction_type)`
- `INDEX idx_performed_by (performed_by)`
- `INDEX idx_reference_number (reference_number)`

### Foreign Key Relationships

**Cascade Rules:**
- Store deletion → Cascades to users, inventory, settings
- User deletion → Restricted for referenced records, SET NULL for store admin
- Drug deletion → Cascades to inventory and audit logs
- Inventory deletion → Cascades to audit logs

**Performance Considerations:**
- Indexes optimized for common query patterns
- Full-text search for drug lookups
- Composite indexes for multi-column WHERE clauses
- JSON storage for flexible configuration data
- Audit trails maintain referential integrity

---

## Database Setup

### Initial Setup
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS pharmatrak;
USE pharmatrak;

-- Run schema files in order:
-- 1. schema.sql (core tables)
-- 2. drug_schema.sql (drug/inventory tables)
-- 3. store_settings_schema.sql (configuration tables)
-- 4. seed_admin.sql (default admin account)
```

### Migration
```sql
-- For existing databases, use migration.sql
-- IMPORTANT: Always backup before migration!
source migration.sql;
```

This schema provides a robust foundation for pharmacy management with comprehensive validation, audit trails, and performance optimization.