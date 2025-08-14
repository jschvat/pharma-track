/**
 * Inventory Transaction Helper
 * 
 * Provides atomic transaction management for inventory operations.
 * Ensures that both audit log and inventory snapshot are updated
 * together or not at all.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool } = require('../config/database');
const InventorySnapshot = require('../models/InventorySnapshot');

class InventoryTransactionHelper {
    
    /**
     * Execute an inventory transaction with atomic audit log and snapshot updates
     * @param {Object} transactionData - Transaction details
     * @param {number} transactionData.inventoryId - Store inventory record ID
     * @param {number} transactionData.storeId - Store ID
     * @param {number} transactionData.drugId - Drug ID
     * @param {string} transactionData.transactionType - Type of transaction
     * @param {number} transactionData.quantityChange - Quantity change (positive/negative)
     * @param {number} transactionData.quantityBefore - Quantity before transaction
     * @param {number} transactionData.quantityAfter - Quantity after transaction
     * @param {string} transactionData.reason - Reason for transaction
     * @param {string} transactionData.referenceNumber - Reference number
     * @param {number} transactionData.performedBy - User ID who performed transaction
     * @returns {Promise<Object>} Transaction result with audit log ID
     */
    static async executeInventoryTransaction(transactionData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                inventoryId,
                storeId,
                drugId,
                transactionType,
                quantityChange,
                quantityBefore,
                quantityAfter,
                reason,
                referenceNumber,
                performedBy
            } = transactionData;
            
            // Validate input data
            this.validateTransactionData(transactionData);
            
            // 1. Insert into audit log
            const [auditResult] = await connection.execute(`
                INSERT INTO inventory_audit_log (
                    inventory_id, store_id, drug_id, transaction_type,
                    quantity_change, quantity_before, quantity_after,
                    reason, reference_number, performed_by, transaction_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                inventoryId, storeId, drugId, transactionType,
                quantityChange, quantityBefore, quantityAfter,
                reason, referenceNumber, performedBy
            ]);
            
            const auditLogId = auditResult.insertId;
            
            // 2. Update store_inventory table
            await connection.execute(`
                UPDATE store_inventory 
                SET quantity_on_hand = ?, last_updated = NOW()
                WHERE id = ?
            `, [quantityAfter, inventoryId]);
            
            // 3. Update inventory snapshot manually (stored procedure alternative)
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
            `, [storeId, drugId, quantityChange, auditLogId, transactionType, performedBy,
                quantityChange, auditLogId, transactionType, performedBy]);
            
            await connection.commit();
            
            return {
                success: true,
                auditLogId,
                message: 'Inventory transaction completed successfully',
                transactionType,
                quantityChange,
                quantityAfter
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Inventory transaction failed:', error);
            throw new Error(`Inventory transaction failed: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Execute multiple inventory transactions atomically
     * @param {Array} transactions - Array of transaction data objects
     * @returns {Promise<Object>} Combined transaction result
     */
    static async executeMultipleTransactions(transactions) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const results = [];
            
            for (const transactionData of transactions) {
                this.validateTransactionData(transactionData);
                
                const {
                    inventoryId, storeId, drugId, transactionType,
                    quantityChange, quantityBefore, quantityAfter,
                    reason, referenceNumber, performedBy
                } = transactionData;
                
                // Insert audit log entry
                const [auditResult] = await connection.execute(`
                    INSERT INTO inventory_audit_log (
                        inventory_id, store_id, drug_id, transaction_type,
                        quantity_change, quantity_before, quantity_after,
                        reason, reference_number, performed_by, transaction_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    inventoryId, storeId, drugId, transactionType,
                    quantityChange, quantityBefore, quantityAfter,
                    reason, referenceNumber, performedBy
                ]);
                
                const auditLogId = auditResult.insertId;
                
                // Update store_inventory
                await connection.execute(`
                    UPDATE store_inventory 
                    SET quantity_on_hand = ?, last_updated = NOW()
                    WHERE id = ?
                `, [quantityAfter, inventoryId]);
                
                // Update snapshot manually
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
                `, [storeId, drugId, quantityChange, auditLogId, transactionType, performedBy,
                    quantityChange, auditLogId, transactionType, performedBy]);
                
                results.push({
                    auditLogId,
                    inventoryId,
                    transactionType,
                    quantityChange
                });
            }
            
            await connection.commit();
            
            return {
                success: true,
                transactions: results,
                message: `Successfully processed ${results.length} inventory transactions`
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Multiple inventory transactions failed:', error);
            throw new Error(`Batch inventory transaction failed: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Create initial inventory record with snapshot
     * @param {Object} inventoryData - Initial inventory data
     * @returns {Promise<Object>} Creation result
     */
    static async createInitialInventory(inventoryData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                storeId, drugId, initialQuantity, unitCost, sellingPrice,
                lotNumber, expirationDate, supplier, performedBy,
                reason = 'Initial inventory setup'
            } = inventoryData;
            
            // 1. Create store_inventory record
            const [inventoryResult] = await connection.execute(`
                INSERT INTO store_inventory (
                    store_id, drug_id, quantity_on_hand, unit_cost, selling_price,
                    lot_number, expiration_date, supplier, is_active, date_created
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
            `, [storeId, drugId, initialQuantity, unitCost, sellingPrice, lotNumber, expirationDate, supplier]);
            
            const inventoryId = inventoryResult.insertId;
            
            // 2. Create audit log entry
            const [auditResult] = await connection.execute(`
                INSERT INTO inventory_audit_log (
                    inventory_id, store_id, drug_id, transaction_type,
                    quantity_change, quantity_before, quantity_after,
                    reason, reference_number, performed_by, transaction_date
                ) VALUES (?, ?, ?, 'initial_inventory', ?, 0, ?, ?, ?, ?, NOW())
            `, [inventoryId, storeId, drugId, initialQuantity, initialQuantity, reason, lotNumber, performedBy]);
            
            const auditLogId = auditResult.insertId;
            
            // 3. Create/update snapshot manually
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
            `, [storeId, drugId, initialQuantity, auditLogId, 'initial_inventory', performedBy,
                initialQuantity, auditLogId, 'initial_inventory', performedBy]);
            
            await connection.commit();
            
            return {
                success: true,
                inventoryId,
                auditLogId,
                message: 'Initial inventory created successfully'
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Initial inventory creation failed:', error);
            throw new Error(`Failed to create initial inventory: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Perform inventory audit/adjustment
     * @param {Object} auditData - Audit data
     * @returns {Promise<Object>} Audit result
     */
    static async performInventoryAudit(auditData) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                inventoryId, storeId, drugId, actualQuantity,
                performedBy, reason = 'Inventory audit',
                referenceNumber
            } = auditData;
            
            // Get current quantity
            const [currentInventory] = await connection.execute(
                'SELECT quantity_on_hand FROM store_inventory WHERE id = ?',
                [inventoryId]
            );
            
            if (currentInventory.length === 0) {
                throw new Error('Inventory record not found');
            }
            
            const currentQuantity = currentInventory[0].quantity_on_hand;
            const quantityChange = actualQuantity - currentQuantity;
            
            // Only proceed if there's a difference
            if (quantityChange !== 0) {
                // Execute the transaction
                const result = await this.executeInventoryTransaction({
                    inventoryId,
                    storeId,
                    drugId,
                    transactionType: 'audit',
                    quantityChange,
                    quantityBefore: currentQuantity,
                    quantityAfter: actualQuantity,
                    reason,
                    referenceNumber,
                    performedBy
                });
                
                await connection.commit();
                
                return {
                    ...result,
                    auditDifference: quantityChange,
                    previousQuantity: currentQuantity,
                    adjustedQuantity: actualQuantity
                };
            } else {
                await connection.commit();
                
                return {
                    success: true,
                    message: 'No adjustment needed - quantities match',
                    auditDifference: 0,
                    currentQuantity
                };
            }
            
        } catch (error) {
            await connection.rollback();
            console.error('Inventory audit failed:', error);
            throw new Error(`Inventory audit failed: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Validate transaction data
     * @param {Object} transactionData - Transaction data to validate
     * @throws {Error} If validation fails
     */
    static validateTransactionData(transactionData) {
        const required = [
            'inventoryId', 'storeId', 'drugId', 'transactionType',
            'quantityChange', 'quantityBefore', 'quantityAfter', 'performedBy'
        ];
        
        for (const field of required) {
            if (transactionData[field] === undefined || transactionData[field] === null) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Validate transaction type
        const validTypes = [
            'prescription_fill', 'return_to_stock', 'expire', 'audit',
            'shipment_received', 'initial_inventory'
        ];
        
        if (!validTypes.includes(transactionData.transactionType)) {
            throw new Error(`Invalid transaction type: ${transactionData.transactionType}`);
        }
        
        // Validate quantity calculations
        const { quantityBefore, quantityChange, quantityAfter } = transactionData;
        if (quantityBefore + quantityChange !== quantityAfter) {
            throw new Error('Quantity calculation mismatch: before + change != after');
        }
        
        // Validate non-negative final quantity
        if (quantityAfter < 0) {
            throw new Error('Final quantity cannot be negative');
        }
    }
    
    /**
     * Get transaction history for a drug/store combination
     * @param {number} storeId - Store ID
     * @param {number} drugId - Drug ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Transaction history
     */
    static async getTransactionHistory(storeId, drugId, options = {}) {
        try {
            const { limit = 50, offset = 0, startDate = null, endDate = null } = options;
            
            let query = `
                SELECT 
                    ial.*,
                    u.name as performed_by_name,
                    d.generic_name,
                    d.ndc
                FROM inventory_audit_log ial
                INNER JOIN users u ON ial.performed_by = u.id
                INNER JOIN drugs d ON ial.drug_id = d.id
                WHERE ial.store_id = ? AND ial.drug_id = ?
            `;
            
            const params = [storeId, drugId];
            
            if (startDate) {
                query += ' AND ial.transaction_date >= ?';
                params.push(startDate);
            }
            
            if (endDate) {
                query += ' AND ial.transaction_date <= ?';
                params.push(endDate);
            }
            
            query += ` ORDER BY ial.transaction_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            throw new Error('Failed to fetch transaction history');
        }
    }
}

module.exports = InventoryTransactionHelper;