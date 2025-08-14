/**
 * Database Transaction Helper
 * 
 * Provides utilities for managing MySQL transactions across the application.
 * Ensures data integrity and automatic rollback on errors.
 * 
 * Features:
 * - Automatic transaction management
 * - Error handling with rollback
 * - Connection pooling support
 * - Deadlock detection and retry logic
 * - Nested transaction prevention
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool } = require('../config/database');

/**
 * Execute operations within a database transaction
 * @param {Function} operations - Async function containing database operations
 * @param {Object} options - Transaction options
 * @returns {*} Result from operations function
 */
async function withTransaction(operations, options = {}) {
  const { 
    retryOnDeadlock = true, 
    maxRetries = 3,
    isolationLevel = 'READ_COMMITTED' // READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
  } = options;
  
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    const connection = await pool.getConnection();
    
    try {
      // Set isolation level if specified
      if (isolationLevel) {
        await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }
      
      // Start transaction
      await connection.beginTransaction();
      
      // Execute operations with the transaction connection
      const result = await operations(connection);
      
      // Commit transaction
      await connection.commit();
      
      return result;
      
    } catch (error) {
      // Rollback transaction on any error
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      
      // Check for deadlock and retry if enabled
      if (retryOnDeadlock && isDeadlockError(error) && retryCount < maxRetries) {
        retryCount++;
        console.warn(`Deadlock detected, retrying transaction (attempt ${retryCount}/${maxRetries})`);
        // Add exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        continue;
      }
      
      // Re-throw error if not retrying
      throw error;
      
    } finally {
      // Always release connection
      connection.release();
    }
  }
}

/**
 * Execute multiple operations in sequence within a transaction
 * @param {Array} operations - Array of operation objects
 * @returns {Array} Results from all operations
 */
async function executeInTransaction(operations) {
  return withTransaction(async (connection) => {
    const results = [];
    
    for (const operation of operations) {
      const { query, params = [], description } = operation;
      
      try {
        const [result] = await connection.execute(query, params);
        results.push(result);
        
        if (description) {
          console.log(`Transaction step completed: ${description}`);
        }
        
      } catch (error) {
        console.error(`Transaction step failed: ${description || 'Unknown operation'}`);
        throw error;
      }
    }
    
    return results;
  });
}

/**
 * Create a drug with inventory entry in a single transaction
 * @param {Object} drugData - Drug information
 * @param {Object} inventoryData - Inventory information
 * @returns {Object} Created drug and inventory IDs
 */
async function createDrugWithInventory(drugData, inventoryData) {
  return withTransaction(async (connection) => {
    // Insert drug
    const [drugResult] = await connection.execute(`
      INSERT INTO drugs (
        ndc, product_ndc, generic_name, brand_name, dosage_form, route, strength,
        manufacturer_name, labeler_name, substance_name, product_type, 
        marketing_status, listing_expiration_date, fda_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      drugData.ndc,
      drugData.product_ndc,
      drugData.generic_name,
      drugData.brand_name,
      drugData.dosage_form,
      drugData.route,
      drugData.strength,
      drugData.manufacturer_name,
      drugData.labeler_name,
      drugData.substance_name,
      drugData.product_type,
      drugData.marketing_status,
      drugData.listing_expiration_date,
      JSON.stringify(drugData.fda_data || {})
    ]);
    
    const drugId = drugResult.insertId;
    
    // Insert inventory entry
    const [inventoryResult] = await connection.execute(`
      INSERT INTO store_inventory (
        store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
        selling_price, lot_number, expiration_date, supplier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inventoryData.store_id,
      drugId,
      inventoryData.quantity_on_hand || 0,
      inventoryData.reorder_level || 0,
      inventoryData.unit_cost || 0,
      inventoryData.selling_price || 0,
      inventoryData.lot_number,
      inventoryData.expiration_date,
      inventoryData.supplier
    ]);
    
    // Create audit entry
    await connection.execute(`
      INSERT INTO audit_trail (
        table_name, operation, record_id, user_id, changes, timestamp
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      'drugs',
      'INSERT',
      drugId,
      inventoryData.user_id || null,
      JSON.stringify({ drug: drugData, inventory: inventoryData })
    ]);
    
    return {
      drugId: drugId,
      inventoryId: inventoryResult.insertId
    };
  });
}

/**
 * Update inventory quantity with audit trail
 * @param {number} inventoryId - Inventory record ID
 * @param {number} newQuantity - New quantity
 * @param {number} userId - User making the change
 * @param {string} reason - Reason for change
 * @returns {boolean} Success status
 */
async function updateInventoryQuantity(inventoryId, newQuantity, userId, reason = 'Quantity adjustment') {
  return withTransaction(async (connection) => {
    // Get current inventory data
    const [currentData] = await connection.execute(
      'SELECT * FROM store_inventory WHERE id = ?',
      [inventoryId]
    );
    
    if (currentData.length === 0) {
      throw new Error('Inventory record not found');
    }
    
    const oldQuantity = currentData[0].quantity_on_hand;
    
    // Update inventory
    const [updateResult] = await connection.execute(
      'UPDATE store_inventory SET quantity_on_hand = ?, last_updated = NOW() WHERE id = ?',
      [newQuantity, inventoryId]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Failed to update inventory quantity');
    }
    
    // Create audit entry
    await connection.execute(`
      INSERT INTO audit_trail (
        table_name, operation, record_id, user_id, changes, timestamp
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      'store_inventory',
      'UPDATE',
      inventoryId,
      userId,
      JSON.stringify({
        field: 'quantity_on_hand',
        old_value: oldQuantity,
        new_value: newQuantity,
        reason: reason
      })
    ]);
    
    return true;
  });
}

