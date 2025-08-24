# PharmaTraK Database Schema Documentation

Generated on: 2025-08-23T20:44:14.380Z

## Overview

This document provides comprehensive documentation for the PharmaTraK database schema,
including table structures, field definitions, relationships, and constraints.

## Table Summary

Total Tables: 19

- **drugs**
- **fda_search_history**
- **god_mode_audit**
- **inventory_audit_log**
- **post_it_notes**
- **store_access**
- **store_inventory**
- **store_inventory_snapshot**
- **store_inventory_snapshot_history**
- **store_settings**
- **store_settings_history**
- **stores**
- **user_permissions**
- **user_sessions**
- **user_store_access**
- **users**
- **v_current_inventory**
- **v_god_mode_sessions**
- **v_god_mode_users**

---

## Table: `drugs`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `ndc` | varchar(15) | NO | UNI | null |  |
| `product_ndc` | varchar(15) | NO | MUL | null |  |
| `generic_name` | varchar(500) | YES | MUL | null |  |
| `brand_name` | varchar(500) | YES | MUL | null |  |
| `dosage_form` | varchar(100) | YES | MUL | null |  |
| `route` | varchar(255) | YES |  | null |  |
| `strength` | varchar(255) | YES |  | null |  |
| `manufacturer_name` | varchar(255) | YES | MUL | null |  |
| `labeler_name` | varchar(255) | YES |  | null |  |
| `substance_name` | text | YES | MUL | null |  |
| `product_type` | varchar(100) | YES |  | null |  |
| `marketing_status` | varchar(50) | YES |  | null |  |
| `listing_expiration_date` | date | YES |  | null |  |
| `is_active` | tinyint(1) | YES | MUL | 1 |  |
| `fda_data` | json | YES |  | null |  |
| `last_updated` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `date_created` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `ndc` | `ndc` | BTREE | Yes |
| `idx_ndc` | `ndc` | BTREE | No |
| `idx_product_ndc` | `product_ndc` | BTREE | No |
| `idx_generic_name` | `generic_name` | BTREE | No |
| `idx_brand_name` | `brand_name` | BTREE | No |
| `idx_manufacturer` | `manufacturer_name` | BTREE | No |
| `idx_active` | `is_active` | BTREE | No |
| `idx_drugs_dosage_form` | `dosage_form` | BTREE | No |
| `idx_drugs_substance` | `substance_name` | BTREE | No |
| `idx_drugs_active_names` | `is_active` | BTREE | No |
| `idx_drugs_active_names` | `generic_name` | BTREE | No |
| `idx_drugs_active_names` | `brand_name` | BTREE | No |
| `idx_generic_fulltext` | `generic_name` | FULLTEXT | No |
| `idx_brand_fulltext` | `brand_name` | FULLTEXT | No |
| `idx_substance_fulltext` | `substance_name` | FULLTEXT | No |

---

## Table: `fda_search_history`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | YES | MUL | null |  |
| `store_id` | int | YES | MUL | null |  |
| `search_type` | enum('ndc','generic_name','brand_name','manufacturer','advanced') | NO | MUL | null |  |
| `search_query` | varchar(1000) | NO |  | null |  |
| `results_count` | int | YES |  | 0 |  |
| `response_time_ms` | int | YES |  | null |  |
| `was_cached` | tinyint(1) | YES |  | 0 |  |
| `search_date` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | fda_search_history_ibfk_1 |
| `store_id` | `stores.id` | fda_search_history_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `idx_user_searches` | `user_id` | BTREE | No |
| `idx_user_searches` | `search_date` | BTREE | No |
| `idx_store_searches` | `store_id` | BTREE | No |
| `idx_store_searches` | `search_date` | BTREE | No |
| `idx_search_type` | `search_type` | BTREE | No |
| `idx_search_date` | `search_date` | BTREE | No |

---

## Table: `god_mode_audit`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | NO | MUL | null |  |
| `action_type` | enum('store_switch','user_edit','user_create','user_delete','drug_edit','drug_create','drug_delete','transaction_edit','transaction_create','transaction_delete','permission_grant','permission_revoke','role_change','system_setting_change') | NO | MUL | null |  |
| `target_type` | enum('store','user','drug','transaction','system') | NO | MUL | null |  |
| `target_id` | int | YES |  | null |  |
| `target_store_id` | int | YES | MUL | null |  |
| `old_value` | json | YES |  | null |  |
| `new_value` | json | YES |  | null |  |
| `action_details` | json | YES |  | null |  |
| `ip_address` | varchar(45) | YES |  | null |  |
| `user_agent` | text | YES |  | null |  |
| `action_timestamp` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | god_mode_audit_ibfk_1 |
| `target_store_id` | `stores.id` | god_mode_audit_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `idx_god_audit_user` | `user_id` | BTREE | No |
| `idx_god_audit_action` | `action_type` | BTREE | No |
| `idx_god_audit_target` | `target_type` | BTREE | No |
| `idx_god_audit_target` | `target_id` | BTREE | No |
| `idx_god_audit_store` | `target_store_id` | BTREE | No |
| `idx_god_audit_timestamp` | `action_timestamp` | BTREE | No |
| `idx_god_audit_composite` | `user_id` | BTREE | No |
| `idx_god_audit_composite` | `action_timestamp` | BTREE | No |
| `idx_god_audit_composite` | `action_type` | BTREE | No |

---

## Table: `inventory_audit_log`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `inventory_id` | int | NO | MUL | null |  |
| `store_id` | int | NO | MUL | null |  |
| `drug_id` | int | NO | MUL | null |  |
| `transaction_type` | enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') | NO | MUL | null |  |
| `quantity_change` | int | NO |  | null |  |
| `quantity_before` | int | NO |  | null |  |
| `quantity_after` | int | NO |  | null |  |
| `reason` | varchar(500) | YES |  | null |  |
| `reference_number` | varchar(100) | YES | MUL | null |  |
| `performed_by` | int | NO | MUL | null |  |
| `transaction_date` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `inventory_id` | `store_inventory.id` | inventory_audit_log_ibfk_1 |
| `store_id` | `stores.id` | inventory_audit_log_ibfk_2 |
| `drug_id` | `drugs.id` | inventory_audit_log_ibfk_3 |
| `performed_by` | `users.id` | inventory_audit_log_ibfk_4 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `drug_id` | `drug_id` | BTREE | No |
| `idx_inventory_id` | `inventory_id` | BTREE | No |
| `idx_store_drug` | `store_id` | BTREE | No |
| `idx_store_drug` | `drug_id` | BTREE | No |
| `idx_transaction_date` | `transaction_date` | BTREE | No |
| `idx_transaction_type` | `transaction_type` | BTREE | No |
| `idx_performed_by` | `performed_by` | BTREE | No |
| `idx_reference_number` | `reference_number` | BTREE | No |
| `idx_audit_store_date` | `store_id` | BTREE | No |
| `idx_audit_store_date` | `transaction_date` | BTREE | No |
| `idx_audit_store_drug_date` | `store_id` | BTREE | No |
| `idx_audit_store_drug_date` | `drug_id` | BTREE | No |
| `idx_audit_store_drug_date` | `transaction_date` | BTREE | No |
| `idx_audit_inventory_date` | `inventory_id` | BTREE | No |
| `idx_audit_inventory_date` | `transaction_date` | BTREE | No |
| `idx_audit_user_date` | `performed_by` | BTREE | No |
| `idx_audit_user_date` | `transaction_date` | BTREE | No |

