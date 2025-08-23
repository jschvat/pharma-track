# Inventory Snapshot System

## Overview

The Inventory Snapshot System provides real-time inventory tracking with atomic transaction safety. It maintains a separate `store_inventory_snapshot` table that tracks current on-hand quantities per store/drug combination and ensures that both audit logs and snapshot data are updated together or not at all.

## Key Features

### ✅ **Atomic Transactions**
- All inventory operations use database transactions
- Audit log and snapshot updates are atomic (both succeed or both fail)
- Prevents data inconsistencies from partial updates

### ✅ **Real-Time Current Inventory**
- `store_inventory_snapshot` table maintains current quantities
- One record per store/drug combination
- Updated automatically by all inventory transactions

### ✅ **Complete Audit Trail**
- All changes logged in `inventory_audit_log` table
- Full transaction history with user tracking
- Reference numbers for prescriptions, receipts, etc.

### ✅ **Transaction Safety**
- Deadlock detection and retry logic
- Input validation and constraint checking
- Rollback on any error to maintain data integrity

## Database Schema

### New Table: `store_inventory_snapshot`

```sql
CREATE TABLE store_inventory_snapshot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    last_transaction_id INT NULL,
    last_transaction_date TIMESTAMP NULL,
    last_transaction_type ENUM(...),
    last_updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (drug_id) REFERENCES drugs(id),
    FOREIGN KEY (last_transaction_id) REFERENCES inventory_audit_log(id),
    FOREIGN KEY (last_updated_by) REFERENCES users(id),
    
    UNIQUE KEY unique_store_drug_snapshot (store_id, drug_id)
);
```

### Stored Procedure: `UpdateInventorySnapshot`

Atomic procedure for updating snapshot data:
- Takes quantity change (not absolute quantity)
- Updates or creates snapshot record
- Maintains referential integrity

## API Endpoints

### Snapshot Data Access

```
GET /api/inventory-snapshot/store/{storeId}/current
GET /api/inventory-snapshot/store/{storeId}/low-stock
GET /api/inventory-snapshot/store/{storeId}/out-of-stock
GET /api/inventory-snapshot/store/{storeId}/stats
GET /api/inventory-snapshot/store/{storeId}/search?q={searchTerm}
```

### Transaction-Safe Operations

```
POST /api/inventory-snapshot/transactions/prescription-fill
POST /api/inventory-snapshot/transactions/return-to-stock
POST /api/inventory-snapshot/transactions/expire
POST /api/inventory-snapshot/transactions/audit
```

### Transaction History

```
GET /api/inventory-snapshot/transactions/history/{storeId}/{drugId}
```

## Usage Examples

### 1. Get Current Inventory for Store

```javascript
// Get all current inventory for store ID 1
const inventory = await InventorySnapshot.getByStore(1, {
    includeZeroQuantity: false,
    orderBy: 'generic_name',
    orderDirection: 'ASC',
    limit: 100
});
```

### 2. Process Prescription Fill

```javascript
const result = await InventoryTransactionHelper.executeInventoryTransaction({
    inventoryId: 123,
    storeId: 1,
    drugId: 456,
    transactionType: 'prescription_fill',
    quantityChange: -30,  // Negative for dispensing
    quantityBefore: 100,
    quantityAfter: 70,
    reason: 'Prescription dispensed',
    referenceNumber: 'RX-2025-001234',
    performedBy: userId
});
```

### 3. Return Medication to Stock

```javascript
const result = await InventoryTransactionHelper.executeInventoryTransaction({
    inventoryId: 123,
    storeId: 1,
    drugId: 456,
    transactionType: 'return_to_stock',
    quantityChange: 5,    // Positive for returns
    quantityBefore: 70,
    quantityAfter: 75,
    reason: 'Patient returned unused medication',
    referenceNumber: 'RTN-2025-001',
    performedBy: userId
});
```

### 4. Get Low Stock Items

