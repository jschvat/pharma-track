# Database Indexes for Performance Optimization

## Overview

This document describes the strategic database indexes added to improve query performance in PharmaTraK. These indexes were designed based on analysis of frequently used queries and database access patterns.

## Performance Indexes Added

### 1. Inventory Audit Log Indexes

**Purpose**: Optimize audit trail and transaction history queries

- `idx_audit_store_date` - Store + transaction date (DESC)
  - **Improves**: Store history queries with date filtering
  - **Query Pattern**: `/audit/store/:storeId` with date range

- `idx_audit_store_drug_date` - Store + drug + transaction date (DESC)
  - **Improves**: NDC audit reports and drug history queries
  - **Query Pattern**: Drug-specific transaction history

- `idx_audit_inventory_date` - Inventory + transaction date (DESC)
  - **Improves**: Individual inventory item history
  - **Query Pattern**: Transaction history for specific inventory items

- `idx_audit_user_date` - User + transaction date (DESC)
  - **Improves**: User activity reports
  - **Query Pattern**: Tracking user actions over time

### 2. Store Inventory Indexes

**Purpose**: Optimize inventory management queries

- `idx_inventory_low_stock` - Store + active + quantity + reorder level
  - **Improves**: `getLowStock()` method performance
  - **Query Pattern**: Finding items below reorder threshold

- `idx_inventory_expiring` - Store + active + expiration date
  - **Improves**: `getExpiring()` method performance
  - **Query Pattern**: Finding items expiring within date range

- `idx_inventory_last_updated` - Last updated timestamp (DESC)
  - **Improves**: Recently modified inventory queries
  - **Query Pattern**: Tracking recent inventory changes

- `idx_inventory_covering` - Composite covering index
  - **Columns**: store_id, is_active, quantity_on_hand, drug_id, expiration_date, lot_number(50)
  - **Improves**: Main inventory listing queries
  - **Query Pattern**: Complete inventory views with drug details

### 3. Drug Search Indexes

**Purpose**: Optimize drug database searches

- `idx_drugs_active_names` - Active + generic name + brand name (with length limits)
  - **Improves**: Drug search and filtering queries
  - **Query Pattern**: Active drug searches by name

- `idx_drugs_dosage_form` - Dosage form
  - **Improves**: Filtering by medication form
  - **Query Pattern**: Tablet, capsule, liquid filtering

- `idx_drugs_substance` - Substance name (100 chars)
  - **Improves**: Substance-based searches
  - **Query Pattern**: Active ingredient lookups

### 4. User Management Indexes

**Purpose**: Optimize user administration queries

- `idx_users_role_store` - Role + store + active status
  - **Improves**: User management filtering
  - **Query Pattern**: Admin views filtering by role and store

### 5. Store Settings Indexes

**Purpose**: Optimize configuration management

- `idx_store_settings_updated` - Updated timestamp (DESC)
  - **Improves**: Recent settings changes queries
  - **Query Pattern**: Configuration change tracking

### 6. Inventory Snapshot Indexes

**Purpose**: Optimize snapshot-based reporting

- `idx_snapshot_transaction_type` - Transaction type
  - **Improves**: Filtering by transaction type
  - **Query Pattern**: Report generation by transaction category

- `idx_snapshot_store_quantity` - Store + quantity (DESC)
  - **Improves**: Store-wide quantity analysis
  - **Query Pattern**: Inventory level reporting

## Performance Testing Results

After implementing these indexes, performance tests show:

- **Low stock queries**: ~2.3ms
- **Expiring items queries**: ~0.6ms  
- **Audit history queries**: ~2.5ms
- **Drug search queries**: ~1.5ms
- **Complex inventory queries**: ~0.9ms

All queries now execute in under 3ms, representing significant performance improvements.

## Index Statistics

Current index distribution across key tables:

- **store_inventory**: 12 indexes (including new performance indexes)
- **inventory_audit_log**: 9 indexes (including composite indexes)
- **drugs**: 11 indexes (including search optimizations)
- **users**: 5 indexes (including role-based filtering)
- **store_inventory_snapshot**: 13 indexes (including quantity analysis)

## Usage Guidelines

### When Indexes Are Most Effective

1. **Store-based filtering** - All store-specific queries benefit from store_id indexes
2. **Date range queries** - Audit and transaction history queries use date indexes
3. **Active status filtering** - is_active columns are frequently indexed
4. **Quantity comparisons** - Low stock and inventory level queries
5. **Text searches** - Name-based drug searches with length limits

### Index Maintenance

- Indexes are automatically maintained by MySQL
- Monitor query performance with `EXPLAIN` statements
- Consider index usage statistics periodically
- Length-limited indexes (e.g., varchar(100)) balance performance vs. storage

## Migration Information

- **Migration File**: `database/migrations/add_performance_indexes.sql`
- **Migration Script**: `scripts/run_performance_indexes.js`
- **Test Script**: `scripts/test_index_performance.js`
- **Indexes Created**: 15 strategic performance indexes
- **Failed Indexes**: 2 (due to missing columns in existing schema)

## Notes

- VARCHAR columns use length limits to avoid MySQL key length restrictions
- Composite indexes are ordered by selectivity (most selective first)
- DESC ordering on date columns optimizes recent-data queries
- Covering indexes include commonly selected columns to avoid table lookups