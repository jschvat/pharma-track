/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Store inventory management operations
 */

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

/**
 * @swagger
 * /api/inventory/store/{storeId}:
 *   get:
 *     summary: Get store inventory
 *     description: Retrieve all inventory items for a specific store with optional filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: Filter for low stock items only
 *       - in: query
 *         name: expiring_days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Filter for items expiring within specified days
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in drug names and NDC
 *     responses:
 *       200:
 *         description: Inventory items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     inventory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryItem'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions for store access
 */
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

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get single inventory item
 *     description: Retrieve detailed information for a specific inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Add new inventory item
 *     description: Create a new inventory item for the authenticated user's store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drug_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Drug ID
 *                 example: 1
 *               quantity_on_hand:
 *                 type: integer
 *                 minimum: 0
 *                 description: Initial quantity
 *                 example: 100
 *               reorder_level:
 *                 type: integer
 *                 minimum: 0
 *                 description: Reorder threshold
 *                 example: 20
 *               unit_cost:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Cost per unit
 *                 example: 0.15
 *               selling_price:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Selling price per unit
 *                 example: 0.25
 *               lot_number:
 *                 type: string
 *                 maxLength: 50
 *                 description: Batch/lot number
 *                 example: "LOT12345"
 *               expiration_date:
 *                 type: string
 *                 format: date
 *                 description: Expiration date
 *                 example: "2025-12-31"
 *               supplier:
 *                 type: string
 *                 maxLength: 255
 *                 description: Supplier name
 *                 example: "ABC Pharmaceuticals"
 *             required: [drug_id, quantity_on_hand, reorder_level, unit_cost, selling_price, expiration_date]
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory item added successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Validation error or duplicate item
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (store admin required)
 *       404:
 *         description: Drug not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     description: Update an existing inventory item's details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity_on_hand:
 *                 type: integer
 *                 minimum: 0
 *                 description: Current quantity
 *               reorder_level:
 *                 type: integer
 *                 minimum: 0
 *                 description: Reorder threshold
 *               unit_cost:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Cost per unit
 *               selling_price:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Selling price per unit
 *               lot_number:
 *                 type: string
 *                 maxLength: 50
 *                 description: Batch/lot number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *                 description: Expiration date
 *               supplier:
 *                 type: string
 *                 maxLength: 255
 *                 description: Supplier name
 *               is_active:
 *                 type: boolean
 *                 description: Whether item is active
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory updated successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Validation error or no changes made
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     description: Permanently delete an inventory item from the store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory item deleted successfully"
 *       400:
 *         description: Failed to delete inventory item
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/adjust-stock:
 *   patch:
 *     summary: Adjust stock quantity
 *     description: Adjust inventory quantity with audit trail (positive or negative adjustment)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Quantity adjustment (positive to add, negative to subtract)
 *                 example: -5
 *               reason:
 *                 type: string
 *                 maxLength: 255
 *                 description: Reason for adjustment
 *                 example: "Manual count correction"
 *             required: [adjustment]
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stock adjusted successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 adjustment:
 *                   type: integer
 *                   example: -5
 *                 reason:
 *                   type: string
 *                   example: "Manual count correction"
 *       400:
 *         description: Validation error or adjustment would result in negative quantity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/set-quantity:
 *   patch:
 *     summary: Set stock quantity directly
 *     description: Set inventory quantity to a specific value with audit trail
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: New quantity to set
 *                 example: 50
 *             required: [quantity]
 *     responses:
 *       200:
 *         description: Quantity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Quantity updated successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 old_quantity:
 *                   type: integer
 *                   example: 45
 *                 new_quantity:
 *                   type: integer
 *                   example: 50
 *       400:
 *         description: Validation error or failed to update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/store/{storeId}/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Retrieve inventory items that are at or below their reorder level
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of items to return
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 low_stock:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *                 total:
 *                   type: integer
 *                   description: Number of low stock items
 *                   example: 12
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - insufficient permissions for store
 */
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