---

## Table: `post_it_notes`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_id` | int | NO | MUL | null |  |
| `user_id` | int | NO | MUL | null |  |
| `content` | text | NO |  | null |  |
| `position_x` | int | NO |  | 300 |  |
| `position_y` | int | NO |  | 100 |  |
| `color` | varchar(20) | NO |  | yellow |  |
| `is_pinned` | tinyint(1) | NO |  | 0 |  |
| `is_active` | tinyint(1) | NO |  | 1 |  |
| `created_at` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | post_it_notes_ibfk_1 |
| `user_id` | `users.id` | post_it_notes_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `idx_store_active` | `store_id` | BTREE | No |
| `idx_store_active` | `is_active` | BTREE | No |
| `idx_store_pinned` | `store_id` | BTREE | No |
| `idx_store_pinned` | `is_pinned` | BTREE | No |
| `idx_store_pinned` | `is_active` | BTREE | No |
| `idx_user_store` | `user_id` | BTREE | No |
| `idx_user_store` | `store_id` | BTREE | No |
| `idx_created_at` | `created_at` | BTREE | No |
| `idx_updated_at` | `updated_at` | BTREE | No |

---

## Table: `store_access`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | NO | MUL | null |  |
| `store_id` | int | NO | MUL | null |  |
| `access_level` | enum('read','write','admin','god_mode') | YES |  | read |  |
| `granted_by` | int | YES | MUL | null |  |
| `granted_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `expires_at` | timestamp | YES |  | null |  |
| `is_active` | tinyint(1) | YES | MUL | 1 |  |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | store_access_ibfk_1 |
| `store_id` | `stores.id` | store_access_ibfk_2 |
| `granted_by` | `users.id` | store_access_ibfk_3 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_user_store_access` | `user_id` | BTREE | Yes |
| `unique_user_store_access` | `store_id` | BTREE | Yes |
| `granted_by` | `granted_by` | BTREE | No |
| `idx_store_access_user` | `user_id` | BTREE | No |
| `idx_store_access_store` | `store_id` | BTREE | No |
| `idx_store_access_active` | `is_active` | BTREE | No |
| `idx_store_access_active` | `access_level` | BTREE | No |

---

## Table: `store_inventory`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_id` | int | NO | MUL | null |  |
| `drug_id` | int | NO | MUL | null |  |
| `quantity_on_hand` | int | YES |  | 0 |  |
| `reorder_level` | int | YES | MUL | 0 |  |
| `unit_cost` | decimal(10,4) | YES |  | null |  |
| `selling_price` | decimal(10,4) | YES |  | null |  |
| `lot_number` | varchar(50) | YES |  | null |  |
| `expiration_date` | date | YES | MUL | null |  |
| `supplier` | varchar(255) | YES |  | null |  |
| `is_active` | tinyint(1) | YES |  | 1 |  |
| `last_updated` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `date_created` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | store_inventory_ibfk_1 |
| `drug_id` | `drugs.id` | store_inventory_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_store_drug_lot` | `store_id` | BTREE | Yes |
| `unique_store_drug_lot` | `drug_id` | BTREE | Yes |
| `unique_store_drug_lot` | `lot_number` | BTREE | Yes |
| `drug_id` | `drug_id` | BTREE | No |
| `idx_store_drug` | `store_id` | BTREE | No |
| `idx_store_drug` | `drug_id` | BTREE | No |
| `idx_store_active` | `store_id` | BTREE | No |
| `idx_store_active` | `is_active` | BTREE | No |
| `idx_expiration` | `expiration_date` | BTREE | No |
| `idx_reorder` | `reorder_level` | BTREE | No |
| `idx_reorder` | `quantity_on_hand` | BTREE | No |
| `idx_inventory_low_stock` | `store_id` | BTREE | No |
| `idx_inventory_low_stock` | `is_active` | BTREE | No |
| `idx_inventory_low_stock` | `quantity_on_hand` | BTREE | No |
| `idx_inventory_low_stock` | `reorder_level` | BTREE | No |
| `idx_inventory_expiring` | `store_id` | BTREE | No |
| `idx_inventory_expiring` | `is_active` | BTREE | No |
| `idx_inventory_expiring` | `expiration_date` | BTREE | No |
| `idx_inventory_last_updated` | `last_updated` | BTREE | No |
| `idx_inventory_covering` | `store_id` | BTREE | No |
| `idx_inventory_covering` | `is_active` | BTREE | No |
| `idx_inventory_covering` | `quantity_on_hand` | BTREE | No |
| `idx_inventory_covering` | `drug_id` | BTREE | No |
| `idx_inventory_covering` | `expiration_date` | BTREE | No |
| `idx_inventory_covering` | `lot_number` | BTREE | No |

---

## Table: `store_inventory_snapshot`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_id` | int | NO | MUL | null |  |
| `drug_id` | int | NO | MUL | null |  |
| `quantity_on_hand` | int | NO | MUL | 0 |  |
| `last_transaction_id` | int | YES | MUL | null |  |
| `last_transaction_date` | timestamp | YES | MUL | null |  |
| `last_transaction_type` | enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') | YES | MUL | null |  |
| `last_updated_by` | int | YES | MUL | null |  |
| `created_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | store_inventory_snapshot_ibfk_1 |
| `drug_id` | `drugs.id` | store_inventory_snapshot_ibfk_2 |
| `last_transaction_id` | `inventory_audit_log.id` | store_inventory_snapshot_ibfk_3 |
| `last_updated_by` | `users.id` | store_inventory_snapshot_ibfk_4 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_store_drug_snapshot` | `store_id` | BTREE | Yes |
| `unique_store_drug_snapshot` | `drug_id` | BTREE | Yes |
| `last_updated_by` | `last_updated_by` | BTREE | No |
| `idx_store_drug` | `store_id` | BTREE | No |
| `idx_store_drug` | `drug_id` | BTREE | No |
| `idx_store` | `store_id` | BTREE | No |
| `idx_drug` | `drug_id` | BTREE | No |
| `idx_last_transaction` | `last_transaction_id` | BTREE | No |
| `idx_last_transaction_date` | `last_transaction_date` | BTREE | No |
| `idx_quantity` | `quantity_on_hand` | BTREE | No |
| `idx_store_low_stock` | `store_id` | BTREE | No |
| `idx_store_low_stock` | `quantity_on_hand` | BTREE | No |
| `idx_snapshot_transaction_type` | `last_transaction_type` | BTREE | No |
| `idx_snapshot_store_quantity` | `store_id` | BTREE | No |
| `idx_snapshot_store_quantity` | `quantity_on_hand` | BTREE | No |

