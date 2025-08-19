/**
 * Inventory Snapshot History Routes
 * 
 * API endpoints for managing and querying historical inventory snapshots.
 * Provides access to the last 5 snapshots per drug with detailed transaction information.
 * 
 * Features:
 * - Get snapshot history for specific drugs
 * - Bulk history retrieval for multiple drugs
 * - Transaction type filtering and analysis
 * - Summary statistics and reporting
 * - Most active drugs analysis
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const InventorySnapshotHistory = require('../models/InventorySnapshotHistory');
const { authenticateUser, requireStoreAccess } = require('../middleware/auth');
const { query, param, validationResult } = require('express-validator');

/**
 * GET /api/inventory-snapshot-history/store/:storeId/drug/:drugId
 * Get last N snapshots for a specific drug at a store
 */
router.get('/store/:storeId/drug/:drugId', 
  authenticateUser,
  requireStoreAccess,
  [
    param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
    param('drugId').isInt({ min: 1 }).withMessage('Valid drug ID required'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { storeId, drugId } = req.params;
      const { limit = 5 } = req.query;

      const snapshots = await InventorySnapshotHistory.getLastSnapshots(
        parseInt(storeId), 
        parseInt(drugId), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          storeId: parseInt(storeId),
          drugId: parseInt(drugId),
          limit: parseInt(limit),
          snapshots
        }
      });
    } catch (error) {
      console.error('Error fetching snapshot history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch snapshot history'
      });
    }
  }
);

/**
 * GET /api/inventory-snapshot-history/store/:storeId/bulk
 * Get snapshot history for multiple drugs at a store
 */
router.get('/store/:storeId/bulk',
  authenticateUser,
  requireStoreAccess,
  [
    param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
    query('drugIds').optional().custom((value) => {
      if (value) {
        const ids = value.split(',').map(id => parseInt(id.trim()));
        if (ids.some(id => isNaN(id) || id < 1)) {
          throw new Error('All drug IDs must be valid positive integers');
        }
        if (ids.length > 50) {
          throw new Error('Maximum 50 drug IDs allowed');
        }
      }
      return true;
    }),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { storeId } = req.params;
      const { drugIds, limit = 5 } = req.query;

      let drugIdArray = null;
      if (drugIds) {
        drugIdArray = drugIds.split(',').map(id => parseInt(id.trim()));
      }

      const history = await InventorySnapshotHistory.getMultipleDrugsHistory(
        parseInt(storeId),
        drugIdArray,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          storeId: parseInt(storeId),
          drugIds: drugIdArray,
          limit: parseInt(limit),
          history
        }
      });
    } catch (error) {
      console.error('Error fetching bulk snapshot history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bulk snapshot history'
      });
    }
  }
);

/**
 * GET /api/inventory-snapshot-history/store/:storeId/summary
 * Get summary statistics for inventory changes
 */
router.get('/store/:storeId/summary',
  authenticateUser,
  requireStoreAccess,
  [
    param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
    query('drugId').optional().isInt({ min: 1 }).withMessage('Valid drug ID required'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { storeId } = req.params;
      const { drugId, days = 30 } = req.query;

      const summary = await InventorySnapshotHistory.getChangeSummary(
        parseInt(storeId),
        drugId ? parseInt(drugId) : null,
        parseInt(days)
      );

      res.json({
        success: true,
        data: {
          storeId: parseInt(storeId),
          drugId: drugId ? parseInt(drugId) : null,
          days: parseInt(days),
          summary
        }
      });
    } catch (error) {
      console.error('Error fetching summary statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch summary statistics'
      });
    }
  }
);

/**
 * GET /api/inventory-snapshot-history/store/:storeId/most-active
 * Get most active drugs (most transactions) for a store
 */
router.get('/store/:storeId/most-active',
  authenticateUser,
  requireStoreAccess,
  [
    param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { storeId } = req.params;
      const { days = 30, limit = 10 } = req.query;

      const activeDrugs = await InventorySnapshotHistory.getMostActiveDrugs(
        parseInt(storeId),
        parseInt(days),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          storeId: parseInt(storeId),
          days: parseInt(days),
          limit: parseInt(limit),
          activeDrugs
        }
      });
    } catch (error) {
      console.error('Error fetching most active drugs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch most active drugs'
      });
    }
  }
);

/**
 * GET /api/inventory-snapshot-history/store/:storeId/by-transaction-type/:transactionType
 * Get snapshots filtered by transaction type
 */
router.get('/store/:storeId/by-transaction-type/:transactionType',
  authenticateUser,
  requireStoreAccess,
  [
    param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
    param('transactionType').isIn([
      'prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory'
    ]).withMessage('Valid transaction type required'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { storeId, transactionType } = req.params;
      const { limit = 50 } = req.query;

      const snapshots = await InventorySnapshotHistory.getByTransactionType(
        parseInt(storeId),
        transactionType,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          storeId: parseInt(storeId),
          transactionType,
          limit: parseInt(limit),
          snapshots
        }
      });
    } catch (error) {
      console.error('Error fetching snapshots by transaction type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch snapshots by transaction type'
      });
    }
  }
);

/**
 * POST /api/inventory-snapshot-history/cleanup
 * Clean up old history records (admin only)
 */
router.post('/cleanup',
  authenticateUser,
  [
    query('keepLast').optional().isInt({ min: 1, max: 20 }).withMessage('keepLast must be between 1 and 20')
  ],
  async (req, res) => {
    try {
      // Check if user has admin privileges
      if (!req.user.isAdmin && !req.user.isGodMode) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required for cleanup operations'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { keepLast = 5 } = req.query;

      const deletedCount = await InventorySnapshotHistory.cleanupOldRecords(parseInt(keepLast));

      res.json({
        success: true,
        data: {
          deletedRecords: deletedCount,
          keepLast: parseInt(keepLast),
          message: `Cleanup completed. Deleted ${deletedCount} old snapshot records.`
        }
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform cleanup operation'
      });
    }
  }
);

/**
 * GET /api/inventory-snapshot-history/transaction-types
 * Get available transaction types (for frontend dropdowns)
 */
router.get('/transaction-types', authenticateUser, async (req, res) => {
  try {
    const transactionTypes = [
      { value: 'prescription_fill', label: 'Prescription Fill', description: 'Medication dispensed to patient' },
      { value: 'shipment_received', label: 'Shipment Received', description: 'Inventory received from supplier' },
      { value: 'return_to_stock', label: 'Return to Stock', description: 'Medication returned to inventory' },
      { value: 'expire', label: 'Expired', description: 'Medication expired and removed' },
      { value: 'audit', label: 'Audit Adjustment', description: 'Manual inventory adjustment' },
      { value: 'initial_inventory', label: 'Initial Inventory', description: 'Initial stock setup' }
    ];

    res.json({
      success: true,
      data: transactionTypes
    });
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction types'
    });
  }
});

module.exports = router;