/**
 * @swagger
 * /api/inventory/store/{storeId}/expiring:
 *   get:
 *     summary: Get expiring items
 *     description: Retrieve inventory items that are expiring within specified days
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to look ahead for expiring items
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of items to return
 *     responses:
 *       200:
 *         description: Expiring items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expiring:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *                 total:
 *                   type: integer
 *                   description: Number of expiring items
 *                   example: 8
 *                 days:
 *                   type: integer
 *                   description: Days ahead checked
 *                   example: 30
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - insufficient permissions for store
 */
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

/**
 * @swagger
 * /api/inventory/store/{storeId}/stats:
 *   get:
 *     summary: Get inventory statistics
 *     description: Retrieve statistical overview of store inventory (totals, low stock count, etc.)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Inventory statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_items:
 *                       type: integer
 *                       description: Total number of inventory items
 *                       example: 145
 *                     total_quantity:
 *                       type: integer
 *                       description: Total quantity across all items
 *                       example: 12450
 *                     low_stock_count:
 *                       type: integer
 *                       description: Number of items below reorder level
 *                       example: 12
 *                     expired_count:
 *                       type: integer
 *                       description: Number of expired items
 *                       example: 3
 *                     total_value:
 *                       type: number
 *                       format: decimal
 *                       description: Total inventory value
 *                       example: 15420.75
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - insufficient permissions for store
 */
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

/**
 * @swagger
 * /api/inventory/bulk/adjust-stock:
 *   post:
 *     summary: Bulk adjust stock quantities
 *     description: Adjust multiple inventory items' quantities in a single operation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adjustments:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventory_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: Inventory item ID
 *                       example: 1
 *                     adjustment:
 *                       type: integer
 *                       description: Quantity adjustment
 *                       example: -5
 *                     reason:
 *                       type: string
 *                       maxLength: 255
 *                       description: Reason for adjustment
 *                       example: "Bulk inventory correction"
 *                   required: [inventory_id, adjustment]
 *             required: [adjustments]
 *           example:
 *             adjustments:
 *               - inventory_id: 1
 *                 adjustment: -5
 *                 reason: "Damaged goods"
 *               - inventory_id: 2
 *                 adjustment: 10
 *                 reason: "Found additional stock"
 *     responses:
 *       200:
 *         description: Bulk stock adjustment completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk stock adjustment completed"
 *                 successful:
 *                   type: integer
 *                   description: Number of successful adjustments
 *                   example: 8
 *                 failed:
 *                   type: integer
 *                   description: Number of failed adjustments
 *                   example: 2
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inventory_id:
 *                         type: integer
 *                       adjustment:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: "success"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inventory_id:
 *                         type: integer
 *                       error:
 *                         type: string
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (store admin required)
 */
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

/**
 * @swagger
 * /api/inventory/bulk/update:
 *   put:
 *     summary: Bulk update inventory items
 *     description: Update multiple inventory items' properties in a single operation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventory_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: Inventory item ID
 *                       example: 1
 *                     reorder_level:
 *                       type: integer
 *                       minimum: 0
 *                       description: New reorder level
 *                     unit_cost:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       description: New unit cost
 *                     selling_price:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       description: New selling price
 *                     supplier:
 *                       type: string
 *                       maxLength: 255
 *                       description: Supplier name
 *                   required: [inventory_id]
 *             required: [updates]
 *           example:
 *             updates:
 *               - inventory_id: 1
 *                 reorder_level: 25
 *                 unit_cost: 0.18
 *               - inventory_id: 2
 *                 selling_price: 0.35
 *                 supplier: "New Supplier Co"
 *     responses:
 *       200:
 *         description: Bulk inventory update completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk inventory update completed"
 *                 successful:
 *                   type: integer
 *                   description: Number of successful updates
 *                   example: 15
 *                 failed:
 *                   type: integer
 *                   description: Number of failed updates
 *                   example: 1
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inventory_id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: "success"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inventory_id:
 *                         type: integer
 *                       error:
 *                         type: string
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (store admin required)
 */
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

