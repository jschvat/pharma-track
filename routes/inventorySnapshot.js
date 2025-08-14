/**
 * Inventory Snapshot Routes
 * 
 * Routes for accessing the real-time inventory snapshot data
 * and performing transaction-safe inventory operations.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const express = require('express');
const { validationResult, query, body, param } = require('express-validator');
const InventorySnapshot = require('../models/InventorySnapshot');
const InventoryTransactionHelper = require('../utils/inventoryTransactionHelper');
const StoreInventory = require('../models/StoreInventory');
const { authenticateToken, requireStoreAdmin } = require('../middleware/auth');
const { validateStoreParam, restrictToActiveStore } = require('../middleware/storeAuth');
const { 
  verifyQuantity, 
  verifyId
} = require('../middleware/dataVerification');

const router = express.Router();

// Get current inventory snapshot for a store
router.get('/store/:storeId/current', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  query('include_zero').optional().isBoolean().withMessage('Include zero must be boolean').toBoolean(),
  query('drug_id').optional().isInt({ min: 1 }).withMessage('Drug ID must be positive integer').toInt(),
  query('order_by').optional().isIn(['generic_name', 'brand_name', 'quantity_on_hand', 'last_transaction_date', 'ndc']).withMessage('Invalid order field'),
  query('order_direction').optional().isIn(['ASC', 'DESC']).withMessage('Order direction must be ASC or DESC'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000').toInt(),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const {
      include_zero = false,
      drug_id,
      order_by = 'generic_name',
      order_direction = 'ASC',
      limit = 100,
      offset = 0
    } = req.query;

    const options = {
      includeZeroQuantity: include_zero,
      drugId: drug_id,
      orderBy: order_by,
      orderDirection: order_direction,
      limit: limit,
      offset: offset
    };

    const inventory = await InventorySnapshot.getByStore(parseInt(storeId), options);

    res.json({
      success: true,
      store_id: parseInt(storeId),
      total_items: inventory.length,
      inventory
    });

  } catch (error) {
    console.error('Error fetching current inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current inventory',
      message: error.message 
    });
  }
});

// Get low stock items for a store
router.get('/store/:storeId/low-stock', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  query('threshold').optional().isInt({ min: 1, max: 1000 }).withMessage('Threshold must be between 1 and 1000').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { threshold = 10 } = req.query;

    const lowStockItems = await InventorySnapshot.getLowStock(parseInt(storeId), threshold);

    res.json({
      success: true,
      store_id: parseInt(storeId),
      threshold,
      low_stock_count: lowStockItems.length,
      items: lowStockItems
    });

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch low stock items',
      message: error.message 
    });
  }
});

// Get out of stock items for a store
router.get('/store/:storeId/out-of-stock', authenticateToken, validateStoreParam, [
  verifyId('storeId')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const outOfStockItems = await InventorySnapshot.getOutOfStock(parseInt(storeId));

    res.json({
      success: true,
      store_id: parseInt(storeId),
      out_of_stock_count: outOfStockItems.length,
      items: outOfStockItems
    });

  } catch (error) {
    console.error('Error fetching out of stock items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch out of stock items',
      message: error.message 
    });
  }
});

// Get inventory statistics for a store
router.get('/store/:storeId/stats', authenticateToken, validateStoreParam, [
  verifyId('storeId')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const stats = await InventorySnapshot.getStoreStats(parseInt(storeId));

    res.json({
      success: true,
      store_id: parseInt(storeId),
      statistics: stats
    });

  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory statistics',
      message: error.message 
    });
  }
});

// Search inventory by drug name or NDC
router.get('/store/:storeId/search', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  query('q').isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  query('include_zero').optional().isBoolean().withMessage('Include zero must be boolean').toBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { q: searchTerm, include_zero = false, limit = 50 } = req.query;

    const options = {
      includeZeroQuantity: include_zero,
      limit: limit
    };

    const results = await InventorySnapshot.search(parseInt(storeId), searchTerm, options);

    res.json({
      success: true,
      store_id: parseInt(storeId),
      search_term: searchTerm,
      result_count: results.length,
      results
    });

  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ 
      error: 'Failed to search inventory',
      message: error.message 
    });
  }
});

// Transaction-safe prescription fill
router.post('/transactions/prescription-fill', authenticateToken, requireStoreAdmin, [
  body('inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('prescription_number').isLength({ min: 1, max: 100 }).withMessage('Prescription number required (1-100 chars)'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inventory_id, quantity, prescription_number, reason = 'Prescription dispensed' } = req.body;

    // Get current inventory
    const inventory = await StoreInventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check store access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate sufficient quantity
    if (inventory.quantity_on_hand < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient quantity available',
        available: inventory.quantity_on_hand,
        requested: quantity
      });
    }

    // Execute transaction
    const result = await InventoryTransactionHelper.executeInventoryTransaction({
      inventoryId: inventory_id,
      storeId: inventory.store_id,
      drugId: inventory.drug_id,
      transactionType: 'prescription_fill',
      quantityChange: -quantity,
      quantityBefore: inventory.quantity_on_hand,
      quantityAfter: inventory.quantity_on_hand - quantity,
      reason,
      referenceNumber: prescription_number,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Prescription filled successfully',
      transaction: result,
      prescription_number
    });

  } catch (error) {
    console.error('Error processing prescription fill:', error);
    res.status(500).json({ 
      error: 'Failed to process prescription fill',
      message: error.message 
    });
  }
});

// Transaction-safe return to stock
router.post('/transactions/return-to-stock', authenticateToken, requireStoreAdmin, [
  body('inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less'),
  body('reference_number').optional().isLength({ max: 100 }).withMessage('Reference number must be 100 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inventory_id, quantity, reason = 'Medication returned to stock', reference_number } = req.body;

    // Get current inventory
    const inventory = await StoreInventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check store access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Execute transaction
    const result = await InventoryTransactionHelper.executeInventoryTransaction({
      inventoryId: inventory_id,
      storeId: inventory.store_id,
      drugId: inventory.drug_id,
      transactionType: 'return_to_stock',
      quantityChange: quantity,
      quantityBefore: inventory.quantity_on_hand,
      quantityAfter: inventory.quantity_on_hand + quantity,
      reason,
      referenceNumber: reference_number,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Medication returned to stock successfully',
      transaction: result,
      reference_number
    });

  } catch (error) {
    console.error('Error processing return to stock:', error);
    res.status(500).json({ 
      error: 'Failed to process return to stock',
      message: error.message 
    });
  }
});

// Transaction-safe expire medication
router.post('/transactions/expire', authenticateToken, requireStoreAdmin, [
  body('inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inventory_id, quantity, reason = 'Medication expired' } = req.body;

    // Get current inventory
    const inventory = await StoreInventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check store access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate sufficient quantity
    if (inventory.quantity_on_hand < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient quantity available',
        available: inventory.quantity_on_hand,
        requested: quantity
      });
    }

    // Execute transaction
    const result = await InventoryTransactionHelper.executeInventoryTransaction({
      inventoryId: inventory_id,
      storeId: inventory.store_id,
      drugId: inventory.drug_id,
      transactionType: 'expire',
      quantityChange: -quantity,
      quantityBefore: inventory.quantity_on_hand,
      quantityAfter: inventory.quantity_on_hand - quantity,
      reason,
      referenceNumber: null,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Medication expired successfully',
      transaction: result
    });

  } catch (error) {
    console.error('Error processing medication expiration:', error);
    res.status(500).json({ 
      error: 'Failed to process medication expiration',
      message: error.message 
    });
  }
});

// Transaction-safe inventory audit
router.post('/transactions/audit', authenticateToken, requireStoreAdmin, [
  body('inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required'),
  body('actual_quantity').isInt({ min: 0 }).withMessage('Actual quantity must be non-negative integer'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less'),
  body('reference_number').optional().isLength({ max: 100 }).withMessage('Reference number must be 100 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inventory_id, actual_quantity, reason = 'Inventory audit', reference_number } = req.body;

    // Get current inventory
    const inventory = await StoreInventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check store access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Execute audit transaction
    const result = await InventoryTransactionHelper.performInventoryAudit({
      inventoryId: inventory_id,
      storeId: inventory.store_id,
      drugId: inventory.drug_id,
      actualQuantity: actual_quantity,
      performedBy: req.user.id,
      reason,
      referenceNumber: reference_number
    });

    res.json({
      success: true,
      message: 'Inventory audit completed successfully',
      audit_result: result,
      reference_number
    });

  } catch (error) {
    console.error('Error processing inventory audit:', error);
    res.status(500).json({ 
      error: 'Failed to process inventory audit',
      message: error.message 
    });
  }
});

// Get transaction history for a drug
router.get('/transactions/history/:storeId/:drugId', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  verifyId('drugId'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
  query('start_date').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
  query('end_date').optional().isISO8601().withMessage('End date must be valid ISO8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId, drugId } = req.params;
    const { limit = 50, offset = 0, start_date, end_date } = req.query;

    const options = {
      limit,
      offset,
      startDate: start_date,
      endDate: end_date
    };

    const history = await InventoryTransactionHelper.getTransactionHistory(
      parseInt(storeId),
      parseInt(drugId),
      options
    );

    res.json({
      success: true,
      store_id: parseInt(storeId),
      drug_id: parseInt(drugId),
      transaction_count: history.length,
      transactions: history
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction history',
      message: error.message 
    });
  }
});

module.exports = router;