---

## Table: `store_inventory_snapshot_history`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_id` | int | NO | MUL | null |  |
| `drug_id` | int | NO | MUL | null |  |
| `snapshot_date` | timestamp | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `quantity_on_hand` | int | NO |  | 0 |  |
| `quantity_change` | int | NO |  | 0 |  |
| `transaction_id` | int | YES | MUL | null |  |
| `transaction_type` | enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') | YES | MUL | null |  |
| `transaction_description` | varchar(500) | YES |  | null |  |
| `performed_by` | int | YES | MUL | null |  |
| `reference_number` | varchar(100) | YES |  | null |  |
| `created_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | store_inventory_snapshot_history_ibfk_1 |
| `drug_id` | `drugs.id` | store_inventory_snapshot_history_ibfk_2 |
| `transaction_id` | `inventory_audit_log.id` | store_inventory_snapshot_history_ibfk_3 |
| `performed_by` | `users.id` | store_inventory_snapshot_history_ibfk_4 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `drug_id` | `drug_id` | BTREE | No |
| `performed_by` | `performed_by` | BTREE | No |
| `idx_store_drug_date` | `store_id` | BTREE | No |
| `idx_store_drug_date` | `drug_id` | BTREE | No |
| `idx_store_drug_date` | `snapshot_date` | BTREE | No |
| `idx_store_drug` | `store_id` | BTREE | No |
| `idx_store_drug` | `drug_id` | BTREE | No |
| `idx_snapshot_date` | `snapshot_date` | BTREE | No |
| `idx_transaction_id` | `transaction_id` | BTREE | No |
| `idx_transaction_type` | `transaction_type` | BTREE | No |

---

## Table: `store_settings`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_id` | int | NO | MUL | null |  |
| `setting_key` | varchar(100) | NO | MUL | null |  |
| `setting_value` | json | NO |  | null |  |
| `description` | text | YES |  | null |  |
| `data_type` | enum('string','number','boolean','json','array') | NO |  | string |  |
| `is_system` | tinyint(1) | YES | MUL | 0 |  |
| `created_by` | int | NO | MUL | null |  |
| `updated_by` | int | NO | MUL | null |  |
| `created_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | store_settings_ibfk_1 |
| `created_by` | `users.id` | store_settings_ibfk_2 |
| `updated_by` | `users.id` | store_settings_ibfk_3 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_store_setting` | `store_id` | BTREE | Yes |
| `unique_store_setting` | `setting_key` | BTREE | Yes |
| `created_by` | `created_by` | BTREE | No |
| `updated_by` | `updated_by` | BTREE | No |
| `idx_store_id` | `store_id` | BTREE | No |
| `idx_setting_key` | `setting_key` | BTREE | No |
| `idx_is_system` | `is_system` | BTREE | No |
| `idx_updated_at` | `updated_at` | BTREE | No |
| `idx_store_settings_updated` | `updated_at` | BTREE | No |

---

## Table: `store_settings_history`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `store_setting_id` | int | NO | MUL | null |  |
| `store_id` | int | NO | MUL | null |  |
| `setting_key` | varchar(100) | NO | MUL | null |  |
| `old_value` | json | YES |  | null |  |
| `new_value` | json | NO |  | null |  |
| `changed_by` | int | NO | MUL | null |  |
| `change_reason` | text | YES |  | null |  |
| `changed_at` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_setting_id` | `store_settings.id` | store_settings_history_ibfk_1 |
| `store_id` | `stores.id` | store_settings_history_ibfk_2 |
| `changed_by` | `users.id` | store_settings_history_ibfk_3 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `idx_store_setting_id` | `store_setting_id` | BTREE | No |
| `idx_store_id` | `store_id` | BTREE | No |
| `idx_setting_key` | `setting_key` | BTREE | No |
| `idx_changed_by` | `changed_by` | BTREE | No |
| `idx_changed_at` | `changed_at` | BTREE | No |

---

## Table: `stores`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `name` | varchar(100) | NO |  | null |  |
| `address` | varchar(500) | NO |  | null |  |
| `state` | char(2) | NO |  | null |  |
| `zipcode` | varchar(10) | NO |  | null |  |
| `phone` | varchar(11) | NO |  | null |  |
| `fax` | varchar(11) | YES |  | null |  |
| `dea_registration_number` | char(9) | NO | UNI | null |  |
| `npi` | char(10) | NO | UNI | null |  |
| `admin_user_id` | int | YES | MUL | null |  |
| `date_created` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `admin_user_id` | `users.id` | stores_ibfk_1 |
| `admin_user_id` | `users.id` | stores_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `dea_registration_number` | `dea_registration_number` | BTREE | Yes |
| `npi` | `npi` | BTREE | Yes |
| `idx_stores_dea` | `dea_registration_number` | BTREE | No |
| `idx_stores_npi` | `npi` | BTREE | No |
| `admin_user_id` | `admin_user_id` | BTREE | No |

---

## Table: `user_permissions`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | NO | MUL | null |  |
| `permission_name` | varchar(50) | NO | MUL | null |  |
| `permission_value` | tinyint(1) | YES |  | 1 |  |
| `granted_by` | int | YES | MUL | null |  |
| `granted_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `expires_at` | timestamp | YES |  | null |  |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | user_permissions_ibfk_1 |
| `granted_by` | `users.id` | user_permissions_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_user_permission` | `user_id` | BTREE | Yes |
| `unique_user_permission` | `permission_name` | BTREE | Yes |
| `granted_by` | `granted_by` | BTREE | No |
| `idx_user_permissions_user` | `user_id` | BTREE | No |
| `idx_user_permissions_name` | `permission_name` | BTREE | No |

---

## Table: `user_sessions`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | NO | MUL | null |  |
| `session_token` | varchar(255) | NO | UNI | null |  |
| `current_store_id` | int | YES | MUL | null |  |
| `original_store_id` | int | NO | MUL | null |  |
| `ip_address` | varchar(45) | YES |  | null |  |
| `user_agent` | text | YES |  | null |  |
| `is_god_mode_session` | tinyint(1) | YES |  | 0 |  |
| `last_activity` | timestamp | YES | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `expires_at` | timestamp | NO | MUL | null |  |
| `created_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | user_sessions_ibfk_1 |
| `current_store_id` | `stores.id` | user_sessions_ibfk_2 |
| `original_store_id` | `stores.id` | user_sessions_ibfk_3 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_session_token` | `session_token` | BTREE | Yes |
| `current_store_id` | `current_store_id` | BTREE | No |
| `original_store_id` | `original_store_id` | BTREE | No |
| `idx_sessions_user` | `user_id` | BTREE | No |
| `idx_sessions_token` | `session_token` | BTREE | No |
| `idx_sessions_expires` | `expires_at` | BTREE | No |
| `idx_sessions_activity` | `last_activity` | BTREE | No |
| `idx_sessions_activity` | `expires_at` | BTREE | No |

---

## Table: `user_store_access`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `user_id` | int | NO | MUL | null |  |
| `store_id` | int | NO | MUL | null |  |
| `access_level` | enum('admin','user') | NO |  | user |  |
| `granted_by` | int | YES | MUL | null |  |
| `granted_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `is_active` | tinyint(1) | YES |  | 1 |  |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `users.id` | user_store_access_ibfk_1 |
| `store_id` | `stores.id` | user_store_access_ibfk_2 |
| `granted_by` | `users.id` | user_store_access_ibfk_3 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `unique_user_store` | `user_id` | BTREE | Yes |
| `unique_user_store` | `store_id` | BTREE | Yes |
| `granted_by` | `granted_by` | BTREE | No |
| `idx_user_store_access_user` | `user_id` | BTREE | No |
| `idx_user_store_access_user` | `is_active` | BTREE | No |
| `idx_user_store_access_store` | `store_id` | BTREE | No |
| `idx_user_store_access_store` | `is_active` | BTREE | No |