/**
 * @swagger
 * /api/inventory/{id}/fill-prescription:
 *   post:
 *     summary: Fill prescription
 *     description: Process a prescription fill, reducing inventory and creating audit trail
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to dispense
 *                 example: 30
 *               prescription_number:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Prescription reference number
 *                 example: "RX123456789"
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional notes
 *                 example: "30-day supply for patient John Doe"
 *             required: [quantity, prescription_number]
 *     responses:
 *       200:
 *         description: Prescription filled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Prescription filled successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "prescription_fill"
 *                     quantity:
 *                       type: integer
 *                       example: 30
 *                     prescription_number:
 *                       type: string
 *                       example: "RX123456789"
 *                     reason:
 *                       type: string
 *                       example: "30-day supply for patient John Doe"
 *       400:
 *         description: Validation error or insufficient quantity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/return-to-stock:
 *   post:
 *     summary: Return medication to stock
 *     description: Return previously dispensed medication back to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to return
 *                 example: 10
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for return
 *                 example: "Patient returned unused medication"
 *               reference_number:
 *                 type: string
 *                 maxLength: 100
 *                 description: Reference number (original prescription, etc.)
 *                 example: "RX123456789"
 *             required: [quantity]
 *     responses:
 *       200:
 *         description: Medication returned to stock successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medication returned to stock successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "return_to_stock"
 *                     quantity:
 *                       type: integer
 *                       example: 10
 *                     reason:
 *                       type: string
 *                       example: "Patient returned unused medication"
 *                     reference_number:
 *                       type: string
 *                       example: "RX123456789"
 *       400:
 *         description: Validation error or operation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/expire:
 *   post:
 *     summary: Expire medication
 *     description: Mark medication as expired and remove from available inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to expire
 *                 example: 25
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for expiration
 *                 example: "Expired on 2025-08-01"
 *             required: [quantity]
 *     responses:
 *       200:
 *         description: Medication expired successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medication expired successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "expire"
 *                     quantity:
 *                       type: integer
 *                       example: 25
 *                     reason:
 *                       type: string
 *                       example: "Expired on 2025-08-01"
 *       400:
 *         description: Validation error or insufficient quantity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/audit:
 *   post:
 *     summary: Audit inventory
 *     description: Perform inventory audit by setting actual counted quantity
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actual_quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Actual counted quantity
 *                 example: 85
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Audit reason/notes
 *                 example: "Monthly inventory count - discrepancy found"
 *             required: [actual_quantity, reason]
 *     responses:
 *       200:
 *         description: Inventory audit completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory audit completed successfully"
 *                 inventory:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 audit_result:
 *                   type: object
 *                   properties:
 *                     quantity_before:
 *                       type: integer
 *                       example: 90
 *                     quantity_after:
 *                       type: integer
 *                       example: 85
 *                     adjustment:
 *                       type: integer
 *                       example: -5
 *                     reason:
 *                       type: string
 *                       example: "Monthly inventory count - discrepancy found"
 *       400:
 *         description: Validation error or audit failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
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

/**
 * @swagger
 * /api/inventory/{id}/running-total:
 *   get:
 *     summary: Get running total for inventory item
 *     description: Retrieve running total of all transactions for a specific inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Running total retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventory_id:
 *                   type: integer
 *                   example: 1
 *                 drug_info:
 *                   type: object
 *                   properties:
 *                     generic_name:
 *                       type: string
 *                       example: "acetaminophen"
 *                     brand_name:
 *                       type: string
 *                       example: "Tylenol"
 *                     ndc:
 *                       type: string
 *                       example: "12345-678-90"
 *                 running_total:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLogEntry'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - insufficient permissions
 *       404:
 *         description: Inventory item not found
 */
