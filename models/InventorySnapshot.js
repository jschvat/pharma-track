/**
 * Inventory Snapshot Model
 * 
 * Manages the store_inventory_snapshot table which maintains real-time
 * current on-hand inventory quantities per store/drug combination.
 * This table is automatically updated by all inventory transactions.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool } = require('../config/database');

class InventorySnapshot {
    
    /**
     * Get current inventory for a specific store
     * @param {number} storeId - Store ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Current inventory records
     */
    static async getByStore(storeId, options = {}) {
        try {
            const {
                includeZeroQuantity = false,
                drugId = null,
                orderBy = 'generic_name',
                orderDirection = 'ASC',
                limit = null,
                offset = 0
            } = options;
            
            let query = `
                SELECT 
                    sis.*,
                    d.ndc,
                    d.generic_name,
                    d.brand_name,
                    d.dosage_form,
                    d.strength,
                    d.manufacturer_name,
                    u.name as last_updated_by_name,
                    s.name as store_name
                FROM store_inventory_snapshot sis
                INNER JOIN drugs d ON sis.drug_id = d.id
                INNER JOIN stores s ON sis.store_id = s.id
                LEFT JOIN users u ON sis.last_updated_by = u.id
                WHERE sis.store_id = ?
            `;
            
            const params = [storeId];
            
            // Filter by drug if specified
            if (drugId) {
                query += ' AND sis.drug_id = ?';
                params.push(drugId);
            }
            
            // Filter out zero quantities if requested
            if (!includeZeroQuantity) {
                query += ' AND sis.quantity_on_hand > 0';
            }
            
            // Add ordering
            const validOrderFields = ['generic_name', 'brand_name', 'quantity_on_hand', 'last_transaction_date', 'ndc'];
            const orderField = validOrderFields.includes(orderBy) ? orderBy : 'generic_name';
            const direction = orderDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            
            if (orderField === 'generic_name' || orderField === 'brand_name') {
                query += ` ORDER BY d.${orderField} ${direction}`;
            } else {
                query += ` ORDER BY sis.${orderField} ${direction}`;
            }
            
            // Add pagination
            if (limit) {
                query += ' LIMIT ? OFFSET ?';
                params.push(limit, offset);
            }
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('Error fetching inventory snapshot by store:', error);
            throw new Error('Failed to fetch current inventory data');
        }
    }
    
    /**
     * Get current inventory for a specific drug across all stores
     * @param {number} drugId - Drug ID
     * @returns {Promise<Array>} Current inventory records
     */
    static async getByDrug(drugId) {
        try {
            const query = `
                SELECT 
                    sis.*,
                    s.name as store_name,
                    s.address as store_address,
                    d.ndc,
                    d.generic_name,
                    d.brand_name,
                    u.name as last_updated_by_name
                FROM store_inventory_snapshot sis
                INNER JOIN stores s ON sis.store_id = s.id
                INNER JOIN drugs d ON sis.drug_id = d.id
                LEFT JOIN users u ON sis.last_updated_by = u.id
                WHERE sis.drug_id = ?
                ORDER BY s.name ASC
            `;
            
            const [rows] = await pool.execute(query, [drugId]);
            return rows;
            
        } catch (error) {
            console.error('Error fetching inventory snapshot by drug:', error);
            throw new Error('Failed to fetch drug inventory data');
        }
    }
    
    /**
     * Get low stock items for a store
     * @param {number} storeId - Store ID
     * @param {number} threshold - Quantity threshold (default: 10)
     * @returns {Promise<Array>} Low stock items
     */
    static async getLowStock(storeId, threshold = 10) {
        try {
            const query = `
                SELECT 
                    sis.*,
                    d.ndc,
                    d.generic_name,
                    d.brand_name,
                    d.dosage_form,
                    d.strength,
                    si.reorder_level,
                    u.name as last_updated_by_name
                FROM store_inventory_snapshot sis
                INNER JOIN drugs d ON sis.drug_id = d.id
                LEFT JOIN users u ON sis.last_updated_by = u.id
                LEFT JOIN (
                    SELECT store_id, drug_id, MIN(reorder_level) as reorder_level
                    FROM store_inventory 
                    WHERE is_active = TRUE
                    GROUP BY store_id, drug_id
                ) si ON sis.store_id = si.store_id AND sis.drug_id = si.drug_id
                WHERE sis.store_id = ? 
                    AND (sis.quantity_on_hand <= ? OR 
                         (si.reorder_level IS NOT NULL AND sis.quantity_on_hand <= si.reorder_level))
                ORDER BY sis.quantity_on_hand ASC, d.generic_name ASC
            `;
            
            const [rows] = await pool.execute(query, [storeId, threshold]);
            return rows;
            
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            throw new Error('Failed to fetch low stock data');
        }
    }
    
    /**
     * Get out of stock items for a store
     * @param {number} storeId - Store ID
     * @returns {Promise<Array>} Out of stock items
     */
    static async getOutOfStock(storeId) {
        try {
            const query = `
                SELECT 
                    sis.*,
                    d.ndc,
                    d.generic_name,
                    d.brand_name,
                    d.dosage_form,
                    d.strength,
                    u.name as last_updated_by_name
                FROM store_inventory_snapshot sis
                INNER JOIN drugs d ON sis.drug_id = d.id
                LEFT JOIN users u ON sis.last_updated_by = u.id
                WHERE sis.store_id = ? AND sis.quantity_on_hand <= 0
                ORDER BY sis.last_transaction_date DESC, d.generic_name ASC
            `;
            
            const [rows] = await pool.execute(query, [storeId]);
            return rows;
            
        } catch (error) {
            console.error('Error fetching out of stock items:', error);
            throw new Error('Failed to fetch out of stock data');
        }
    }
    
    /**
     * Update inventory snapshot (usually called automatically by transactions)
     * @param {number} storeId - Store ID
     * @param {number} drugId - Drug ID  
     * @param {number} quantityChange - Change in quantity (positive or negative)
     * @param {number} transactionId - Audit log transaction ID
     * @param {string} transactionType - Type of transaction
     * @param {number} userId - User who performed the transaction
     * @returns {Promise<void>}
     */
    static async updateSnapshot(storeId, drugId, quantityChange, transactionId, transactionType, userId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Update inventory snapshot manually (stored procedure alternative)
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
            `, [storeId, drugId, quantityChange, transactionId, transactionType, userId,
                quantityChange, transactionId, transactionType, userId]);
            
            await connection.commit();
            
        } catch (error) {
            await connection.rollback();
            console.error('Error updating inventory snapshot:', error);
            throw new Error('Failed to update inventory snapshot');
        } finally {
            connection.release();
        }
    }
    
    /**
     * Set absolute quantity for a store/drug combination
     * @param {number} storeId - Store ID
     * @param {number} drugId - Drug ID
     * @param {number} absoluteQuantity - New absolute quantity
     * @param {number} transactionId - Audit log transaction ID
     * @param {string} transactionType - Type of transaction
     * @param {number} userId - User who performed the transaction
     * @returns {Promise<void>}
     */
    static async setAbsoluteQuantity(storeId, drugId, absoluteQuantity, transactionId, transactionType, userId) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Insert or update with absolute quantity
            await connection.execute(`
                INSERT INTO store_inventory_snapshot (
                    store_id, drug_id, quantity_on_hand, last_transaction_id,
                    last_transaction_date, last_transaction_type, last_updated_by
                ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
                ON DUPLICATE KEY UPDATE
                    quantity_on_hand = VALUES(quantity_on_hand),
                    last_transaction_id = VALUES(last_transaction_id),
                    last_transaction_date = VALUES(last_transaction_date),
                    last_transaction_type = VALUES(last_transaction_type),
                    last_updated_by = VALUES(last_updated_by),
                    updated_at = CURRENT_TIMESTAMP
            `, [storeId, drugId, absoluteQuantity, transactionId, transactionType, userId]);
            
            await connection.commit();
            
        } catch (error) {
            await connection.rollback();
            console.error('Error setting absolute quantity in snapshot:', error);
            throw new Error('Failed to set inventory quantity');
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get inventory statistics for a store
     * @param {number} storeId - Store ID
     * @returns {Promise<Object>} Inventory statistics
     */
    static async getStoreStats(storeId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_drugs,
                    SUM(CASE WHEN quantity_on_hand > 0 THEN 1 ELSE 0 END) as in_stock_count,
                    SUM(CASE WHEN quantity_on_hand = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                    SUM(CASE WHEN quantity_on_hand <= 10 AND quantity_on_hand > 0 THEN 1 ELSE 0 END) as low_stock_count,
                    SUM(quantity_on_hand) as total_quantity,
                    AVG(quantity_on_hand) as avg_quantity,
                    MAX(last_transaction_date) as last_activity
                FROM store_inventory_snapshot
                WHERE store_id = ?
            `;
            
            const [rows] = await pool.execute(query, [storeId]);
            return rows[0] || {};
            
        } catch (error) {
            console.error('Error fetching store inventory statistics:', error);
            throw new Error('Failed to fetch inventory statistics');
        }
    }
    
    /**
     * Search inventory by drug name or NDC
     * @param {number} storeId - Store ID
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    static async search(storeId, searchTerm, options = {}) {
        try {
            const { includeZeroQuantity = false, limit = 50 } = options;
            
            let query = `
                SELECT 
                    sis.*,
                    d.ndc,
                    d.generic_name,
                    d.brand_name,
                    d.dosage_form,
                    d.strength,
                    d.manufacturer_name,
                    u.name as last_updated_by_name
                FROM store_inventory_snapshot sis
                INNER JOIN drugs d ON sis.drug_id = d.id
                LEFT JOIN users u ON sis.last_updated_by = u.id
                WHERE sis.store_id = ?
                    AND (d.ndc LIKE ? OR 
                         d.generic_name LIKE ? OR 
                         d.brand_name LIKE ? OR
                         d.manufacturer_name LIKE ?)
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const params = [storeId, searchPattern, searchPattern, searchPattern, searchPattern];
            
            if (!includeZeroQuantity) {
                query += ' AND sis.quantity_on_hand > 0';
            }
            
            query += ' ORDER BY d.generic_name ASC LIMIT ?';
            params.push(limit);
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('Error searching inventory:', error);
            throw new Error('Failed to search inventory');
        }
    }
}

module.exports = InventorySnapshot;