---

## Table: `users`

**Engine**: InnoDB
**Collation**: utf8mb4_unicode_ci

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO | PRI | null | auto_increment |
| `name` | varchar(100) | NO |  | null |  |
| `email` | varchar(255) | NO | UNI | null |  |
| `phone` | varchar(11) | NO |  | null |  |
| `password` | varchar(255) | NO |  | null |  |
| `address` | varchar(500) | NO |  | null |  |
| `store_id` | int | NO | MUL | null |  |
| `role` | enum('admin','user','god_mode') | YES | MUL | user |  |
| `is_active` | tinyint(1) | YES |  | 1 |  |
| `date_created` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `updated_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `active_store_id` | int | YES | MUL | null |  |

### Foreign Key Relationships

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `store_id` | `stores.id` | users_ibfk_1 |
| `active_store_id` | `stores.id` | users_ibfk_2 |

### Indexes

| Index Name | Column | Type | Unique |
|------------|--------|------|--------|
| `PRIMARY` | `id` | BTREE | Yes |
| `email` | `email` | BTREE | Yes |
| `idx_users_email` | `email` | BTREE | No |
| `idx_users_store_id` | `store_id` | BTREE | No |
| `idx_users_active_store` | `active_store_id` | BTREE | No |
| `idx_users_role_store` | `role` | BTREE | No |
| `idx_users_role_store` | `store_id` | BTREE | No |
| `idx_users_role_store` | `is_active` | BTREE | No |

---

## Table: `v_current_inventory`

**Description**: VIEW

**Engine**: Unknown
**Collation**: Unknown

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `snapshot_id` | int | YES |  | 0 |  |
| `store_id` | int | YES |  | null |  |
| `store_name` | varchar(100) | NO |  | null |  |
| `drug_id` | int | YES |  | null |  |
| `ndc` | varchar(15) | NO |  | null |  |
| `generic_name` | varchar(500) | YES |  | null |  |
| `brand_name` | varchar(500) | YES |  | null |  |
| `dosage_form` | varchar(100) | YES |  | null |  |
| `strength` | varchar(255) | YES |  | null |  |
| `manufacturer_name` | varchar(255) | YES |  | null |  |
| `quantity_on_hand` | int | YES |  | 0 |  |
| `last_transaction_id` | int | YES |  | null |  |
| `last_transaction_date` | timestamp | YES |  | null |  |
| `last_transaction_type` | enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') | YES |  | null |  |
| `last_updated_by` | int | YES |  | null |  |
| `last_updated_by_name` | varchar(100) | YES |  | null |  |
| `updated_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `stock_status` | varchar(12) | NO |  | null |  |
| `reorder_level` | bigint | YES |  | null |  |

---

## Table: `v_god_mode_sessions`

**Description**: VIEW

**Engine**: Unknown
**Collation**: Unknown

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `session_id` | int | NO |  | 0 |  |
| `user_id` | int | NO |  | 0 |  |
| `user_name` | varchar(100) | NO |  | null |  |
| `user_email` | varchar(255) | NO |  | null |  |
| `current_store_id` | int | YES |  | null |  |
| `current_store_name` | varchar(100) | YES |  | null |  |
| `original_store_id` | int | NO |  | null |  |
| `original_store_name` | varchar(100) | YES |  | null |  |
| `ip_address` | varchar(45) | YES |  | null |  |
| `last_activity` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `expires_at` | timestamp | NO |  | null |  |
| `created_at` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| `session_status` | varchar(7) | NO |  | null |  |

---

## Table: `v_god_mode_users`

**Description**: VIEW

**Engine**: Unknown
**Collation**: Unknown

### Fields

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| `id` | int | NO |  | 0 |  |
| `name` | varchar(100) | NO |  | null |  |
| `email` | varchar(255) | NO |  | null |  |
| `role` | enum('admin','user','god_mode') | YES |  | user |  |
| `original_store_id` | int | NO |  | null |  |
| `original_store_name` | varchar(100) | YES |  | null |  |
| `accessible_stores_count` | bigint | NO |  | 0 |  |
| `permissions_count` | bigint | NO |  | 0 |  |
| `is_active` | tinyint(1) | YES |  | 1 |  |
| `date_created` | timestamp | YES |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

---


## Detailed Constraint Analysis

### Table Constraints Summary

