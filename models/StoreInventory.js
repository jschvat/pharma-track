const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');
const InventoryAuditLog = require('./InventoryAuditLog');
const InventorySnapshot = require('./InventorySnapshot');

class StoreInventory {
  /**
   * Add drug to store inventory
   * @param {Object} inventoryData - Inventory data
   * @param {number} performedBy - User ID who performed the action
   * @returns {number} Inventory ID
   */
  static async add(inventoryData, performedBy = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        store_id,
        drug_id,
        quantity_on_hand = 0,
        reorder_level = 0,
        unit_cost,
        selling_price,
        lot_number,
        expiration_date,
        supplier
      } = inventoryData;

      // Insert new inventory item
      const [result] = await connection.execute(`
        INSERT INTO store_inventory (
          store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
          selling_price, lot_number, expiration_date, supplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
        selling_price, lot_number, expiration_date, supplier
      ]);

      const inventoryId = result.insertId;

      // Log initial stock and update snapshot if quantity > 0 and performed_by is provided
      if (quantity_on_hand > 0 && performedBy) {
        // Log the audit transaction
        const [auditResult] = await connection.execute(`
          INSERT INTO inventory_audit_log (
            inventory_id, store_id, drug_id, transaction_type, quantity_change,
            quantity_before, quantity_after, reason, performed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          inventoryId, store_id, drug_id, 'initial_inventory', quantity_on_hand,
          0, quantity_on_hand, 'Initial inventory stock', performedBy
        ]);
        
        const auditLogId = auditResult.insertId;