// Get running total for inventory item
router.get('/:id/running-total', authenticateToken, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await StoreInventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Enhanced access control - restrict to user's assigned store or currently selected store for admin
    const currentStoreId = req.headers['x-current-store-id'] || req.user.store_id;
    
    if (req.user.role === 'god_mode') {
      // God mode can access any store
    } else if (req.user.role === 'admin') {
      // Admin can only access their assigned store or currently selected store
      if (inventory.store_id !== parseInt(currentStoreId)) {
        return res.status(403).json({ error: 'Access denied - inventory item not in current store context' });
      }
    } else {
      // Regular users can only access their assigned store
      if (req.user.store_id !== inventory.store_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
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

/**
 * @swagger
 * /api/inventory/store/{storeId}/consolidated:
 *   get:
 *     summary: Get consolidated inventory data for a store
 *     description: Returns all inventory data including items, stats, low stock, and expiring items in one optimized call
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering items
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: Filter for low stock items only
 *       - in: query
 *         name: expiring
 *         schema:
 *           type: boolean
 *         description: Filter for expiring items only
 *     responses:
 *       200:
 *         description: Consolidated inventory data
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
 *                     inventory:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     stats:
 *                       type: object
 *                     low_stock:
 *                       type: array
 *                     expiring:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/consolidated', authenticateToken, validateStoreParam, [
  verifyId('storeId'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean(),
  query('low_stock').optional().isBoolean().withMessage('Low stock must be boolean').toBoolean(),
  query('expiring').optional().isBoolean().withMessage('Expiring must be boolean').toBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    const { storeId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      active = true, 
      low_stock = false, 
      expiring = false 
    } = req.query;

    // Build consolidated response
    const consolidatedData = {
      inventory: [],
      pagination: {},
      stats: {},
      low_stock: [],
      expiring: []
    };

    // Prepare filter parameters for main inventory query
    const filters = {
      store_id: parseInt(storeId),
      is_active: active,
      search: search || undefined,
      low_stock: low_stock || undefined,
      expiring_days: expiring ? 30 : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );


    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Execute all queries in parallel for optimal performance
    const [
      inventoryResult,
      countResult,
      statsResult,
      lowStockResult,
      expiringResult
    ] = await Promise.allSettled([
      // Main inventory items with pagination
      StoreInventory.findWithFilters(filters, limit, offset),
      
      // Total count for pagination
      StoreInventory.countWithFilters(filters),
      
      // Inventory statistics
      StoreInventory.getStats(storeId),
      
      // Low stock items (top 10)
      StoreInventory.getLowStock(storeId, { limit: 10 }),
      
      // Expiring items (top 10, next 30 days)
      StoreInventory.getExpiring(storeId, { days: 30, limit: 10 })
    ]);

    // Process inventory result
    if (inventoryResult.status === 'fulfilled') {
      consolidatedData.inventory = inventoryResult.value || [];
    } else {
      console.error('Inventory query failed:', inventoryResult.reason);
    }

    // Process count result for pagination
    if (countResult.status === 'fulfilled') {
      const total = countResult.value || 0;
      consolidatedData.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };
    } else {
      console.error('Count query failed:', countResult.reason);
      consolidatedData.pagination = {
        page,
        limit,
        total: 0,
        pages: 0
      };
    }

    // Process stats result
    if (statsResult.status === 'fulfilled') {
      consolidatedData.stats = statsResult.value || {};
    } else {
      console.error('Stats query failed:', statsResult.reason);
    }

    // Process low stock result
    if (lowStockResult.status === 'fulfilled') {
      consolidatedData.low_stock = lowStockResult.value || [];
    } else {
      console.error('Low stock query failed:', lowStockResult.reason);
    }

    // Process expiring result
    if (expiringResult.status === 'fulfilled') {
      consolidatedData.expiring = expiringResult.value || [];
    } else {
      console.error('Expiring query failed:', expiringResult.reason);
    }
    
    
    res.json({
      success: true,
      data: consolidatedData
    });

  } catch (error) {
    console.error('Consolidated inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load inventory data'
    });
  }
});

module.exports = router;