| Table | Constraint Name | Type | Enforced |
|-------|-----------------|------|----------|
| `drugs` | PRIMARY | PRIMARY KEY | YES |
| `drugs` | ndc | UNIQUE | YES |
| `fda_search_history` | fda_search_history_ibfk_1 | FOREIGN KEY | YES |
| `fda_search_history` | fda_search_history_ibfk_2 | FOREIGN KEY | YES |
| `fda_search_history` | PRIMARY | PRIMARY KEY | YES |
| `god_mode_audit` | god_mode_audit_ibfk_1 | FOREIGN KEY | YES |
| `god_mode_audit` | god_mode_audit_ibfk_2 | FOREIGN KEY | YES |
| `god_mode_audit` | PRIMARY | PRIMARY KEY | YES |
| `inventory_audit_log` | inventory_audit_log_ibfk_1 | FOREIGN KEY | YES |
| `inventory_audit_log` | inventory_audit_log_ibfk_4 | FOREIGN KEY | YES |
| `inventory_audit_log` | inventory_audit_log_ibfk_3 | FOREIGN KEY | YES |
| `inventory_audit_log` | inventory_audit_log_ibfk_2 | FOREIGN KEY | YES |
| `inventory_audit_log` | PRIMARY | PRIMARY KEY | YES |
| `post_it_notes` | post_it_notes_ibfk_1 | FOREIGN KEY | YES |
| `post_it_notes` | post_it_notes_ibfk_2 | FOREIGN KEY | YES |
| `post_it_notes` | PRIMARY | PRIMARY KEY | YES |
| `store_access` | store_access_ibfk_2 | FOREIGN KEY | YES |
| `store_access` | store_access_ibfk_3 | FOREIGN KEY | YES |
| `store_access` | store_access_ibfk_1 | FOREIGN KEY | YES |
| `store_access` | PRIMARY | PRIMARY KEY | YES |
| `store_access` | unique_user_store_access | UNIQUE | YES |
| `store_inventory` | store_inventory_ibfk_1 | FOREIGN KEY | YES |
| `store_inventory` | store_inventory_ibfk_2 | FOREIGN KEY | YES |
| `store_inventory` | PRIMARY | PRIMARY KEY | YES |
| `store_inventory` | unique_store_drug_lot | UNIQUE | YES |
| `store_inventory_snapshot` | store_inventory_snapshot_ibfk_2 | FOREIGN KEY | YES |
| `store_inventory_snapshot` | store_inventory_snapshot_ibfk_4 | FOREIGN KEY | YES |
| `store_inventory_snapshot` | store_inventory_snapshot_ibfk_3 | FOREIGN KEY | YES |
| `store_inventory_snapshot` | store_inventory_snapshot_ibfk_1 | FOREIGN KEY | YES |
| `store_inventory_snapshot` | PRIMARY | PRIMARY KEY | YES |
| `store_inventory_snapshot` | unique_store_drug_snapshot | UNIQUE | YES |
| `store_inventory_snapshot_history` | store_inventory_snapshot_history_ibfk_1 | FOREIGN KEY | YES |
| `store_inventory_snapshot_history` | store_inventory_snapshot_history_ibfk_2 | FOREIGN KEY | YES |
| `store_inventory_snapshot_history` | store_inventory_snapshot_history_ibfk_3 | FOREIGN KEY | YES |
| `store_inventory_snapshot_history` | store_inventory_snapshot_history_ibfk_4 | FOREIGN KEY | YES |
| `store_inventory_snapshot_history` | PRIMARY | PRIMARY KEY | YES |
| `store_settings` | store_settings_ibfk_2 | FOREIGN KEY | YES |
| `store_settings` | store_settings_ibfk_3 | FOREIGN KEY | YES |
| `store_settings` | store_settings_ibfk_1 | FOREIGN KEY | YES |
| `store_settings` | PRIMARY | PRIMARY KEY | YES |
| `store_settings` | unique_store_setting | UNIQUE | YES |
| `store_settings_history` | store_settings_history_ibfk_1 | FOREIGN KEY | YES |
| `store_settings_history` | store_settings_history_ibfk_2 | FOREIGN KEY | YES |
| `store_settings_history` | store_settings_history_ibfk_3 | FOREIGN KEY | YES |
| `store_settings_history` | PRIMARY | PRIMARY KEY | YES |
| `stores` | stores_chk_1 | CHECK | YES |
| `stores` | stores_chk_8 | CHECK | YES |
| `stores` | stores_chk_7 | CHECK | YES |
| `stores` | stores_chk_6 | CHECK | YES |
| `stores` | stores_chk_5 | CHECK | YES |
| `stores` | stores_chk_4 | CHECK | YES |
| `stores` | stores_chk_3 | CHECK | YES |
| `stores` | stores_chk_2 | CHECK | YES |
| `stores` | stores_ibfk_2 | FOREIGN KEY | YES |
| `stores` | stores_ibfk_1 | FOREIGN KEY | YES |
| `stores` | PRIMARY | PRIMARY KEY | YES |
| `stores` | npi | UNIQUE | YES |
| `stores` | dea_registration_number | UNIQUE | YES |
| `user_permissions` | user_permissions_ibfk_1 | FOREIGN KEY | YES |
| `user_permissions` | user_permissions_ibfk_2 | FOREIGN KEY | YES |
| `user_permissions` | PRIMARY | PRIMARY KEY | YES |
| `user_permissions` | unique_user_permission | UNIQUE | YES |
| `user_sessions` | user_sessions_ibfk_1 | FOREIGN KEY | YES |
| `user_sessions` | user_sessions_ibfk_2 | FOREIGN KEY | YES |
| `user_sessions` | user_sessions_ibfk_3 | FOREIGN KEY | YES |
| `user_sessions` | PRIMARY | PRIMARY KEY | YES |
| `user_sessions` | unique_session_token | UNIQUE | YES |
| `user_store_access` | user_store_access_ibfk_3 | FOREIGN KEY | YES |
| `user_store_access` | user_store_access_ibfk_2 | FOREIGN KEY | YES |
| `user_store_access` | user_store_access_ibfk_1 | FOREIGN KEY | YES |
| `user_store_access` | PRIMARY | PRIMARY KEY | YES |
| `user_store_access` | unique_user_store | UNIQUE | YES |
| `users` | users_chk_1 | CHECK | YES |
| `users` | users_chk_2 | CHECK | YES |
| `users` | users_chk_3 | CHECK | YES |
| `users` | users_chk_4 | CHECK | YES |
| `users` | users_chk_5 | CHECK | YES |
| `users` | users_ibfk_1 | FOREIGN KEY | YES |
| `users` | users_ibfk_2 | FOREIGN KEY | YES |
| `users` | PRIMARY | PRIMARY KEY | YES |
| `users` | email | UNIQUE | YES |

### Foreign Key Constraints with Referential Actions

