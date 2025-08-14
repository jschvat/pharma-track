const express = require('express');
const { validationResult, query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validateStoreParam } = require('../middleware/storeAuth');
const StoreInventory = require('../models/StoreInventory');
const InventoryAuditLog = require('../models/InventoryAuditLog');
const Store = require('../models/Store');
const Drug = require('../models/Drug');
const pdfReportService = require('../services/pdfReportService');

const router = express.Router();

/**
 * Generate Inventory Report PDF
 * GET /api/reports/inventory/:storeId/pdf
 */
router.get('/inventory/:storeId/pdf', authenticateToken, validateStoreParam, [
  param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean(),
  query('low_stock').optional().isBoolean().withMessage('Low stock must be boolean').toBoolean(),
  query('expiring_days').optional().isInt({ min: 1, max: 365 }).withMessage('Expiring days must be between 1 and 365').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { active = true, low_stock, expiring_days } = req.query;

    // Get store information
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get inventory data
    const filters = { store_id: parseInt(storeId) };
    if (active !== undefined) filters.is_active = active;
    if (low_stock) filters.low_stock = true;
    if (expiring_days) filters.expiring_days = parseInt(expiring_days);

    const inventory = await StoreInventory.findWithFilters(filters, 1000, 0); // Large limit for reports
    const stats = await StoreInventory.getStats(storeId);

    // Generate PDF
    const pdfBuffer = await pdfReportService.generateInventoryReport(
      { inventory, stats },
      store
    );

    // Set response headers for PDF download
    const filename = `inventory-report-${store.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Inventory PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate inventory report PDF',
      message: error.message 
    });
  }
});

/**
 * Generate Audit Report PDF
 * GET /api/reports/audit/:storeId/pdf
 */
router.get('/audit/:storeId/pdf', authenticateToken, validateStoreParam, [
  param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
  query('transaction_type').optional().isIn(['prescription_fill', 'return_to_stock', 'expire', 'audit', 'adjustment', 'initial_inventory']).withMessage('Invalid transaction type'),
  query('date_from').optional().isISO8601().withMessage('Invalid date format for date_from'),
  query('date_to').optional().isISO8601().withMessage('Invalid date format for date_to')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { limit = 500, transaction_type, date_from, date_to } = req.query;

    // Get store information
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get audit data
    const filters = {};
    if (transaction_type) filters.transaction_type = transaction_type;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const audit_entries = await InventoryAuditLog.getStoreHistory(storeId, filters, limit, 0);
    
    // Get summary stats
    const summary = await InventoryAuditLog.getTransactionStats(storeId, 'month');

    // Generate PDF
    const pdfBuffer = await pdfReportService.generateAuditReport(
      { audit_entries, summary },
      store
    );

    // Set response headers for PDF download
    const filename = `audit-report-${store.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Audit PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate audit report PDF',
      message: error.message 
    });
  }
});

/**
 * Generate NDC Audit Report PDF
 * GET /api/reports/ndc/:ndc/:storeId/pdf
 */
router.get('/ndc/:ndc/:storeId/pdf', authenticateToken, validateStoreParam, [
  param('ndc').isLength({ min: 10, max: 13 }).withMessage('Valid NDC required'),
  param('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
  query('audit_point_date').optional().isISO8601().withMessage('Invalid audit point date'),
  query('restrict_to_future_date').optional().isISO8601().withMessage('Invalid restrict to future date'),
  query('include_inactive').optional().isBoolean().withMessage('Include inactive must be boolean').toBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc, storeId } = req.params;
    const { audit_point_date, restrict_to_future_date, include_inactive = false } = req.query;

    // Get store information
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get NDC audit data
    const options = {
      auditPointDate: audit_point_date,
      restrictToFutureDate: restrict_to_future_date,
      includeInactive: include_inactive,
      limit: 1000,
      offset: 0
    };

    const ndcAuditData = await InventoryAuditLog.getNDCAuditReport(ndc, storeId, options);

    // Generate PDF
    const pdfBuffer = await pdfReportService.generateNDCAuditReport(ndcAuditData, store);

    // Set response headers for PDF download
    const filename = `ndc-audit-${ndc}-${store.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('NDC Audit PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate NDC audit report PDF',
      message: error.message 
    });
  }
});

/**
 * Generate User Management Report PDF
 * GET /api/reports/users/pdf
 */
router.get('/users/pdf', authenticateToken, [
  query('store_id').optional().isInt({ min: 1 }).withMessage('Valid store ID required'),
  query('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role'),
  query('is_active').optional().isBoolean().withMessage('Is active must be boolean').toBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { store_id, role, is_active } = req.query;

    // Get users data
    const filters = {};
    if (store_id) filters.store_id = store_id;
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active;

    const User = require('../models/User');
    const users = await User.findWithFilters(filters, 1000, 0);

    // Generate simple users HTML (you can expand this)
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>User Management Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>👥 User Management Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Store</th>
            <th>Active</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td>${user.store_name || 'N/A'}</td>
              <td>${user.is_active ? 'Yes' : 'No'}</td>
              <td>${new Date(user.date_created).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;

    const pdfBuffer = await pdfReportService.generatePDF(htmlContent);

    // Set response headers for PDF download
    const filename = `user-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('User PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate user report PDF',
      message: error.message 
    });
  }
});

module.exports = router;