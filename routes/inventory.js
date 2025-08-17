const express = require('express');
const { validationResult, query, body } = require('express-validator');
const StoreInventory = require('../models/StoreInventory');
const Drug = require('../models/Drug');
const InventoryAuditLog = require('../models/InventoryAuditLog');
const { authenticateToken, requireStoreAdmin } = require('../middleware/auth');
const { validateStoreParam, restrictToActiveStore, validateInventoryAccess } = require('../middleware/storeAuth');
const { 
  verifyQuantity, 
  verifyPrice, 
  verifyDate,
  verifyId
} = require('../middleware/dataVerification');
const { VALIDATION } = require('../config/constants');

const router = express.Router();

// Get all inventory items for a store
router.get('/store/:storeId', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: VALIDATION.MIN_PAGE_LIMIT, max: VALIDATION.MAX_PAGE_LIMIT }).withMessage(`Limit must be between ${VALIDATION.MIN_PAGE_LIMIT} and ${VALIDATION.MAX_PAGE_LIMIT}`).toInt(),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean(),
  query('low_stock').optional().isBoolean().withMessage('Low stock must be boolean').toBoolean(),
  query('expiring_days').optional().isInt({ min: VALIDATION.MIN_EXPIRING_DAYS, max: VALIDATION.MAX_EXPIRING_DAYS }).withMessage(`Expiring days must be between ${VALIDATION.MIN_EXPIRING_DAYS} and ${VALIDATION.MAX_EXPIRING_DAYS}`).toInt(),
  query('search').optional().isLength({ min: VALIDATION.MIN_SEARCH_LENGTH, max: VALIDATION.MAX_SEARCH_LENGTH }).withMessage(`Search must be ${VALIDATION.MIN_SEARCH_LENGTH}-${VALIDATION.MAX_SEARCH_LENGTH} characters`)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { page = 1, limit = 20, active = true, low_stock, expiring_days, search } = req.query;
    
    // Ensure numeric parameters are properly parsed
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Store access already validated by middleware

    const offset = (pageNum - 1) * limitNum;
    const filters = { store_id: parseInt(storeId) };

    if (active !== undefined) filters.is_active = active;
    if (low_stock) filters.low_stock = true;
    if (expiring_days) filters.expiring_days = parseInt(expiring_days);
    if (search) filters.search = search;

    const inventory = await StoreInventory.findWithFilters(filters, limitNum, offset);
    const total = await StoreInventory.countWithFilters(filters);

    res.json({
      inventory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory',
      message: error.message 
    });
  }
});

// Get single inventory item  
router.get('/:id', authenticateToken, validateInventoryAccess, [verifyId()], async (req, res) => {
  try {
    // Inventory item already loaded and validated by middleware
    const inventory = req.inventoryItem;
    res.json({ inventory });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory item',
      message: error.message 
    });
  }
});

// Add new inventory item
router.post('/', authenticateToken, requireStoreAdmin, [
  body('drug_id').isInt({ min: 1 }).withMessage('Valid drug ID required'),
  verifyQuantity('quantity_on_hand'),
  verifyQuantity('reorder_level'),
  verifyPrice('unit_cost'),
  verifyPrice('selling_price'),
  body('lot_number').optional().isLength({ min: 1, max: 50 }).withMessage('Lot number must be 1-50 characters'),
  verifyDate('expiration_date'),
  body('supplier').optional().isLength({ min: 1, max: 255 }).withMessage('Supplier must be 1-255 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryData = {
      ...req.body,
      store_id: req.user.store_id
    };

    // Verify drug exists
    const drug = await Drug.findById(inventoryData.drug_id);
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // Check if this drug/lot combination already exists
    const existing = await StoreInventory.findByStoreDrug(
      inventoryData.store_id, 
      inventoryData.drug_id, 
      inventoryData.lot_number
    );

    if (existing) {
      return res.status(400).json({ 
        error: 'This drug with the same lot number already exists in inventory' 
      });
    }

    const inventoryId = await StoreInventory.add(inventoryData, req.user.id);
    const inventory = await StoreInventory.findById(inventoryId);

    res.status(201).json({
      message: 'Inventory item added successfully',
      inventory
    });

  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to add inventory item',
      message: error.message 
    });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity_on_hand').optional(),
  verifyQuantity('reorder_level').optional(),
  verifyPrice('unit_cost').optional(),
  verifyPrice('selling_price').optional(),
  body('lot_number').optional().isLength({ min: 1, max: 50 }).withMessage('Lot number must be 1-50 characters'),
  verifyDate('expiration_date').optional(),
  body('supplier').optional().isLength({ min: 1, max: 255 }).withMessage('Supplier must be 1-255 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const inventory = await StoreInventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user can access this store's inventory
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await StoreInventory.update(id, req.body);
    
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Inventory updated successfully',
      inventory: updatedInventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to update inventory',
      message: error.message 
    });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, requireStoreAdmin, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await StoreInventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user can access this store's inventory
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await StoreInventory.delete(id);
    
    if (!deleted) {
      return res.status(400).json({ error: 'Failed to delete inventory item' });
    }

    res.json({ message: 'Inventory item deleted successfully' });

  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to delete inventory item',
      message: error.message 
    });
  }
});

