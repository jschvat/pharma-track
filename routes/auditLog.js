const express = require('express');
const { validationResult, query, body, param } = require('express-validator');
const InventoryAuditLog = require('../models/InventoryAuditLog');
const StoreInventory = require('../models/StoreInventory');
const Drug = require('../models/Drug');
const { authenticateToken, requireStoreAdmin, requireRole } = require('../middleware/auth');
const { verifyId, verifyQuantity, verifyNDC } = require('../middleware/dataVerification');

const router = express.Router();

// Get audit history for specific inventory item
router.get('/inventory/:inventoryId', authenticateToken, [
  verifyId('inventoryId'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inventoryId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Verify inventory exists and user has access
    const inventory = await StoreInventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (req.user.role !== 'admin' && req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const history = await InventoryAuditLog.getInventoryHistory(inventoryId, limitNum, offset);
    const runningTotal = await InventoryAuditLog.getRunningTotal(inventoryId);

    res.json({
      history,
      running_total: runningTotal,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory history',
      message: error.message 
    });
  }
});

// Get audit history for a specific drug
router.get('/drug/:drugId', authenticateToken, [
  verifyId('drugId'),
  query('store_id').optional().isInt({ min: 1 }).withMessage('Store ID must be a positive integer').toInt(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { drugId } = req.params;
    const { store_id, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    // Verify drug exists
    const drug = await Drug.findById(drugId);
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // If store_id provided, verify access
    if (store_id && req.user.role !== 'admin' && req.user.store_id !== parseInt(store_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For non-admin users, restrict to their store
    const storeFilter = req.user.role === 'admin' ? store_id : req.user.store_id;

    const history = await InventoryAuditLog.getDrugHistory(drugId, storeFilter, limit, offset);

    res.json({
      drug: {
        id: drug.id,
        generic_name: drug.generic_name,
        brand_name: drug.brand_name,
        ndc: drug.ndc
      },
      history,
      pagination: {
        page,
        limit,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Get drug history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve drug history',
      message: error.message 
    });
  }
});

// Get audit history for a store
router.get('/store/:storeId', authenticateToken, [
  verifyId('storeId'),
  query('transaction_type').optional().isIn(['prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory'])
    .withMessage('Invalid transaction type'),
  query('drug_id').optional().isInt({ min: 1 }).withMessage('Drug ID must be a positive integer').toInt(),
  query('performed_by').optional().isInt({ min: 1 }).withMessage('Performed by must be a positive integer').toInt(),
  query('date_from').optional().isISO8601().withMessage('Date from must be valid ISO date').toDate(),
  query('date_to').optional().isISO8601().withMessage('Date to must be valid ISO date').toDate(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { 
      transaction_type, 
      drug_id, 
      performed_by, 
      date_from, 
      date_to, 
      page = 1, 
      limit = 100 
    } = req.query;

    // Check access
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (page - 1) * limit;
    const filters = {
      transaction_type,
      drug_id,
      performed_by,
      date_from,
      date_to
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const history = await InventoryAuditLog.getStoreHistory(storeId, filters, limit, offset);
    const total = await InventoryAuditLog.countWithFilters({ store_id: storeId, ...filters });

    res.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: filters
    });

  } catch (error) {
    console.error('Get store audit history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve store audit history',
      message: error.message 
    });
  }
});

// Get transaction statistics for a store
router.get('/store/:storeId/stats', authenticateToken, [
  verifyId('storeId'),
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Period must be day, week, month, or year')
], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = 'month' } = req.query;

    // Check access
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await InventoryAuditLog.getTransactionStats(storeId, period);

    res.json({
      stats,
      period,
      store_id: parseInt(storeId)
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve transaction statistics',
      message: error.message 
    });
  }
});

// Get recent transactions (admin only)
router.get('/recent', authenticateToken, requireRole('admin'), [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const transactions = await InventoryAuditLog.getRecentTransactions(limit);

    res.json({
      recent_transactions: transactions,
      total: transactions.length
    });

  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve recent transactions',
      message: error.message 
    });
  }
});