| Table | Column | References | Update Rule | Delete Rule | Constraint Name |
|-------|--------|------------|-------------|-------------|-----------------|
| `fda_search_history` | `store_id` | `stores.id` | NO ACTION | CASCADE | fda_search_history_ibfk_2 |
| `fda_search_history` | `user_id` | `users.id` | NO ACTION | SET NULL | fda_search_history_ibfk_1 |
| `god_mode_audit` | `target_store_id` | `stores.id` | NO ACTION | SET NULL | god_mode_audit_ibfk_2 |
| `god_mode_audit` | `user_id` | `users.id` | NO ACTION | CASCADE | god_mode_audit_ibfk_1 |
| `inventory_audit_log` | `drug_id` | `drugs.id` | NO ACTION | CASCADE | inventory_audit_log_ibfk_3 |
| `inventory_audit_log` | `inventory_id` | `store_inventory.id` | NO ACTION | CASCADE | inventory_audit_log_ibfk_1 |
| `inventory_audit_log` | `performed_by` | `users.id` | NO ACTION | RESTRICT | inventory_audit_log_ibfk_4 |
| `inventory_audit_log` | `store_id` | `stores.id` | NO ACTION | CASCADE | inventory_audit_log_ibfk_2 |
| `post_it_notes` | `store_id` | `stores.id` | NO ACTION | CASCADE | post_it_notes_ibfk_1 |
| `post_it_notes` | `user_id` | `users.id` | NO ACTION | CASCADE | post_it_notes_ibfk_2 |
| `store_access` | `granted_by` | `users.id` | NO ACTION | SET NULL | store_access_ibfk_3 |
| `store_access` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_access_ibfk_2 |
| `store_access` | `user_id` | `users.id` | NO ACTION | CASCADE | store_access_ibfk_1 |
| `store_inventory` | `drug_id` | `drugs.id` | NO ACTION | CASCADE | store_inventory_ibfk_2 |
| `store_inventory` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_inventory_ibfk_1 |
| `store_inventory_snapshot` | `drug_id` | `drugs.id` | NO ACTION | CASCADE | store_inventory_snapshot_ibfk_2 |
| `store_inventory_snapshot` | `last_transaction_id` | `inventory_audit_log.id` | NO ACTION | SET NULL | store_inventory_snapshot_ibfk_3 |
| `store_inventory_snapshot` | `last_updated_by` | `users.id` | NO ACTION | SET NULL | store_inventory_snapshot_ibfk_4 |
| `store_inventory_snapshot` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_inventory_snapshot_ibfk_1 |
| `store_inventory_snapshot_history` | `drug_id` | `drugs.id` | NO ACTION | CASCADE | store_inventory_snapshot_history_ibfk_2 |
| `store_inventory_snapshot_history` | `performed_by` | `users.id` | NO ACTION | SET NULL | store_inventory_snapshot_history_ibfk_4 |
| `store_inventory_snapshot_history` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_inventory_snapshot_history_ibfk_1 |
| `store_inventory_snapshot_history` | `transaction_id` | `inventory_audit_log.id` | NO ACTION | SET NULL | store_inventory_snapshot_history_ibfk_3 |
| `store_settings` | `created_by` | `users.id` | NO ACTION | RESTRICT | store_settings_ibfk_2 |
| `store_settings` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_settings_ibfk_1 |
| `store_settings` | `updated_by` | `users.id` | NO ACTION | RESTRICT | store_settings_ibfk_3 |
| `store_settings_history` | `changed_by` | `users.id` | NO ACTION | RESTRICT | store_settings_history_ibfk_3 |
| `store_settings_history` | `store_id` | `stores.id` | NO ACTION | CASCADE | store_settings_history_ibfk_2 |
| `store_settings_history` | `store_setting_id` | `store_settings.id` | NO ACTION | CASCADE | store_settings_history_ibfk_1 |
| `stores` | `admin_user_id` | `users.id` | NO ACTION | SET NULL | stores_ibfk_2 |
| `stores` | `admin_user_id` | `users.id` | NO ACTION | SET NULL | stores_ibfk_1 |
| `user_permissions` | `granted_by` | `users.id` | NO ACTION | SET NULL | user_permissions_ibfk_2 |
| `user_permissions` | `user_id` | `users.id` | NO ACTION | CASCADE | user_permissions_ibfk_1 |
| `user_sessions` | `current_store_id` | `stores.id` | NO ACTION | SET NULL | user_sessions_ibfk_2 |
| `user_sessions` | `original_store_id` | `stores.id` | NO ACTION | CASCADE | user_sessions_ibfk_3 |
| `user_sessions` | `user_id` | `users.id` | NO ACTION | CASCADE | user_sessions_ibfk_1 |
| `user_store_access` | `granted_by` | `users.id` | NO ACTION | SET NULL | user_store_access_ibfk_3 |
| `user_store_access` | `store_id` | `stores.id` | NO ACTION | CASCADE | user_store_access_ibfk_2 |
| `user_store_access` | `user_id` | `users.id` | NO ACTION | CASCADE | user_store_access_ibfk_1 |
| `users` | `active_store_id` | `stores.id` | NO ACTION | SET NULL | users_ibfk_2 |
| `users` | `store_id` | `stores.id` | NO ACTION | CASCADE | users_ibfk_1 |

## Entity Relationship Summary

```
CORE ENTITIES:
stores (1) ──── (many) users
stores (1) ──── (many) store_inventory  
stores (1) ──── (many) store_settings
stores (1) ──── (many) inventory_audit_log
stores (1) ──── (many) post_it_notes

drugs (1) ──── (many) store_inventory
drugs (1) ──── (many) inventory_audit_log

users (1) ──── (many) inventory_audit_log (performed_by)
users (1) ──── (many) user_sessions
users (1) ──── (many) user_store_access
users (1) ──── (many) post_it_notes

INVENTORY CHAIN:
store_inventory (1) ──── (many) inventory_audit_log
store_inventory (1) ──── (1) store_inventory_snapshot
store_inventory_snapshot (1) ──── (many) store_inventory_snapshot_history

ACCESS CONTROL:
users (1) ──── (many) store_access
users (1) ──── (many) user_permissions
stores (1) ──── (many) store_access

AUDIT & HISTORY:
stores (1) ──── (many) god_mode_audit
stores (1) ──── (many) fda_search_history
store_settings (1) ──── (many) store_settings_history
```

## Business Logic & Rules

### Store Operations
- **Multi-Tenant Architecture**: Each store operates independently with isolated data
- **God Mode Access**: Special users can access multiple stores with full audit logging
- **Store Settings**: Configurable per-store with full history tracking

### Inventory Management  
- **Real-Time Tracking**: All inventory changes immediately update quantities and snapshots
- **Transaction Safety**: Database triggers ensure consistency between inventory and audit logs
- **Lot Tracking**: Unique constraints prevent duplicate lot numbers per store/drug combination
- **Expiration Management**: Built-in expiration date tracking and alerts

### User Access & Security
- **Role-Based Access**: Users have roles (admin, user, god_mode) with different permissions
- **Store Assignment**: Users belong to primary stores but can have access to additional stores
- **Session Management**: Secure session tracking with store context switching
- **Audit Everything**: All significant actions are logged with user attribution

### Data Integrity Safeguards
- **Referential Integrity**: Extensive foreign key constraints prevent orphaned records
- **Soft Deletes**: `is_active` flags preserve audit trails while hiding inactive records  
- **Unique Constraints**: Prevent duplicate critical data (NDC numbers, DEA registrations, etc.)
- **Check Constraints**: Validate data formats and business rules at database level

### Reporting & Compliance
- **FDA Integration**: Search history tracking for regulatory compliance
- **Comprehensive Auditing**: Every inventory transaction logged with full context
- **Historical Snapshots**: Point-in-time inventory states for reconciliation
- **Post-It Notes**: Store-specific messaging and communication system

## Constraint Explanations

### Foreign Key Actions

- **CASCADE**: When parent record is updated/deleted, child records are automatically updated/deleted
- **RESTRICT**: Prevents parent record from being updated/deleted if child records exist
- **SET NULL**: When parent record is deleted, foreign key in child records is set to NULL
- **NO ACTION**: Similar to RESTRICT, but check is deferred until end of statement

### Index Types

- **PRIMARY**: Primary key constraint (unique, non-null)
- **UNIQUE**: Unique constraint (allows one NULL)
- **INDEX**: Regular index for performance
- **FULLTEXT**: Full-text search index

## Data Integrity Rules

1. **Store Isolation**: Each store maintains separate inventory and transactions
2. **User Access Control**: Users are assigned to specific stores with role-based permissions
3. **Audit Trail**: All inventory changes are logged with timestamps and user attribution
4. **Referential Integrity**: All foreign keys maintain data consistency
5. **Soft Deletes**: Most records use `is_active` flags instead of physical deletion