// Adjust stock quantity
router.patch('/:id/adjust-stock', authenticateToken, requireStoreAdmin, [
  verifyId(),
  body('adjustment').isInt().withMessage('Adjustment must be an integer'),
  body('reason').optional().isLength({ min: 1, max: 255 }).withMessage('Reason must be 1-255 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { adjustment, reason = 'Manual adjustment' } = req.body;

    const inventory = await StoreInventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user can access this store's inventory
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if adjustment would result in negative quantity
    const newQuantity = inventory.quantity_on_hand + adjustment;
    if (newQuantity < 0) {
      return res.status(400).json({ 
        error: `Adjustment would result in negative quantity (${newQuantity})` 
      });
    }

    const adjusted = await StoreInventory.adjustStock(id, adjustment, reason, req.user.id);
    
    if (!adjusted) {
      return res.status(400).json({ error: 'Failed to adjust stock' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Stock adjusted successfully',
      inventory: updatedInventory,
      adjustment,
      reason
    });

  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ 
      error: 'Failed to adjust stock',
      message: error.message 
    });
  }
});

// Set stock quantity directly
router.patch('/:id/set-quantity', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    const inventory = await StoreInventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user can access this store's inventory
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await StoreInventory.updateQuantity(id, quantity);
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update quantity' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Quantity updated successfully',
      inventory: updatedInventory,
      old_quantity: inventory.quantity_on_hand,
      new_quantity: quantity
    });

  } catch (error) {
    console.error('Set quantity error:', error);
    res.status(500).json({ 
      error: 'Failed to update quantity',
      message: error.message 
    });
  }
});

// Get low stock items
router.get('/store/:storeId/low-stock', authenticateToken, [
  verifyId('storeId'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50 } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lowStock = await StoreInventory.getLowStock(parseInt(storeId), parseInt(limit));

    res.json({
      low_stock: lowStock,
      total: lowStock.length
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve low stock items',
      message: error.message 
    });
  }
});

// Get expiring items
router.get('/store/:storeId/expiring', authenticateToken, [
  verifyId('storeId'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30, limit = 50 } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expiring = await StoreInventory.getExpiring(parseInt(storeId), parseInt(days), parseInt(limit));

    res.json({
      expiring,
      total: expiring.length,
      days
    });

  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve expiring items',
      message: error.message 
    });
  }
});

// Get inventory statistics
router.get('/store/:storeId/stats', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await StoreInventory.getStats(storeId);

    res.json({ stats });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory statistics',
      message: error.message 
    });
  }
});