// Generate comprehensive NDC audit report for specific store
router.get('/ndc-report/:storeId/:ndc', authenticateToken, [
  verifyId('storeId'),
  param('ndc').matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format').customSanitizer(value => value.replace(/[^\d]/g, '')),
  query('audit_point_date').optional().isISO8601().withMessage('Audit point date must be valid ISO date (YYYY-MM-DD)').toDate(),
  query('restrict_to_future_date').optional().isISO8601().withMessage('Restriction end date must be valid ISO date (YYYY-MM-DD)').toDate(),
  query('include_inactive').optional().isBoolean().withMessage('Include inactive must be boolean').toBoolean(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId, ndc } = req.params;
    const { 
      audit_point_date, 
      restrict_to_future_date, 
      include_inactive = false,
      page = 1,
      limit = 500
    } = req.query;

    // Check access - users can only access their own store, admins can access any store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied. You can only generate reports for your assigned store.' });
    }

    // Validate date logic
    if (audit_point_date && restrict_to_future_date && new Date(audit_point_date) > new Date(restrict_to_future_date)) {
      return res.status(400).json({ 
        error: 'Invalid date range. Audit point date cannot be after restriction end date.' 
      });
    }

    const offset = (page - 1) * limit;

    // Generate the comprehensive audit report
    const auditReport = await InventoryAuditLog.getNDCAuditReport(ndc, storeId, {
      auditPointDate: audit_point_date,
      restrictToFutureDate: restrict_to_future_date,
      includeInactive: include_inactive,
      limit,
      offset
    });

    // Add request metadata to response
    auditReport.request_info = {
      requested_by: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      request_date: new Date().toISOString(),
      filters_applied: {
        ndc: ndc,
        store_id: parseInt(storeId),
        audit_point_date: audit_point_date || 'All historical data',
        restrict_to_future_date: restrict_to_future_date || 'No end date restriction',
        include_inactive_inventory: include_inactive
      }
    };

    res.json(auditReport);

  } catch (error) {
    console.error('Generate NDC audit report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate NDC audit report',
      message: error.message 
    });
  }
});

// Export NDC audit report as CSV (future enhancement endpoint)
router.get('/ndc-report/:storeId/:ndc/export', authenticateToken, [
  verifyId('storeId'),
  param('ndc').matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format').customSanitizer(value => value.replace(/[^\d]/g, '')),
  query('audit_point_date').optional().isISO8601().withMessage('Audit point date must be valid ISO date').toDate(),
  query('restrict_to_future_date').optional().isISO8601().withMessage('Restriction end date must be valid ISO date').toDate(),
  query('include_inactive').optional().isBoolean().withMessage('Include inactive must be boolean').toBoolean(),
  query('format').optional().isIn(['csv', 'json']).withMessage('Format must be csv or json')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId, ndc } = req.params;
    const { 
      audit_point_date, 
      restrict_to_future_date, 
      include_inactive = false,
      format = 'csv'
    } = req.query;

    // Check access
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all data (no pagination for export)
    const auditReport = await InventoryAuditLog.getNDCAuditReport(ndc, storeId, {
      auditPointDate: audit_point_date,
      restrictToFutureDate: restrict_to_future_date,
      includeInactive: include_inactive,
      limit: 10000, // Large limit for export
      offset: 0
    });

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'Date',
        'Transaction Type',
        'Quantity Change',
        'Quantity Before',
        'Quantity After',
        'Running Total',
        'User Name',
        'User Role',
        'Reason',
        'Reference Number'
      ].join(',');

      const csvRows = auditReport.audit_entries.map(entry => [
        entry.transaction_date,
        entry.transaction_type,
        entry.quantity_change,
        entry.quantity_before,
        entry.quantity_after,
        entry.running_total,
        `"${entry.performed_by_name}"`,
        entry.performed_by_role,
        `"${entry.reason || ''}"`,
        `"${entry.reference_number || ''}"`
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ndc-${ndc}-store-${storeId}-audit-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else {
      // Return JSON format with export headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ndc-${ndc}-store-${storeId}-audit-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(auditReport);
    }

  } catch (error) {
    console.error('Export NDC audit report error:', error);
    res.status(500).json({ 
      error: 'Failed to export NDC audit report',
      message: error.message 
    });
  }
});

module.exports = router;