/**
 * Transfer inventory between stores
 * @param {Object} transferData - Transfer information
 * @returns {Object} Transfer result
 */
async function transferInventory(transferData) {
  const { 
    fromStoreId, 
    toStoreId, 
    drugId, 
    quantity, 
    userId, 
    reason = 'Store transfer' 
  } = transferData;
  
  return withTransaction(async (connection) => {
    // Check source inventory
    const [sourceInventory] = await connection.execute(`
      SELECT * FROM store_inventory 
      WHERE store_id = ? AND drug_id = ? AND is_active = TRUE
    `, [fromStoreId, drugId]);
    
    if (sourceInventory.length === 0) {
      throw new Error('Source inventory not found');
    }
    
    if (sourceInventory[0].quantity_on_hand < quantity) {
      throw new Error('Insufficient inventory quantity');
    }
    
    // Reduce source inventory
    await connection.execute(`
      UPDATE store_inventory 
      SET quantity_on_hand = quantity_on_hand - ?, last_updated = NOW()
      WHERE store_id = ? AND drug_id = ?
    `, [quantity, fromStoreId, drugId]);
    
    // Check if destination inventory exists
    const [destInventory] = await connection.execute(`
      SELECT * FROM store_inventory 
      WHERE store_id = ? AND drug_id = ?
    `, [toStoreId, drugId]);
    
    if (destInventory.length > 0) {
      // Update existing destination inventory
      await connection.execute(`
        UPDATE store_inventory 
        SET quantity_on_hand = quantity_on_hand + ?, last_updated = NOW(), is_active = TRUE
        WHERE store_id = ? AND drug_id = ?
      `, [quantity, toStoreId, drugId]);
    } else {
      // Create new destination inventory entry
      await connection.execute(`
        INSERT INTO store_inventory (
          store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
          selling_price, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `, [
        toStoreId, 
        drugId, 
        quantity,
        sourceInventory[0].reorder_level,
        sourceInventory[0].unit_cost,
        sourceInventory[0].selling_price
      ]);
    }
    
    // Create audit entries for both stores
    const auditData = {
      drug_id: drugId,
      quantity: quantity,
      from_store: fromStoreId,
      to_store: toStoreId,
      reason: reason
    };
    
    await connection.execute(`
      INSERT INTO audit_trail (
        table_name, operation, record_id, user_id, changes, timestamp
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      'store_inventory',
      'TRANSFER_OUT',
      fromStoreId,
      userId,
      JSON.stringify(auditData)
    ]);
    
    await connection.execute(`
      INSERT INTO audit_trail (
        table_name, operation, record_id, user_id, changes, timestamp
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      'store_inventory',
      'TRANSFER_IN',
      toStoreId,
      userId,
      JSON.stringify(auditData)
    ]);
    
    return { success: true, transferredQuantity: quantity };
  });
}

/**
 * Check if error is a deadlock error
 * @param {Error} error - Database error
 * @returns {boolean} True if deadlock error
 */
function isDeadlockError(error) {
  return error.code === 'ER_LOCK_DEADLOCK' || 
         error.errno === 1213 ||
         error.message.includes('Deadlock found');
}

/**
 * Check if error is a lock timeout error
 * @param {Error} error - Database error
 * @returns {boolean} True if lock timeout error
 */
function isLockTimeoutError(error) {
  return error.code === 'ER_LOCK_WAIT_TIMEOUT' || 
         error.errno === 1205 ||
         error.message.includes('Lock wait timeout');
}

module.exports = {
  withTransaction,
  executeInTransaction,
  createDrugWithInventory,
  updateInventoryQuantity,
  transferInventory,
  isDeadlockError,
  isLockTimeoutError
};