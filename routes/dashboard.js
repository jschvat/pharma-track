const express = require('express');
const { authenticateToken, requireStoreAccess } = require('../middleware/auth');
const StoreInventory = require('../models/StoreInventory');
const InventoryAuditLog = require('../models/InventoryAuditLog');
const Drug = require('../models/Drug');
const Store = require('../models/Store');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/data:
 *   get:
 *     summary: Get consolidated dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidated dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     inventory_stats:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                         active_items:
 *                           type: integer
 *                         low_stock_items:
 *                           type: integer
 *                         expiring_items:
 *                           type: integer
 *                     low_stock:
 *                       type: array
 *                       items:
 *                         type: object
 *                     expiring:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recent_transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     drug_stats:
 *                       type: object
 *                     store_stats:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const isAdmin = user.role === 'admin' || user.role === 'god_mode';
    
    // Build consolidated query based on user role and store access
    const dashboardData = {
      inventory_stats: null,
      low_stock: [],
      expiring: [],
      recent_transactions: [],
      drug_stats: null,
      store_stats: null
    };

    // For users with store access, get store-specific data
    if (user.store_id) {
      // Single optimized query for all store inventory data
      const inventoryQuery = `
        SELECT 
          -- Inventory Stats
          COUNT(si.id) as total_items,
          COUNT(CASE WHEN si.is_active = 1 THEN 1 END) as active_items,
          COUNT(CASE WHEN si.is_active = 1 AND si.quantity_on_hand <= si.reorder_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN si.is_active = 1 AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_items
        FROM store_inventory si
        WHERE si.store_id = ?
      `;
      
      const [inventoryStatsRows] = await pool.execute(inventoryQuery, [user.store_id]);
      dashboardData.inventory_stats = inventoryStatsRows[0];

      // Get low stock items (limit 5)
      const lowStockQuery = `
        SELECT 
          si.id,
          si.quantity_on_hand,
          si.reorder_level,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ? 
          AND si.is_active = 1 
          AND si.quantity_on_hand <= si.reorder_level
        ORDER BY (si.quantity_on_hand / NULLIF(si.reorder_level, 0)) ASC
        LIMIT 5
      `;
      
      const [lowStockRows] = await pool.execute(lowStockQuery, [user.store_id]);
      dashboardData.low_stock = lowStockRows;

      // Get expiring items (limit 5)
      const expiringQuery = `
        SELECT 
          si.id,
          si.quantity_on_hand,
          si.expiration_date,
          DATEDIFF(si.expiration_date, CURDATE()) as days_until_expiration,
          d.generic_name,
          d.brand_name,
          d.ndc
        FROM store_inventory si
        INNER JOIN drugs d ON si.drug_id = d.id
        WHERE si.store_id = ? 
          AND si.is_active = 1 
          AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY si.expiration_date ASC
        LIMIT 5
      `;
      
      const [expiringRows] = await pool.execute(expiringQuery, [user.store_id]);
      dashboardData.expiring = expiringRows;

      // Get recent transactions for the store (limit 5)
      const transactionsQuery = `
        SELECT 
          ial.id,
          ial.transaction_date,
          ial.transaction_type,
          ial.quantity_change,
          ial.reason,
          ial.reference_number,
          d.generic_name,
          d.brand_name,
          d.ndc,
          u.name as performed_by_name,
          s.name as store_name
        FROM inventory_audit_log ial
        INNER JOIN drugs d ON ial.drug_id = d.id
        LEFT JOIN users u ON ial.performed_by = u.id
        LEFT JOIN stores s ON ial.store_id = s.id
        WHERE ial.store_id = ?
        ORDER BY ial.transaction_date DESC
        LIMIT 5
      `;
      
      const [transactionRows] = await pool.execute(transactionsQuery, [user.store_id]);
      dashboardData.recent_transactions = transactionRows;
    }

    // For admin users, get system-wide statistics
    if (isAdmin) {
      // Get drug statistics
      const drugStatsQuery = `
        SELECT 
          COUNT(*) as total_drugs,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_drugs
        FROM drugs
      `;
      
      const [drugStatsRows] = await pool.execute(drugStatsQuery);
      dashboardData.drug_stats = drugStatsRows[0];

      // Get store statistics
      const storeStatsQuery = `
        SELECT 
          COUNT(*) as total_stores,
          COUNT(DISTINCT state) as unique_states
        FROM stores
      `;
      
      const [storeStatsRows] = await pool.execute(storeStatsQuery);
      dashboardData.store_stats = storeStatsRows[0];

      // Get recent transactions across all stores (limit 10 for admin)
      if (!user.store_id) {
        const adminTransactionsQuery = `
          SELECT 
            ial.id,
            ial.transaction_date,
            ial.transaction_type,
            ial.quantity_change,
            ial.reason,
            ial.reference_number,
            d.generic_name,
            d.brand_name,
            d.ndc,
            u.name as performed_by_name,
            s.name as store_name
          FROM inventory_audit_log ial
          INNER JOIN drugs d ON ial.drug_id = d.id
          LEFT JOIN users u ON ial.performed_by = u.id
          LEFT JOIN stores s ON ial.store_id = s.id
          ORDER BY ial.transaction_date DESC
          LIMIT 10
        `;
        
        const [adminTransactionRows] = await pool.execute(adminTransactionsQuery);
        dashboardData.recent_transactions = adminTransactionRows;
      }
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
});

module.exports = router;