// Bulk operations
router.post('/bulk/adjust-stock', authenticateToken, requireStoreAdmin, [
  body('adjustments').isArray({ min: 1 }).withMessage('Adjustments must be a non-empty array'),
  body('adjustments.*.inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required'),
  body('adjustments.*.adjustment').isInt().withMessage('Adjustment must be an integer'),
  body('adjustments.*.reason').optional().isLength({ min: 1, max: 255 }).withMessage('Reason must be 1-255 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adjustments } = req.body;
    const results = [];
    const errors_list = [];

    for (const adj of adjustments) {
      try {
        const inventory = await StoreInventory.findById(adj.inventory_id);

        if (!inventory) {
          errors_list.push({
            inventory_id: adj.inventory_id,
            error: 'Inventory item not found'
          });
          continue;
        }

        // Check if user can access this store's inventory
        if (req.user.store_id !== inventory.store_id) {
          errors_list.push({
            inventory_id: adj.inventory_id,
            error: 'Access denied'
          });
          continue;
        }

        // Check if adjustment would result in negative quantity
        const newQuantity = inventory.quantity_on_hand + adj.adjustment;
        if (newQuantity < 0) {
          errors_list.push({
            inventory_id: adj.inventory_id,
            error: `Adjustment would result in negative quantity (${newQuantity})`
          });
          continue;
        }

        const adjusted = await StoreInventory.adjustStock(
          adj.inventory_id, 
          adj.adjustment, 
          adj.reason || 'Bulk adjustment',
          req.user.id
        );

        if (adjusted) {
          results.push({
            inventory_id: adj.inventory_id,
            adjustment: adj.adjustment,
            status: 'success'
          });
        } else {
          errors_list.push({
            inventory_id: adj.inventory_id,
            error: 'Failed to adjust stock'
          });
        }
      } catch (error) {
        errors_list.push({
          inventory_id: adj.inventory_id,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk stock adjustment completed',
      successful: results.length,
      failed: errors_list.length,
      results,
      errors: errors_list
    });

  } catch (error) {
    console.error('Bulk adjust stock error:', error);
    res.status(500).json({ 
      error: 'Failed to perform bulk stock adjustment',
      message: error.message 
    });
  }
});

// Bulk update inventory items
router.put('/bulk/update', authenticateToken, requireStoreAdmin, [
  body('updates').isArray({ min: 1 }).withMessage('Updates must be a non-empty array'),
  body('updates.*.inventory_id').isInt({ min: 1 }).withMessage('Valid inventory ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;
    const results = [];
    const errors_list = [];

    for (const update of updates) {
      try {
        const { inventory_id, ...updateData } = update;
        
        const inventory = await StoreInventory.findById(inventory_id);

        if (!inventory) {
          errors_list.push({
            inventory_id,
            error: 'Inventory item not found'
          });
          continue;
        }

        // Check if user can access this store's inventory
        if (req.user.store_id !== inventory.store_id) {
          errors_list.push({
            inventory_id,
            error: 'Access denied'
          });
          continue;
        }

        const updated = await StoreInventory.update(inventory_id, updateData);

        if (updated) {
          results.push({
            inventory_id,
            status: 'success'
          });
        } else {
          errors_list.push({
            inventory_id,
            error: 'No changes made or update failed'
          });
        }
      } catch (error) {
        errors_list.push({
          inventory_id: update.inventory_id,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk inventory update completed',
      successful: results.length,
      failed: errors_list.length,
      results,
      errors: errors_list
    });

  } catch (error) {
    console.error('Bulk update inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to perform bulk inventory update',
      message: error.message 
    });
  }
});

// Fill prescription
router.post('/:id/fill-prescription', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity'),
  body('prescription_number').isLength({ min: 1, max: 100 }).withMessage('Prescription number required (1-100 characters)'),
  body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, prescription_number, reason = 'Prescription fill' } = req.body;

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filled = await StoreInventory.fillPrescription(
      id, 
      quantity, 
      prescription_number, 
      req.user.id, 
      reason
    );

    if (!filled) {
      return res.status(400).json({ error: 'Failed to fill prescription' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Prescription filled successfully',
      inventory: updatedInventory,
      transaction: {
        type: 'prescription_fill',
        quantity,
        prescription_number,
        reason
      }
    });

  } catch (error) {
    console.error('Fill prescription error:', error);
    res.status(500).json({ 
      error: 'Failed to fill prescription',
      message: error.message 
    });
  }
});

// Return to stock
router.post('/:id/return-to-stock', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Return reason must be 500 characters or less'),
  body('reference_number').optional().isLength({ max: 100 }).withMessage('Reference number must be 100 characters or less')
], async (req, res) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    

    const { id } = req.params;
    const { quantity, reason, reference_number } = req.body;
    const finalReason = reason && reason.trim() ? reason.trim() : 'Returned to stock';

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const returned = await StoreInventory.returnToStock(
      id, 
      quantity, 
      finalReason, 
      req.user.id, 
      reference_number
    );

    if (!returned) {
      return res.status(400).json({ error: 'Failed to return to stock' });
    }
    

    const updatedInventory = await StoreInventory.findById(id);

    const response = {
      message: 'Medication returned to stock successfully',
      inventory: updatedInventory,
      transaction: {
        type: 'return_to_stock',
        quantity,
        reason: finalReason,
        reference_number
      }
    };
    
    res.json(response);

  } catch (error) {
    console.error('Return to stock error:', error);
    res.status(500).json({ 
      error: 'Failed to return medication to stock',
      message: error.message 
    });
  }
});

// Expire medication
router.post('/:id/expire', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Expiration reason must be 500 characters or less')
], async (req, res) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, reason } = req.body;
    const finalReason = reason && reason.trim() ? reason.trim() : 'Medication expired';
    

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expired = await StoreInventory.expireMedication(
      id, 
      quantity, 
      finalReason, 
      req.user.id
    );

    if (!expired) {
      return res.status(400).json({ error: 'Failed to expire medication' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Medication expired successfully',
      inventory: updatedInventory,
      transaction: {
        type: 'expire',
        quantity,
        reason: finalReason
      }
    });

  } catch (error) {
    console.error('Expire medication error:', error);
    res.status(500).json({ 
      error: 'Failed to expire medication',
      message: error.message 
    });
  }
});

// Audit inventory
router.post('/:id/audit', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('actual_quantity'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Audit reason required (1-500 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { actual_quantity, reason } = req.body;

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check access
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quantityBefore = inventory.quantity_on_hand;
    const adjustment = actual_quantity - quantityBefore;

    const audited = await StoreInventory.auditInventory(
      id, 
      actual_quantity, 
      reason, 
      req.user.id
    );

    if (!audited) {
      return res.status(400).json({ error: 'Failed to audit inventory' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Inventory audit completed successfully',
      inventory: updatedInventory,
      audit_result: {
        quantity_before: quantityBefore,
        quantity_after: actual_quantity,
        adjustment,
        reason
      }
    });

  } catch (error) {
    console.error('Audit inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to audit inventory',
      message: error.message 
    });
  }
});

// Get running total for inventory item
router.get('/:id/running-total', authenticateToken, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const runningTotal = await InventoryAuditLog.getRunningTotal(id);

    res.json({
      inventory_id: id,
      drug_info: {
        generic_name: inventory.generic_name,
        brand_name: inventory.brand_name,
        ndc: inventory.ndc
      },
      running_total: runningTotal
    });

  } catch (error) {
    console.error('Get running total error:', error);
    res.status(500).json({ 
      error: 'Failed to get running total',
      message: error.message 
    });
  }
});

module.exports = router;