        // Update inventory snapshot
        await connection.execute(`
          INSERT INTO store_inventory_snapshot (
            store_id, drug_id, quantity_on_hand, last_transaction_id,
            last_transaction_date, last_transaction_type, last_updated_by
          ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
          ON DUPLICATE KEY UPDATE
            quantity_on_hand = quantity_on_hand + ?,
            last_transaction_id = ?,
            last_transaction_date = NOW(),
            last_transaction_type = ?,
            last_updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        `, [
          store_id, drug_id, quantity_on_hand, auditLogId,
          'initial_inventory', performedBy,
          quantity_on_hand, auditLogId, 'initial_inventory', performedBy
        ]);
        
      }

      await connection.commit();
      return inventoryId;
      
    } catch (error) {
      await connection.rollback();
      console.error('Add inventory failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update inventory item
   * @param {number} id - Inventory ID
   * @param {Object} updateData - Update data
   * @returns {boolean} Success status
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      const allowedFields = [
        'quantity_on_hand', 'reorder_level', 'unit_cost', 'selling_price',
        'lot_number', 'expiration_date', 'supplier', 'is_active'
      ];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(id);
      const [result] = await db.execute(
        `UPDATE store_inventory SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get inventory by store
   * @param {number} storeId - Store ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Inventory items
   */
  static async getByStore(storeId, filters = {}) {
    try {
      let query = `
        SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
               d.strength, d.manufacturer_name
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ?
      `;
      
      const params = [storeId];
      
      if (filters.activeOnly) {
        query += ' AND si.is_active = TRUE';
      }
      
      if (filters.lowStock) {
        query += ' AND si.quantity_on_hand <= si.reorder_level';
      }
      
      if (filters.expiringSoon) {
        query += ' AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)';
      }
      
      query += ' ORDER BY d.generic_name, d.brand_name';
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get inventory item by ID
   * @param {number} id - Inventory ID
   * @returns {Object|null} Inventory item
   */
  static async findById(id) {
    try {
      const [rows] = await db.execute(`
        SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
               d.strength, d.manufacturer_name
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.id = ?
      `, [id]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Check if drug exists in store inventory
   * @param {number} storeId - Store ID
   * @param {number} drugId - Drug ID
   * @param {string} lotNumber - Lot number (optional)
   * @returns {Object|null} Existing inventory item
   */
  static async findByStoreDrug(storeId, drugId, lotNumber = null) {
    try {
      let query = 'SELECT * FROM store_inventory WHERE store_id = ? AND drug_id = ?';
      const params = [storeId, drugId];
      
      if (lotNumber) {
        query += ' AND lot_number = ?';
        params.push(lotNumber);
      }
      
      const [rows] = await db.execute(query, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update stock quantity
   * @param {number} id - Inventory ID
   * @param {number} quantity - New quantity
   * @returns {boolean} Success status
   */
  static async updateQuantity(id, quantity) {
    try {
      const [result] = await db.execute(
        'UPDATE store_inventory SET quantity_on_hand = ? WHERE id = ?',
        [quantity, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Add stock from shipment received
   * @param {number} id - Inventory ID
   * @param {number} quantity - Quantity received (positive)
   * @param {string} reason - Reason for shipment
   * @param {number} performedBy - User ID who performed the action
   * @param {string} invoiceNumber - Required invoice number
   * @returns {boolean} Success status
   */
  static async receiveShipment(id, quantity, reason = 'Shipment received', performedBy, invoiceNumber) {
    if (!invoiceNumber) {
      throw new Error('Invoice number is required for shipment received');
    }
    return await this.adjustStock(id, quantity, reason, performedBy, 'shipment_received', invoiceNumber);
  }

  /**
   * Internal method: Adjust stock (add or subtract) with proper transaction protection
   * @param {number} id - Inventory ID
   * @param {number} adjustment - Quantity adjustment (positive or negative)
   * @param {string} reason - Reason for adjustment
   * @param {number} performedBy - User ID who performed the action
   * @param {string} transactionType - Type of transaction
   * @param {string} referenceNumber - Optional reference number
   * @returns {boolean} Success status
   */
  static async adjustStock(id, adjustment, reason = 'Stock adjustment', performedBy, transactionType = 'shipment_received', referenceNumber = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get current inventory data with row-level locking
      const [inventoryRows] = await connection.execute(
        'SELECT * FROM store_inventory WHERE id = ? FOR UPDATE',
        [id]
      );
      
      if (!inventoryRows.length) {
        throw new Error('Inventory item not found');
      }
      
      const inventory = inventoryRows[0];
      const quantityBefore = inventory.quantity_on_hand;
      const quantityAfter = quantityBefore + adjustment;
      
      // Validate that we don't go negative (unless it's an audit correction)
      if (quantityAfter < 0 && transactionType !== 'audit') {
        throw new Error(`Insufficient inventory. Available: ${quantityBefore}, Requested: ${Math.abs(adjustment)}`);
      }

      // Update the inventory quantity
      const [updateResult] = await connection.execute(
        'UPDATE store_inventory SET quantity_on_hand = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [quantityAfter, id]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update inventory quantity');
      }
      
      // Log the audit transaction
      let auditLogId = null;
      if (performedBy) {
        const [auditResult] = await connection.execute(`
          INSERT INTO inventory_audit_log (
            inventory_id, store_id, drug_id, transaction_type, quantity_change,
            quantity_before, quantity_after, reason, reference_number, performed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, inventory.store_id, inventory.drug_id, transactionType, adjustment,
          quantityBefore, quantityAfter, reason, referenceNumber, performedBy
        ]);
        
        auditLogId = auditResult.insertId;
      }
      
      // Update inventory snapshot table
      await connection.execute(`
        INSERT INTO store_inventory_snapshot (
          store_id, drug_id, quantity_on_hand, last_transaction_id,
          last_transaction_date, last_transaction_type, last_updated_by
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
        ON DUPLICATE KEY UPDATE
          quantity_on_hand = quantity_on_hand + ?,
          last_transaction_id = ?,
          last_transaction_date = NOW(),
          last_transaction_type = ?,
          last_updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [
        inventory.store_id, inventory.drug_id, quantityAfter, auditLogId,
        transactionType, performedBy,
        adjustment, auditLogId, transactionType, performedBy
      ]);
      
      await connection.commit();
      
      
      return true;
      
    } catch (error) {
      await connection.rollback();
      console.error('Stock adjustment failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get low stock items
   * @param {number} storeId - Store ID
   * @param {number} limit - Maximum results
   * @returns {Array} Low stock items
   */
  static async getLowStock(storeId, limit = 50) {
    try {
      // Sanitize limit parameter to avoid injection
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      
      const [rows] = await db.execute(`
        SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
               d.strength, d.manufacturer_name
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ? 
          AND si.is_active = TRUE 
          AND si.quantity_on_hand <= si.reorder_level
        ORDER BY (si.quantity_on_hand / NULLIF(si.reorder_level, 0)) ASC
        LIMIT ${limitInt}
      `, [parseInt(storeId)]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get expiring items
   * @param {number} storeId - Store ID
   * @param {number} days - Days until expiration
   * @param {number} limit - Maximum results
   * @returns {Array} Expiring items
   */
  static async getExpiring(storeId, days = 30, limit = 50) {
    try {
      // Sanitize parameters to avoid injection
      const daysInt = Math.max(1, Math.min(parseInt(days) || 30, 365));
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      
      const [rows] = await db.execute(`
        SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
               d.strength, d.manufacturer_name,
               DATEDIFF(si.expiration_date, CURDATE()) as days_until_expiration
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ? 
          AND si.is_active = TRUE 
          AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND si.expiration_date > CURDATE()
        ORDER BY si.expiration_date ASC
        LIMIT ${limitInt}
      `, [parseInt(storeId), daysInt]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Delete inventory item
   * @param {number} id - Inventory ID
   * @returns {boolean} Success status
   */
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM store_inventory WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get inventory statistics for a store
   * @param {number} storeId - Store ID
   * @returns {Object} Inventory statistics
   */
  static async getStats(storeId) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_items,
          COUNT(CASE WHEN quantity_on_hand <= reorder_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_items,
          SUM(quantity_on_hand * unit_cost) as total_inventory_value,
          AVG(quantity_on_hand) as avg_quantity
        FROM store_inventory
        WHERE store_id = ? AND is_active = TRUE
      `, [storeId]);
      
      return stats[0];
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find inventory with filters
   * @param {Object} filters - Search filters
   * @param {number} limit - Maximum results
   * @param {number} offset - Results offset
   * @returns {Array} Inventory items
   */
  static async findWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      let query = 'SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, d.strength, d.manufacturer_name FROM store_inventory si INNER JOIN drugs d ON si.drug_id = d.id WHERE 1=1';
      const params = [];

      if (filters.store_id) {
        query += ' AND si.store_id = ?';
        params.push(parseInt(filters.store_id));
      }

      if (filters.is_active !== undefined) {
        query += ' AND si.is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }

      if (filters.low_stock) {
        query += ' AND si.quantity_on_hand <= si.reorder_level';
      }

      if (filters.expiring_days) {
        query += ' AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)';
        params.push(parseInt(filters.expiring_days));
      }

      if (filters.search) {
        query += ' AND (d.generic_name LIKE ? OR d.brand_name LIKE ? OR d.ndc LIKE ? OR si.lot_number LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Sanitize limit and offset parameters
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const offsetInt = Math.max(0, parseInt(offset) || 0);
      
      // Using string interpolation for LIMIT/OFFSET to avoid MySQL2 compatibility issues
      query += ` ORDER BY d.generic_name, d.brand_name LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Count inventory with filters
   * @param {Object} filters - Search filters
   * @returns {number} Total count
   */
  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM store_inventory si INNER JOIN drugs d ON si.drug_id = d.id WHERE 1=1';
      let whereConditions = [];

      if (filters.store_id) {
        whereConditions.push(`si.store_id = ${parseInt(filters.store_id)}`);
      }

      if (filters.is_active !== undefined) {
        whereConditions.push(`si.is_active = ${filters.is_active ? 1 : 0}`);
      }

      if (filters.low_stock) {
        whereConditions.push('si.quantity_on_hand <= si.reorder_level');
      }

      if (filters.expiring_days) {
        whereConditions.push(`si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL ${parseInt(filters.expiring_days)} DAY)`);
      }

      if (filters.search) {
        const searchTerm = filters.search.replace(/'/g, "''");
        whereConditions.push(`(d.generic_name LIKE '%${searchTerm}%' OR d.brand_name LIKE '%${searchTerm}%' OR d.ndc LIKE '%${searchTerm}%' OR si.lot_number LIKE '%${searchTerm}%')`);
      }

      if (whereConditions.length > 0) {
        query += ' AND ' + whereConditions.join(' AND ');
      }

      const [rows] = await db.query(query);
      return rows[0].total;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Fill a prescription (subtract from inventory)
   * @param {number} inventoryId - Inventory ID
   * @param {number} quantity - Quantity to fill
   * @param {string} prescriptionNumber - Prescription reference number
   * @param {number} performedBy - User ID who performed the action
   * @param {string} reason - Optional reason
   * @returns {boolean} Success status
   */
  static async fillPrescription(inventoryId, quantity, prescriptionNumber, performedBy, reason = 'Prescription fill') {
    try {
      const inventory = await this.findById(inventoryId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      if (inventory.quantity_on_hand < quantity) {
        throw new Error('Insufficient inventory to fill prescription');
      }

      return await this.adjustStock(
        inventoryId, 
        -quantity, 
        reason, 
        performedBy, 
        'prescription_fill', 
        prescriptionNumber
      );
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Return medication to stock
   * @param {number} inventoryId - Inventory ID
   * @param {number} quantity - Quantity to return
   * @param {string} returnReason - Reason for return
   * @param {number} performedBy - User ID who performed the action
   * @param {string} referenceNumber - Optional reference number
   * @returns {boolean} Success status
   */
  static async returnToStock(inventoryId, quantity, returnReason, performedBy, referenceNumber = null) {
    try {
      return await this.adjustStock(
        inventoryId, 
        quantity, 
        returnReason, 
        performedBy, 
        'return_to_stock', 
        referenceNumber
      );
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Expire medication (remove from inventory)
   * @param {number} inventoryId - Inventory ID
   * @param {number} quantity - Quantity to expire
   * @param {string} reason - Reason for expiration
   * @param {number} performedBy - User ID who performed the action
   * @returns {boolean} Success status
   */
  static async expireMedication(inventoryId, quantity, reason, performedBy) {
    try {
      const inventory = await this.findById(inventoryId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      if (inventory.quantity_on_hand < quantity) {
        throw new Error('Cannot expire more than available quantity');
      }

      return await this.adjustStock(
        inventoryId, 
        -quantity, 
        reason, 
        performedBy, 
        'expire'
      );
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Perform inventory audit (reset to actual count)
   * @param {number} inventoryId - Inventory ID
   * @param {number} actualQuantity - Actual counted quantity
   * @param {string} reason - Audit reason
   * @param {number} performedBy - User ID who performed the action
   * @returns {boolean} Success status
   */
  static async auditInventory(inventoryId, actualQuantity, reason, performedBy) {
    try {
      const inventory = await this.findById(inventoryId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      const quantityBefore = inventory.quantity_on_hand;
      const adjustment = actualQuantity - quantityBefore;

      if (adjustment === 0) {
        // Still log audit even if no change
        await InventoryAuditLog.logTransaction({
          inventory_id: inventoryId,
          store_id: inventory.store_id,
          drug_id: inventory.drug_id,
          transaction_type: 'audit',
          quantity_change: 0,
          quantity_before: quantityBefore,
          quantity_after: actualQuantity,
          reason,
          performed_by: performedBy
        });
        return true;
      }

      // Update quantity directly to actual count
      const [result] = await db.execute(
        'UPDATE store_inventory SET quantity_on_hand = ? WHERE id = ?',
        [actualQuantity, inventoryId]
      );

      if (result.affectedRows > 0) {
        // Log the audit transaction
        await InventoryAuditLog.logTransaction({
          inventory_id: inventoryId,
          store_id: inventory.store_id,
          drug_id: inventory.drug_id,
          transaction_type: 'audit',
          quantity_change: adjustment,
          quantity_before: quantityBefore,
          quantity_after: actualQuantity,
          reason,
          performed_by: performedBy
        });
      }

      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = StoreInventory;