```javascript
const lowStock = await InventorySnapshot.getLowStock(storeId, 10);
```

### 5. Get Store Statistics

```javascript
const stats = await InventorySnapshot.getStoreStats(storeId);
// Returns: total_drugs, in_stock_count, out_of_stock_count, etc.
```

## Implementation Files

### Core Components

1. **Database Migration**
   - `database/migrations/add_inventory_snapshot.sql`
   - Creates table, indexes, stored procedure, and view

2. **Model Layer**
   - `models/InventorySnapshot.js`
   - Methods for querying snapshot data

3. **Transaction Helper**
   - `utils/inventoryTransactionHelper.js`
   - Atomic transaction management

4. **Route Layer**
   - `routes/inventorySnapshot.js`
   - API endpoints for snapshot operations

5. **Test Suite**
   - `test_inventory_snapshot.js`
   - Comprehensive testing of all functionality

### Route Integration

Added to `server.js`:
```javascript
const inventorySnapshotRoutes = require('./routes/inventorySnapshot');
app.use('/api/inventory-snapshot', inventorySnapshotRoutes);
```

## Transaction Types

The system supports the following transaction types:

- `prescription_fill` - Medication dispensed to patient
- `return_to_stock` - Medication returned to inventory
- `expire` - Medication expired/disposed
- `audit` - Inventory count adjustment
- `shipment_received` - New stock received
- `initial_inventory` - Initial setup of inventory

## Error Handling

### Validation Errors
- Missing required fields
- Invalid transaction types
- Negative final quantities
- Quantity calculation mismatches

### Database Errors
- Foreign key constraint violations
- Deadlock detection and retry
- Connection failures
- Transaction rollback on any error

### Business Logic Errors
- Insufficient quantity for dispensing
- Access denied for different stores
- Invalid inventory records

## Testing

Run the test suite to verify system functionality:

```bash
node test_inventory_snapshot.js
```

The test suite verifies:
- Database connectivity
- Table existence
- Snapshot retrieval
- Transaction execution
- Snapshot synchronization
- Statistics calculation
- Transaction history
- Error handling and rollback

## Performance Considerations

### Indexes
- Composite index on `(store_id, drug_id)` for fast lookups
- Individual indexes on common query fields
- Full-text search capabilities maintained

### Stored Procedure
- Uses single stored procedure call for atomic updates
- Minimizes round trips between application and database
- Handles deadlock retry logic at database level

### View Optimization
- `v_current_inventory` view joins all necessary data
- Pre-computed stock status calculations
- Efficient for reporting and analytics

## Migration Instructions

1. **Backup Database**
   ```bash
   mysqldump pharmatrak > pharmatrak_backup.sql
   ```

2. **Run Migration**
   ```bash
   mysql pharmatrak < database/migrations/add_inventory_snapshot.sql
   ```

3. **Verify Installation**
   ```bash
   node test_inventory_snapshot.js
   ```

4. **Update Application**
   - New routes automatically available at `/api/inventory-snapshot/`
   - Original inventory routes remain unchanged
   - Gradual migration to new transaction-safe endpoints recommended

## Benefits

### Data Integrity
- Eliminates race conditions in inventory updates
- Prevents audit log and inventory data from getting out of sync
- Atomic transactions ensure consistency

### Performance
- Real-time current quantities without complex aggregations
- Efficient low stock and out-of-stock queries
- Optimized indexes for common access patterns

### Auditing
- Complete transaction history with user tracking
- Reference numbers for external system integration
- Full traceability of all inventory changes

### Scalability
- Separate snapshot table reduces load on main inventory table
- Stored procedures handle complex logic at database level
- Efficient queries for reporting and analytics

## Future Enhancements

- **Batch Processing**: Support for bulk operations
- **Real-time Notifications**: Alerts for low stock conditions
- **Historical Analytics**: Trend analysis and forecasting
- **Integration APIs**: Connect with external pharmacy systems
- **Mobile Optimization**: Streamlined endpoints for mobile apps