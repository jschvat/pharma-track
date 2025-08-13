const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class InventoryAuditLog {
  /**
   * Check if inventory item has initial_inventory entry
   * @param {number} inventoryId - Inventory ID
   * @returns {boolean} True if initial_inventory entry exists
   */
  static async hasInitialInventoryEntry(inventoryId) {
    try {
      const [rows] = await db.execute(`
        SELECT COUNT(*) as count
        FROM inventory_audit_log
        WHERE inventory_id = ? AND transaction_type = 'initial_inventory'
      `, [inventoryId]);
      
      return rows[0].count > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Ensure initial_inventory entry exists for inventory item
   * Creates one if it doesn't exist
   * @param {number} inventoryId - Inventory ID
   * @param {number} storeId - Store ID
   * @param {number} drugId - Drug ID
   * @param {number} currentQuantity - Current quantity on hand
   * @param {number} performedBy - User ID who performed the action
   * @returns {number|null} Log entry ID if created, null if already exists
   */
  static async ensureInitialInventoryEntry(inventoryId, storeId, drugId, currentQuantity, performedBy) {
    try {
      const hasInitial = await this.hasInitialInventoryEntry(inventoryId);
      
      if (!hasInitial) {
        // Create initial inventory entry
        return await this.logTransaction({
          inventory_id: inventoryId,
          store_id: storeId,
          drug_id: drugId,
          transaction_type: 'initial_inventory',
          quantity_change: currentQuantity,
          quantity_before: 0,
          quantity_after: currentQuantity,
          reason: 'Initial inventory baseline established',
          performed_by: performedBy
        });
      }
      
      return null; // Already exists
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Log an inventory transaction
   * Ensures initial_inventory entry exists before logging other transactions
   * @param {Object} logData - Audit log data
   * @returns {number} Log entry ID
   */
  static async logTransaction(logData) {
    try {
      const {
        inventory_id,
        store_id,
        drug_id,
        transaction_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reason,
        reference_number,
        performed_by
      } = logData;

      // For non-initial_inventory transactions, ensure initial_inventory entry exists
      if (transaction_type !== 'initial_inventory') {
        const hasInitial = await this.hasInitialInventoryEntry(inventory_id);
        if (!hasInitial) {
          // Find the earliest transaction date for this inventory, or use a date before any existing entries
          const [earliestTransaction] = await db.execute(`
            SELECT MIN(transaction_date) as earliest_date
            FROM inventory_audit_log
            WHERE inventory_id = ?
          `, [inventory_id]);
          
          let initialDate;
          if (earliestTransaction[0].earliest_date) {
            // Set initial_inventory date to 1 minute before the earliest existing transaction
            initialDate = new Date(new Date(earliestTransaction[0].earliest_date).getTime() - 60000);
          } else {
            // No existing transactions, use current time
            initialDate = new Date();
          }
          
          // Create initial_inventory entry with earlier timestamp
          const safeInitialParams = [
            inventory_id,
            store_id,
            drug_id,
            'initial_inventory',
            quantity_before, // Use quantity_before as the initial amount
            0,
            quantity_before,
            'Initial inventory baseline established (auto-created)',
            null, // reference_number
            performed_by,
            initialDate
          ];
          
          await db.execute(`
            INSERT INTO inventory_audit_log (
              inventory_id, store_id, drug_id, transaction_type, quantity_change,
              quantity_before, quantity_after, reason, reference_number, performed_by, transaction_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, safeInitialParams);
        }
      }

      // Ensure no undefined values are passed to the database
      const safeParams = [
        inventory_id,
        store_id,
        drug_id,
        transaction_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reason === undefined ? null : reason,
        reference_number === undefined ? null : reference_number,
        performed_by
      ];

      const [result] = await db.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change,
          quantity_before, quantity_after, reason, reference_number, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, safeParams);

      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get audit history for a specific inventory item
   * @param {number} inventoryId - Inventory ID
   * @param {number} limit - Maximum results
   * @param {number} offset - Results offset
   * @returns {Array} Audit log entries
   */
  static async getInventoryHistory(inventoryId, limit = 50, offset = 0) {
    try {
      // Sanitize parameters
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const offsetInt = Math.max(0, parseInt(offset) || 0);
      const inventoryIdInt = parseInt(inventoryId);

      const [rows] = await db.query(`
        SELECT 
          ial.*,
          u.name as performed_by_name,
          u.email as performed_by_email,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM inventory_audit_log ial
        INNER JOIN users u ON ial.performed_by = u.id
        INNER JOIN drugs d ON ial.drug_id = d.id
        WHERE ial.inventory_id = ${inventoryIdInt}
        ORDER BY ial.transaction_date DESC
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `);

      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get audit history for a specific drug across all stores
   * @param {number} drugId - Drug ID
   * @param {number} storeId - Optional store filter
   * @param {number} limit - Maximum results
   * @param {number} offset - Results offset
   * @returns {Array} Audit log entries
   */
  static async getDrugHistory(drugId, storeId = null, limit = 100, offset = 0) {
    try {
      // Sanitize parameters
      const drugIdInt = parseInt(drugId);
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const offsetInt = Math.max(0, parseInt(offset) || 0);
      
      let query = `
        SELECT 
          ial.*,
          u.name as performed_by_name,
          u.email as performed_by_email,
          s.name as store_name,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM inventory_audit_log ial
        INNER JOIN users u ON ial.performed_by = u.id
        INNER JOIN stores s ON ial.store_id = s.id
        INNER JOIN drugs d ON ial.drug_id = d.id
        WHERE ial.drug_id = ${drugIdInt}
      `;
      
      if (storeId) {
        query += ` AND ial.store_id = ${parseInt(storeId)}`;
      }
      
      query += ` ORDER BY ial.transaction_date DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get audit history for a store
   * @param {number} storeId - Store ID
   * @param {Object} filters - Optional filters
   * @param {number} limit - Maximum results
   * @param {number} offset - Results offset
   * @returns {Array} Audit log entries
   */
  static async getStoreHistory(storeId, filters = {}, limit = 100, offset = 0) {
    try {
      // Sanitize parameters
      const storeIdInt = parseInt(storeId);
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const offsetInt = Math.max(0, parseInt(offset) || 0);
      
      let whereConditions = [`ial.store_id = ${storeIdInt}`];
      
      if (filters.transaction_type) {
        whereConditions.push(`ial.transaction_type = '${filters.transaction_type.replace(/'/g, "''")}'`);
      }

      if (filters.drug_id) {
        whereConditions.push(`ial.drug_id = ${parseInt(filters.drug_id)}`);
      }

      if (filters.performed_by) {
        whereConditions.push(`ial.performed_by = ${parseInt(filters.performed_by)}`);
      }

      if (filters.date_from) {
        whereConditions.push(`ial.transaction_date >= '${filters.date_from}'`);
      }

      if (filters.date_to) {
        whereConditions.push(`ial.transaction_date <= '${filters.date_to}'`);
      }
      
      const query = `
        SELECT 
          ial.*,
          u.name as performed_by_name,
          u.email as performed_by_email,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM inventory_audit_log ial
        INNER JOIN users u ON ial.performed_by = u.id
        INNER JOIN drugs d ON ial.drug_id = d.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ial.transaction_date DESC 
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `;

      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get running total for a specific inventory item
   * @param {number} inventoryId - Inventory ID
   * @returns {Object} Running totals and current status
   */
  static async getRunningTotal(inventoryId) {
    try {
      const [summaryRows] = await db.execute(`
        SELECT 
          SUM(CASE WHEN transaction_type = 'prescription_fill' THEN quantity_change ELSE 0 END) as total_prescriptions,
          SUM(CASE WHEN transaction_type = 'return_to_stock' THEN quantity_change ELSE 0 END) as total_returns,
          SUM(CASE WHEN transaction_type = 'expire' THEN quantity_change ELSE 0 END) as total_expired,
          SUM(CASE WHEN transaction_type = 'audit' THEN quantity_change ELSE 0 END) as total_audits,
          SUM(CASE WHEN transaction_type = 'adjustment' THEN quantity_change ELSE 0 END) as total_adjustments,
          SUM(CASE WHEN transaction_type = 'initial_inventory' THEN quantity_change ELSE 0 END) as initial_inventory,
          SUM(quantity_change) as net_change,
          COUNT(*) as total_transactions,
          MAX(transaction_date) as last_transaction_date
        FROM inventory_audit_log
        WHERE inventory_id = ?
      `, [inventoryId]);

      const [currentStock] = await db.execute(`
        SELECT quantity_on_hand, last_updated
        FROM store_inventory
        WHERE id = ?
      `, [inventoryId]);

      return {
        summary: summaryRows[0],
        current_stock: currentStock[0] || null
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get transaction statistics for a store
   * @param {number} storeId - Store ID
   * @param {string} period - Time period ('day', 'week', 'month', 'year')
   * @returns {Object} Transaction statistics
   */
  static async getTransactionStats(storeId, period = 'month') {
    try {
      let dateFilter = '';
      switch (period) {
        case 'day':
          dateFilter = 'DATE(transaction_date) = CURDATE()';
          break;
        case 'week':
          dateFilter = 'transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateFilter = 'transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
          break;
        case 'year':
          dateFilter = 'transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
        default:
          dateFilter = '1=1';
      }

      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN transaction_type = 'prescription_fill' THEN 1 END) as prescription_fills,
          COUNT(CASE WHEN transaction_type = 'return_to_stock' THEN 1 END) as returns,
          COUNT(CASE WHEN transaction_type = 'expire' THEN 1 END) as expirations,
          COUNT(CASE WHEN transaction_type = 'audit' THEN 1 END) as audits,
          COUNT(CASE WHEN transaction_type = 'adjustment' THEN 1 END) as adjustments,
          SUM(ABS(quantity_change)) as total_quantity_moved,
          SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_additions,
          SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_subtractions,
          COUNT(DISTINCT drug_id) as unique_drugs_affected,
          COUNT(DISTINCT performed_by) as unique_users
        FROM inventory_audit_log
        WHERE store_id = ? AND ${dateFilter}
      `, [storeId]);

      return stats[0];
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Count audit entries with filters
   * @param {Object} filters - Search filters
   * @returns {number} Total count
   */
  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM inventory_audit_log WHERE 1=1';
      const params = [];

      if (filters.inventory_id) {
        query += ' AND inventory_id = ?';
        params.push(filters.inventory_id);
      }

      if (filters.store_id) {
        query += ' AND store_id = ?';
        params.push(filters.store_id);
      }

      if (filters.drug_id) {
        query += ' AND drug_id = ?';
        params.push(filters.drug_id);
      }

      if (filters.transaction_type) {
        query += ' AND transaction_type = ?';
        params.push(filters.transaction_type);
      }

      if (filters.date_from) {
        query += ' AND transaction_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND transaction_date <= ?';
        params.push(filters.date_to);
      }

      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get most recent transactions across all stores (admin only)
   * @param {number} limit - Maximum results
   * @returns {Array} Recent transactions
   */
  static async getRecentTransactions(limit = 20) {
    try {
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const [rows] = await db.query(`
        SELECT 
          ial.*,
          u.name as performed_by_name,
          s.name as store_name,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM inventory_audit_log ial
        INNER JOIN users u ON ial.performed_by = u.id
        INNER JOIN stores s ON ial.store_id = s.id
        INNER JOIN drugs d ON ial.drug_id = d.id
        ORDER BY ial.transaction_date DESC
        LIMIT ${limitInt}
      `);

      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get comprehensive NDC audit log for a specific store with running totals
   * @param {string} ndc - National Drug Code
   * @param {number} storeId - Store ID
   * @param {Object} options - Query options
   * @returns {Object} Comprehensive audit report
   */
  static async getNDCAuditReport(ndc, storeId, options = {}) {
    try {
      const {
        auditPointDate = null,
        restrictToFutureDate = null,
        includeInactive = false,
        limit = 1000,
        offset = 0
      } = options;

      // First, get the drug information
      const [drugRows] = await db.execute(`
        SELECT id, generic_name, brand_name, ndc, manufacturer_name, dosage_form
        FROM drugs 
        WHERE ndc = ?
      `, [ndc]);

      if (drugRows.length === 0) {
        throw new Error(`Drug with NDC ${ndc} not found`);
      }

      const drug = drugRows[0];

      // Get current inventory for this drug at the store
      const storeIdInt = parseInt(storeId);
      const ndcSafe = ndc.replace(/'/g, "''");
      
      let inventoryQuery = `
        SELECT si.*, d.generic_name, d.brand_name, d.ndc
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ${storeIdInt} AND d.ndc = '${ndcSafe}'
      `;
      
      if (!includeInactive) {
        inventoryQuery += ' AND si.is_active = TRUE';
      }

      const [inventoryRows] = await db.query(inventoryQuery);

      // Build the audit query with date filtering
      // Sanitize parameters
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 50, 1000));
      const offsetInt = Math.max(0, parseInt(offset) || 0);
      
      let auditQuery = `
        SELECT 
          ial.*,
          u.name as performed_by_name,
          u.email as performed_by_email,
          u.role as performed_by_role,
          si.selling_price as current_selling_price
        FROM inventory_audit_log ial
        INNER JOIN users u ON ial.performed_by = u.id
        INNER JOIN drugs d ON ial.drug_id = d.id
        LEFT JOIN store_inventory si ON ial.inventory_id = si.id
        WHERE ial.store_id = ${storeIdInt} AND d.ndc = '${ndcSafe}'
      `;

      // Add date filtering
      if (auditPointDate) {
        auditQuery += ` AND ial.transaction_date >= '${auditPointDate}'`;
      }

      if (restrictToFutureDate) {
        auditQuery += ` AND ial.transaction_date <= '${restrictToFutureDate}'`;
      }
      
      auditQuery += ` ORDER BY ial.transaction_date ASC, ial.id ASC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [auditRows] = await db.query(auditQuery);

      // Calculate running totals
      let runningTotal = 0;
      let totalPrescriptionFills = 0;
      let totalReturns = 0;
      let totalExpired = 0;
      let totalAudits = 0;
      let totalAdjustments = 0;

      // If audit point date is specified, get the baseline quantity at that point
      if (auditPointDate) {
        const [baselineRows] = await db.execute(`
          SELECT 
            COALESCE(SUM(quantity_change), 0) as baseline_total
          FROM inventory_audit_log ial
          INNER JOIN drugs d ON ial.drug_id = d.id
          WHERE ial.store_id = ? AND d.ndc = ? AND ial.transaction_date < ?
        `, [storeId, ndc, auditPointDate]);

        runningTotal = baselineRows[0]?.baseline_total || 0;
      }

      // Process each audit entry and calculate running totals
      const processedAuditEntries = auditRows.map(entry => {
        runningTotal += entry.quantity_change;

        // Track transaction type totals
        switch (entry.transaction_type) {
          case 'prescription_fill':
            totalPrescriptionFills += Math.abs(entry.quantity_change);
            break;
          case 'return_to_stock':
            totalReturns += entry.quantity_change;
            break;
          case 'expire':
            totalExpired += Math.abs(entry.quantity_change);
            break;
          case 'audit':
            totalAudits += Math.abs(entry.quantity_change);
            break;
          case 'adjustment':
          case 'initial_inventory':
            totalAdjustments += entry.quantity_change;
            break;
        }

        return {
          ...entry,
          running_total: runningTotal
        };
      });

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_audit_log ial
        INNER JOIN drugs d ON ial.drug_id = d.id
        WHERE ial.store_id = ${storeIdInt} AND d.ndc = '${ndcSafe}'
      `;

      if (auditPointDate) {
        countQuery += ` AND ial.transaction_date >= '${auditPointDate}'`;
      }

      if (restrictToFutureDate) {
        countQuery += ` AND ial.transaction_date <= '${restrictToFutureDate}'`;
      }

      const [countRows] = await db.query(countQuery);

      // Get store information
      const [storeRows] = await db.query(`
        SELECT name, address, state, zipcode, dea_registration_number, npi
        FROM stores
        WHERE id = ${storeIdInt}
      `);

      return {
        drug_info: drug,
        store_info: storeRows[0] || null,
        current_inventory: inventoryRows,
        audit_summary: {
          audit_point_date: auditPointDate,
          restriction_end_date: restrictToFutureDate,
          total_transactions: parseInt(countRows[0].total),
          final_running_total: runningTotal,
          transaction_breakdown: {
            prescription_fills: totalPrescriptionFills,
            returns_to_stock: totalReturns,
            expired_medications: totalExpired,
            audit_adjustments: totalAudits,
            other_adjustments: totalAdjustments
          }
        },
        audit_entries: processedAuditEntries,
        pagination: {
          limit,
          offset,
          total: parseInt(countRows[0].total),
          pages: Math.ceil(countRows[0].total / limit)
        },
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = InventoryAuditLog;