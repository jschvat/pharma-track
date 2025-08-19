/**
 * InventorySnapshotHistory Model
 * 
 * Manages historical inventory snapshots, maintaining the last 5 quantity changes
 * for each drug at each store with detailed transaction information.
 * 
 * Features:
 * - Maintains rolling history of last 5 snapshots per drug
 * - Tracks quantity changes with descriptions and references
 * - Automatic cleanup to maintain only 5 most recent records
 * - Integration with audit log and current snapshot systems
 * 
 * @class InventorySnapshotHistory
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class InventorySnapshotHistory {
  /**
   * Get the last N snapshots for a specific drug at a store
   * @param {number} storeId - Store ID
   * @param {number} drugId - Drug ID  
   * @param {number} limit - Number of snapshots to retrieve (default: 5, max: 10)
   * @returns {Array} Array of snapshot history records
   */
  static async getLastSnapshots(storeId, drugId, limit = 5) {
    try {
      // Sanitize limit to prevent abuse
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 5, 10));
      
      const [rows] = await db.execute(`
        SELECT 
          ssh.id,
          ssh.snapshot_date,
          ssh.quantity_on_hand,
          ssh.quantity_change,
          ssh.transaction_type,
          ssh.transaction_description,
          ssh.reference_number,
          ssh.performed_by,
          u.name as performed_by_name,
          CASE 
            WHEN ssh.quantity_change > 0 THEN 'increase'
            WHEN ssh.quantity_change < 0 THEN 'decrease'
            ELSE 'no_change'
          END as change_direction,
          ABS(ssh.quantity_change) as change_amount
        FROM store_inventory_snapshot_history ssh
        LEFT JOIN users u ON ssh.performed_by = u.id
        WHERE ssh.store_id = ? AND ssh.drug_id = ?
        ORDER BY ssh.snapshot_date DESC
        LIMIT ${limitInt}
      `, [storeId, drugId]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get snapshot history for multiple drugs at a store
   * @param {number} storeId - Store ID
   * @param {Array} drugIds - Array of drug IDs (optional, gets all if not provided)
   * @param {number} limit - Number of snapshots per drug (default: 5)
   * @returns {Object} Object with drugId as key and array of snapshots as value
   */
  static async getMultipleDrugsHistory(storeId, drugIds = null, limit = 5) {
    try {
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 5, 10));
      
      let query = `
        SELECT 
          ssh.drug_id,
          d.ndc,
          d.generic_name,
          d.brand_name,
          ssh.snapshot_date,
          ssh.quantity_on_hand,
          ssh.quantity_change,
          ssh.transaction_type,
          ssh.transaction_description,
          ssh.reference_number,
          u.name as performed_by_name,
          ROW_NUMBER() OVER (
            PARTITION BY ssh.drug_id 
            ORDER BY ssh.snapshot_date DESC
          ) as rank_num
        FROM store_inventory_snapshot_history ssh
        INNER JOIN drugs d ON ssh.drug_id = d.id
        LEFT JOIN users u ON ssh.performed_by = u.id
        WHERE ssh.store_id = ?
      `;
      
      const params = [storeId];
      
      if (drugIds && Array.isArray(drugIds) && drugIds.length > 0) {
        const placeholders = drugIds.map(() => '?').join(',');
        query += ` AND ssh.drug_id IN (${placeholders})`;
        params.push(...drugIds);
      }
      
      query += `
        HAVING rank_num <= ${limitInt}
        ORDER BY ssh.drug_id, ssh.snapshot_date DESC
      `;
      
      const [rows] = await db.execute(query, params);
      
      // Group by drug_id
      const result = {};
      rows.forEach(row => {
        if (!result[row.drug_id]) {
          result[row.drug_id] = {
            drug_info: {
              ndc: row.ndc,
              generic_name: row.generic_name,
              brand_name: row.brand_name
            },
            snapshots: []
          };
        }
        
        result[row.drug_id].snapshots.push({
          snapshot_date: row.snapshot_date,
          quantity_on_hand: row.quantity_on_hand,
          quantity_change: row.quantity_change,
          transaction_type: row.transaction_type,
          transaction_description: row.transaction_description,
          reference_number: row.reference_number,
          performed_by_name: row.performed_by_name
        });
      });
      
      return result;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Add a new snapshot to history
   * This is typically called automatically by database triggers
   * @param {Object} snapshotData - Snapshot data
   * @returns {number} Snapshot history ID
   */
  static async addSnapshot(snapshotData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        store_id,
        drug_id,
        quantity_on_hand,
        quantity_change,
        transaction_id,
        transaction_type,
        transaction_description,
        performed_by,
        reference_number
      } = snapshotData;
      
      // Add new snapshot
      const [result] = await connection.execute(`
        INSERT INTO store_inventory_snapshot_history (
          store_id, drug_id, quantity_on_hand, quantity_change,
          transaction_id, transaction_type, transaction_description,
          performed_by, reference_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        store_id, drug_id, quantity_on_hand, quantity_change,
        transaction_id, transaction_type, transaction_description,
        performed_by, reference_number
      ]);
      
      const snapshotId = result.insertId;
      
      // Maintain only last 5 records per store/drug combination
      await connection.execute(`
        DELETE FROM store_inventory_snapshot_history 
        WHERE store_id = ? AND drug_id = ? 
          AND id NOT IN (
            SELECT id FROM (
              SELECT id 
              FROM store_inventory_snapshot_history 
              WHERE store_id = ? AND drug_id = ?
              ORDER BY snapshot_date DESC 
              LIMIT 5
            ) as keep_records
          )
      `, [store_id, drug_id, store_id, drug_id]);
      
      await connection.commit();
      return snapshotId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get summary statistics for inventory changes over time
   * @param {number} storeId - Store ID
   * @param {number} drugId - Drug ID (optional)
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Object} Summary statistics
   */
  static async getChangeSummary(storeId, drugId = null, days = 30) {
    try {
      const daysInt = Math.max(1, Math.min(parseInt(days) || 30, 365));
      
      let query = `
        SELECT 
          COUNT(*) as total_changes,
          SUM(CASE WHEN quantity_change > 0 THEN 1 ELSE 0 END) as increases,
          SUM(CASE WHEN quantity_change < 0 THEN 1 ELSE 0 END) as decreases,
          SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_added,
          SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_removed,
          AVG(ABS(quantity_change)) as avg_change_size,
          MAX(quantity_on_hand) as max_quantity,
          MIN(quantity_on_hand) as min_quantity,
          -- Transaction type breakdown
          SUM(CASE WHEN transaction_type = 'prescription_fill' THEN 1 ELSE 0 END) as prescription_fills,
          SUM(CASE WHEN transaction_type = 'shipment_received' THEN 1 ELSE 0 END) as shipments_received,
          SUM(CASE WHEN transaction_type = 'return_to_stock' THEN 1 ELSE 0 END) as returns,
          SUM(CASE WHEN transaction_type = 'expire' THEN 1 ELSE 0 END) as expirations,
          SUM(CASE WHEN transaction_type = 'audit' THEN 1 ELSE 0 END) as audits
        FROM store_inventory_snapshot_history
        WHERE store_id = ?
          AND snapshot_date >= DATE_SUB(NOW(), INTERVAL ${daysInt} DAY)
      `;
      
      const params = [storeId];
      
      if (drugId) {
        query += ' AND drug_id = ?';
        params.push(drugId);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0] || {};
      
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get most active drugs (most transactions) for a store
   * @param {number} storeId - Store ID
   * @param {number} days - Number of days to look back (default: 30)
   * @param {number} limit - Number of drugs to return (default: 10)
   * @returns {Array} Array of drugs with transaction counts
   */
  static async getMostActiveDrugs(storeId, days = 30, limit = 10) {
    try {
      const daysInt = Math.max(1, Math.min(parseInt(days) || 30, 365));
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 10, 50));
      
      const [rows] = await db.execute(`
        SELECT 
          ssh.drug_id,
          d.ndc,
          d.generic_name,
          d.brand_name,
          d.dosage_form,
          COUNT(*) as transaction_count,
          SUM(CASE WHEN ssh.quantity_change > 0 THEN ssh.quantity_change ELSE 0 END) as total_added,
          SUM(CASE WHEN ssh.quantity_change < 0 THEN ABS(ssh.quantity_change) ELSE 0 END) as total_removed,
          AVG(ABS(ssh.quantity_change)) as avg_change_size,
          MAX(ssh.snapshot_date) as last_transaction_date
        FROM store_inventory_snapshot_history ssh
        INNER JOIN drugs d ON ssh.drug_id = d.id
        WHERE ssh.store_id = ?
          AND ssh.snapshot_date >= DATE_SUB(NOW(), INTERVAL ${daysInt} DAY)
        GROUP BY ssh.drug_id, d.ndc, d.generic_name, d.brand_name, d.dosage_form
        ORDER BY transaction_count DESC
        LIMIT ${limitInt}
      `, [storeId]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get snapshots by transaction type
   * @param {number} storeId - Store ID
   * @param {string} transactionType - Transaction type to filter by
   * @param {number} limit - Number of records to return (default: 50)
   * @returns {Array} Array of snapshots for the specified transaction type
   */
  static async getByTransactionType(storeId, transactionType, limit = 50) {
    try {
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 200));
      
      const [rows] = await db.execute(`
        SELECT 
          ssh.id,
          ssh.drug_id,
          d.ndc,
          d.generic_name,
          d.brand_name,
          ssh.snapshot_date,
          ssh.quantity_on_hand,
          ssh.quantity_change,
          ssh.transaction_description,
          ssh.reference_number,
          u.name as performed_by_name
        FROM store_inventory_snapshot_history ssh
        INNER JOIN drugs d ON ssh.drug_id = d.id
        LEFT JOIN users u ON ssh.performed_by = u.id
        WHERE ssh.store_id = ? AND ssh.transaction_type = ?
        ORDER BY ssh.snapshot_date DESC
        LIMIT ${limitInt}
      `, [storeId, transactionType]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Clean up old history records beyond the configured limit
   * This is typically called by a scheduled maintenance job
   * @param {number} keepLast - Number of records to keep per drug (default: 5)
   * @returns {number} Number of records deleted
   */
  static async cleanupOldRecords(keepLast = 5) {
    try {
      const keepInt = Math.max(1, Math.min(parseInt(keepLast) || 5, 20));
      
      const [result] = await db.execute(`
        DELETE ssh1 FROM store_inventory_snapshot_history ssh1
        WHERE ssh1.id NOT IN (
          SELECT id FROM (
            SELECT ssh2.id
            FROM store_inventory_snapshot_history ssh2
            WHERE ssh2.store_id = ssh1.store_id 
              AND ssh2.drug_id = ssh1.drug_id
            ORDER BY ssh2.snapshot_date DESC
            LIMIT ${keepInt}
          ) as keep_records
        )
      `);
      
      return result.affectedRows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = InventorySnapshotHistory;