const db = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class StoreInventory {
  /**
   * Add drug to store inventory
   * @param {Object} inventoryData - Inventory data
   * @returns {number} Inventory ID
   */
  static async add(inventoryData) {
    try {
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

      const [result] = await db.execute(`
        INSERT INTO store_inventory (
          store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
          selling_price, lot_number, expiration_date, supplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
        selling_price, lot_number, expiration_date, supplier
      ]);

      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
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
   * Adjust stock (add or subtract)
   * @param {number} id - Inventory ID
   * @param {number} adjustment - Quantity adjustment (positive or negative)
   * @param {string} reason - Reason for adjustment
   * @returns {boolean} Success status
   */
  static async adjustStock(id, adjustment, reason = 'Manual adjustment') {
    try {
      const [result] = await db.execute(
        'UPDATE store_inventory SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?',
        [adjustment, id]
      );
      
      // TODO: Log the adjustment in an audit table
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get low stock items
   * @param {number} storeId - Store ID
   * @returns {Array} Low stock items
   */
  static async getLowStock(storeId) {
    try {
      const [rows] = await db.execute(`
        SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
               d.strength, d.manufacturer_name
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ? 
          AND si.is_active = TRUE 
          AND si.quantity_on_hand <= si.reorder_level
        ORDER BY (si.quantity_on_hand / NULLIF(si.reorder_level, 0)) ASC
      `, [storeId]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get expiring items
   * @param {number} storeId - Store ID
   * @param {number} days - Days until expiration
   * @returns {Array} Expiring items
   */
  static async getExpiring(storeId, days = 30) {
    try {
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
      `, [storeId, days]);
      
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
}

module.exports = StoreInventory;