---

## Example Data & SQL Scripts

### Table: `stores`

#### Example Data
```sql
-- Sample store data
INSERT INTO stores (name, address, state, zipcode, phone, fax, dea_registration_number, npi) VALUES
('Downtown Pharmacy', '123 Main Street, Suite 100', 'CA', '90210', '3105551234', '3105551235', 'AB1234567', '1234567890'),
('Northside Medical Pharmacy', '456 Oak Avenue, Building A', 'NY', '10001', '2125559876', '2125559877', 'CD7891011', '9876543210'),
('Community Health Pharmacy', '789 Elm Street', 'TX', '75201', '2145554567', NULL, 'EF1357924', '5647382910');
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) >= 2 AND name REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,&]+$'),
    address VARCHAR(500) NOT NULL CHECK (CHAR_LENGTH(TRIM(address)) >= 5),
    state CHAR(2) NOT NULL CHECK (state REGEXP '^[A-Z]{2}$'),
    zipcode VARCHAR(10) NOT NULL CHECK (zipcode REGEXP '^[0-9]{5}(-[0-9]{4})?$'),
    phone VARCHAR(11) NOT NULL CHECK (phone REGEXP '^[0-9]{10,11}$'),
    fax VARCHAR(11) CHECK (fax IS NULL OR fax REGEXP '^[0-9]{10,11}$'),
    dea_registration_number CHAR(9) UNIQUE NOT NULL CHECK (dea_registration_number REGEXP '^[A-Z]{2}[0-9]{7}$'),
    npi CHAR(10) UNIQUE NOT NULL CHECK (npi REGEXP '^[0-9]{10}$'),
    admin_user_id INT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Related API Endpoints
- `GET /api/stores` - List all accessible stores
- `GET /api/stores/:id` - Get specific store details
- `POST /api/stores` - Create new store (god_mode only)
- `PUT /api/stores/:id` - Update store information
- `DELETE /api/stores/:id` - Deactivate store (soft delete)
- `GET /api/stores/:id/stats` - Store analytics and statistics

---

### Table: `users`

#### Example Data
```sql
-- Sample user data (passwords are bcrypt hashed)
INSERT INTO users (name, email, phone, password, address, store_id, role, is_active) VALUES
('John Smith', 'admin@pharmatrak.com', '3105551111', '$2b$12$hash_example_admin_password', '100 Admin Street, Beverly Hills, CA 90210', 1, 'admin', TRUE),
('Sarah Johnson', 'sarah.johnson@downtown.com', '3105552222', '$2b$12$hash_example_user_password', '200 Staff Lane, Los Angeles, CA 90211', 1, 'user', TRUE),
('Michael Chen', 'mchen@northside.com', '2125553333', '$2b$12$hash_example_admin_password', '300 Manager Ave, New York, NY 10002', 2, 'admin', TRUE),
('Emily Davis', 'emily@community.com', '2145554444', '$2b$12$hash_example_user_password', '400 Employee Rd, Dallas, TX 75202', 3, 'user', TRUE);
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) >= 2),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
    phone VARCHAR(11) NOT NULL CHECK (phone REGEXP '^[0-9]{10,11}$'),
    password VARCHAR(255) NOT NULL CHECK (CHAR_LENGTH(password) >= 60),
    address VARCHAR(500) NOT NULL CHECK (CHAR_LENGTH(TRIM(address)) >= 5),
    store_id INT NOT NULL,
    role ENUM('admin', 'user', 'god_mode') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active_store_id INT,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (active_store_id) REFERENCES stores(id) ON DELETE SET NULL
);
```

#### Related API Endpoints
- `GET /api/users` - List users (filtered by store access)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Deactivate user (soft delete)
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

---

### Table: `drugs`

#### Example Data
```sql
-- Sample drug data
INSERT INTO drugs (ndc, product_ndc, generic_name, brand_name, dosage_form, route, strength, manufacturer_name, labeler_name, substance_name, product_type, marketing_status, is_active) VALUES
('0555-0106-02', '0555-0106', 'Acetaminophen', 'Tylenol', 'TABLET', 'ORAL', '325 mg', 'Johnson & Johnson', 'McNeil Consumer Healthcare', 'ACETAMINOPHEN', 'HUMAN OTC DRUG', 'approved', TRUE),
('50580-488-01', '50580-488', 'Ibuprofen', 'Advil', 'TABLET', 'ORAL', '200 mg', 'Pfizer Inc.', 'Pfizer Consumer Healthcare', 'IBUPROFEN', 'HUMAN OTC DRUG', 'approved', TRUE),
('0069-5070-66', '0069-5070', 'Amoxicillin', 'Amoxil', 'CAPSULE', 'ORAL', '250 mg', 'Pfizer Inc.', 'Pfizer Labs', 'AMOXICILLIN', 'HUMAN PRESCRIPTION DRUG', 'approved', TRUE),
('0071-0155-23', '0071-0155', 'Lisinopril', 'Prinivil', 'TABLET', 'ORAL', '10 mg', 'Merck & Co.', 'Merck Sharp & Dohme', 'LISINOPRIL', 'HUMAN PRESCRIPTION DRUG', 'approved', TRUE);
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS drugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ndc VARCHAR(15) UNIQUE NOT NULL,
    product_ndc VARCHAR(15) NOT NULL,
    generic_name VARCHAR(500),
    brand_name VARCHAR(500),
    dosage_form VARCHAR(100),
    route VARCHAR(255),
    strength VARCHAR(255),
    manufacturer_name VARCHAR(255),
    labeler_name VARCHAR(255),
    substance_name TEXT,
    product_type VARCHAR(100),
    marketing_status VARCHAR(50),
    listing_expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    fda_data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ndc (ndc),
    INDEX idx_product_ndc (product_ndc),
    INDEX idx_generic_name (generic_name),
    INDEX idx_brand_name (brand_name),
    INDEX idx_manufacturer (manufacturer_name),
    INDEX idx_active (is_active),
    FULLTEXT idx_generic_fulltext (generic_name),
    FULLTEXT idx_brand_fulltext (brand_name),
    FULLTEXT idx_substance_fulltext (substance_name)
);
```

#### Related API Endpoints
- `GET /api/drugs` - Search drugs with filters
- `GET /api/drugs/:id` - Get drug details
- `POST /api/drugs` - Add new drug to database
- `PUT /api/drugs/:id` - Update drug information
- `DELETE /api/drugs/:id` - Deactivate drug (soft delete)
- `GET /api/drugs/search/fda` - Search FDA database
- `POST /api/drugs/import/fda` - Import drug from FDA
- `GET /api/drugs/check-exist` - Check if drug exists by NDC

---

### Table: `store_inventory`

#### Example Data
```sql
-- Sample inventory data
INSERT INTO store_inventory (store_id, drug_id, quantity_on_hand, reorder_level, unit_cost, selling_price, lot_number, expiration_date, supplier, is_active) VALUES
(1, 1, 500, 100, 0.15, 0.25, 'LOT001-2024', '2026-12-31', 'McKesson Corporation', TRUE),
(1, 2, 250, 50, 0.20, 0.35, 'LOT002-2024', '2025-06-30', 'Cardinal Health', TRUE),
(1, 3, 100, 25, 2.50, 4.00, 'LOT003-2024', '2025-03-15', 'AmerisourceBergen', TRUE),
(2, 1, 750, 150, 0.14, 0.24, 'LOT004-2024', '2026-11-30', 'McKesson Corporation', TRUE),
(2, 4, 200, 40, 1.75, 3.25, 'LOT005-2024', '2027-01-31', 'Cardinal Health', TRUE);
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS store_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    quantity_on_hand INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    unit_cost DECIMAL(10,4),
    selling_price DECIMAL(10,4),
    lot_number VARCHAR(50),
    expiration_date DATE,
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_store_drug_lot (store_id, drug_id, lot_number),
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
    
    INDEX idx_store_drug (store_id, drug_id),
    INDEX idx_store_active (store_id, is_active),
    INDEX idx_expiration (expiration_date),
    INDEX idx_reorder (reorder_level, quantity_on_hand),
    INDEX idx_inventory_low_stock (store_id, is_active, quantity_on_hand, reorder_level),
    INDEX idx_inventory_expiring (store_id, is_active, expiration_date)
);
```

#### Related API Endpoints
- `GET /api/inventory/store/:storeId` - Get store inventory with filters
- `GET /api/inventory/:id` - Get specific inventory item
- `POST /api/inventory` - Add new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Remove inventory item
- `POST /api/inventory/:id/adjust` - Adjust stock quantity
- `GET /api/inventory/store/:storeId/low-stock` - Get low stock items
- `GET /api/inventory/store/:storeId/expiring` - Get expiring items
- `GET /api/inventory/store/:storeId/stats` - Inventory statistics

---

### Table: `inventory_audit_log`

#### Example Data
```sql
-- Sample audit log data
INSERT INTO inventory_audit_log (inventory_id, store_id, drug_id, transaction_type, quantity_change, quantity_before, quantity_after, reason, reference_number, performed_by) VALUES
(1, 1, 1, 'shipment_received', 500, 0, 500, 'Initial inventory - new shipment from McKesson', 'SHIP-2024-001', 1),
(1, 1, 1, 'prescription_fill', -10, 500, 490, 'Prescription fill for patient #12345', 'RX-2024-001', 2),
(2, 1, 2, 'shipment_received', 250, 0, 250, 'Received Ibuprofen shipment', 'SHIP-2024-002', 1),
(3, 1, 3, 'audit', -5, 100, 95, 'Physical count adjustment - inventory reconciliation', 'AUDIT-2024-001', 1),
(1, 1, 1, 'return_to_stock', 2, 490, 492, 'Patient returned unused medication', 'RTN-2024-001', 2);
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS inventory_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    transaction_type ENUM('prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory') NOT NULL,
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reason VARCHAR(500),
    reference_number VARCHAR(100),
    performed_by INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_id) REFERENCES store_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_store_drug (store_id, drug_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_performed_by (performed_by),
    INDEX idx_reference_number (reference_number),
    INDEX idx_audit_store_date (store_id, transaction_date),
    INDEX idx_audit_inventory_date (inventory_id, transaction_date)
);
```

#### Related API Endpoints
- `GET /api/audit-log/store/:storeId` - Get audit log for store
- `GET /api/audit-log/inventory/:inventoryId` - Get audit log for inventory item
- `GET /api/audit-log/drug/:drugId` - Get audit log for drug across stores
- `GET /api/audit-log/user/:userId` - Get user's transaction history
- `POST /api/audit-log` - Create manual audit entry (admin only)
- `GET /api/audit-log/reports/ndc` - Generate NDC audit report

---

### Table: `post_it_notes`

#### Example Data
```sql
-- Sample post-it notes data
INSERT INTO post_it_notes (store_id, user_id, content, position_x, position_y, color, is_pinned, is_active) VALUES
(1, 1, 'Remember to check expiration dates for Amoxicillin lot LOT003-2024', 100, 100, 'yellow', FALSE, TRUE),
(1, 2, 'New supplier contact: Cardinal Health rep - John Doe (555-0123)', 300, 150, 'blue', TRUE, TRUE),
(2, 3, 'Inventory count scheduled for Friday 3 PM - all staff required', 200, 200, 'pink', TRUE, TRUE),
(1, 1, 'Low stock alert: Ibuprofen below reorder level', 400, 100, 'red', FALSE, TRUE);
```

#### SQL Creation Script
```sql
CREATE TABLE IF NOT EXISTS post_it_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    position_x INT NOT NULL DEFAULT 300,
    position_y INT NOT NULL DEFAULT 100,
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_store_active (store_id, is_active),
    INDEX idx_store_pinned (store_id, is_pinned, is_active),
    INDEX idx_user_store (user_id, store_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
);
```

#### Related API Endpoints
- `GET /api/notes/store/:storeId` - Get notes for store
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note (soft delete)
- `PUT /api/notes/:id/pin` - Pin/unpin note
- `GET /api/notes/stats/store/:storeId` - Note statistics for store

---

## API Endpoints Summary by Functionality

### Authentication & Authorization
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - End user session
- `POST /api/auth/refresh` - Refresh JWT token

### Store Management
- `GET /api/stores` - List accessible stores
- `GET /api/stores/:id` - Get store details
- `POST /api/stores` - Create store (god_mode)
- `PUT /api/stores/:id` - Update store
- `GET /api/stores/:id/stats` - Store statistics

### User Management
- `GET /api/users` - List users by store access
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Drug Database
- `GET /api/drugs` - Search drugs
- `GET /api/drugs/search/fda` - FDA drug search
- `POST /api/drugs/import/fda` - Import from FDA
- `POST /api/drugs` - Add drug
- `PUT /api/drugs/:id` - Update drug

### Inventory Management
- `GET /api/inventory/store/:storeId` - Store inventory
- `POST /api/inventory/:id/adjust` - Adjust stock
- `GET /api/inventory/store/:storeId/low-stock` - Low stock items
- `GET /api/inventory/store/:storeId/expiring` - Expiring items
- `POST /api/inventory` - Add inventory item

### Audit & Reporting
- `GET /api/audit-log/store/:storeId` - Audit history
- `GET /api/audit-log/reports/ndc` - NDC reports
- `GET /api/dashboard/stats/:storeId` - Dashboard data
- `GET /api/reports/inventory/:storeId` - Inventory reports

### God Mode Operations
- `POST /api/god-mode/switch-store` - Switch store context
- `GET /api/god-mode/audit` - God mode audit log
- `POST /api/god-mode/users/impersonate` - User impersonation

### Communication
- `GET /api/notes/store/:storeId` - Store notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### System Health
- `GET /api/health` - System health check
- `GET /api/debug/info` - Debug information
- `POST /api/backup/create` - Create system backup

