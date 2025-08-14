/**
 * Transactional Drug Routes
 * 
 * Demonstrates transaction-protected CRUD operations for drugs and inventory.
 * All operations ensure data integrity through MySQL transactions.
 * 
 * Features:
 * - Atomic drug + inventory creation
 * - Safe inventory transfers between stores  
 * - Quantity updates with audit trails
 * - Protected delete operations
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const Drug = require('../models/Drug');
const { 
  withTransaction, 
  updateInventoryQuantity, 
  transferInventory 
} = require('../utils/transactionHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateDrugData, validateInventoryData } = require('../middleware/validation');

/**
 * Create drug with initial inventory (atomic operation)
 * POST /api/drugs/with-inventory
 */
router.post('/with-inventory', 
  authenticateToken, 
  requireRole(['admin', 'manager']),
  validateDrugData,
  validateInventoryData,
  async (req, res) => {
    try {
      const { drug, inventory } = req.body;
      
      // Add user context to inventory data
      inventory.user_id = req.user.id;
      
      // Create drug and inventory in single transaction
      const result = await Drug.createWithInventory(drug, inventory);
      
      res.status(201).json({
        success: true,
        message: 'Drug and inventory created successfully',
        data: result
      });
      
    } catch (error) {
      console.error('Create drug with inventory error:', error);
      res.status(500).json({
        error: error.message || 'Failed to create drug with inventory'
      });
    }
  }
);

/**
 * Update inventory quantity with audit trail
 * PUT /api/drugs/inventory/:id/quantity
 */
router.put('/inventory/:id/quantity',
  authenticateToken,
  requireRole(['admin', 'manager', 'staff']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      
      // Validate input
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          error: 'Invalid quantity. Must be a non-negative number.'
        });
      }
      
      // Update quantity with transaction protection
      const success = await updateInventoryQuantity(
        parseInt(id),
        quantity,
        req.user.id,
        reason || 'Quantity adjustment'
      );
      
      if (!success) {
        return res.status(404).json({
          error: 'Inventory record not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Inventory quantity updated successfully'
      });
      
    } catch (error) {
      console.error('Update inventory quantity error:', error);
      res.status(500).json({
        error: error.message || 'Failed to update inventory quantity'
      });
    }
  }
);

/**
 * Transfer inventory between stores
 * POST /api/drugs/inventory/transfer
 */
router.post('/inventory/transfer',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { fromStoreId, toStoreId, drugId, quantity, reason } = req.body;
      
      // Validate input
      if (!fromStoreId || !toStoreId || !drugId || !quantity) {
        return res.status(400).json({
          error: 'Missing required fields: fromStoreId, toStoreId, drugId, quantity'
        });
      }
      
      if (fromStoreId === toStoreId) {
        return res.status(400).json({
          error: 'Source and destination stores cannot be the same'
        });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({
          error: 'Quantity must be greater than 0'
        });
      }
      
      // Execute transfer with transaction protection
      const result = await transferInventory({
        fromStoreId: parseInt(fromStoreId),
        toStoreId: parseInt(toStoreId),
        drugId: parseInt(drugId),
        quantity: parseInt(quantity),
        userId: req.user.id,
        reason: reason || 'Store transfer'
      });
      
      res.json({
        success: true,
        message: 'Inventory transferred successfully',
        data: result
      });
      
    } catch (error) {
      console.error('Transfer inventory error:', error);
      res.status(500).json({
        error: error.message || 'Failed to transfer inventory'
      });
    }
  }
);

/**
 * Bulk update multiple inventory records (transactional)
 * PUT /api/drugs/inventory/bulk-update
 */
router.put('/inventory/bulk-update',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          error: 'Updates array is required and must not be empty'
        });
      }
      
      // Validate each update
      for (const update of updates) {
        if (!update.inventoryId || typeof update.quantity !== 'number' || update.quantity < 0) {
          return res.status(400).json({
            error: 'Each update must have inventoryId and valid quantity'
          });
        }
      }
      
      // Execute all updates in a single transaction
      const result = await withTransaction(async (connection) => {
        const results = [];
        
        for (const update of updates) {
          // Get current inventory data
          const [currentData] = await connection.execute(
            'SELECT * FROM store_inventory WHERE id = ?',
            [update.inventoryId]
          );
          
          if (currentData.length === 0) {
            throw new Error(`Inventory record ${update.inventoryId} not found`);
          }
          
          const oldQuantity = currentData[0].quantity_on_hand;
          
          // Update inventory
          const [updateResult] = await connection.execute(
            'UPDATE store_inventory SET quantity_on_hand = ?, last_updated = NOW() WHERE id = ?',
            [update.quantity, update.inventoryId]
          );
          
          // Create audit entry
          await connection.execute(`
            INSERT INTO audit_trail (
              table_name, operation, record_id, user_id, changes, timestamp
            ) VALUES (?, ?, ?, ?, ?, NOW())
          `, [
            'store_inventory',
            'BULK_UPDATE',
            update.inventoryId,
            req.user.id,
            JSON.stringify({
              field: 'quantity_on_hand',
              old_value: oldQuantity,
              new_value: update.quantity,
              reason: update.reason || 'Bulk inventory update'
            })
          ]);
          
          results.push({
            inventoryId: update.inventoryId,
            oldQuantity,
            newQuantity: update.quantity,
            success: updateResult.affectedRows > 0
          });
        }
        
        return results;
      });
      
      res.json({
        success: true,
        message: `Successfully updated ${result.length} inventory records`,
        data: result
      });
      
    } catch (error) {
      console.error('Bulk update inventory error:', error);
      res.status(500).json({
        error: error.message || 'Failed to bulk update inventory'
      });
    }
  }
);

/**
 * Protected drug deletion with dependency checks
 * DELETE /api/drugs/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Use transaction-protected delete
      const success = await Drug.delete(parseInt(id), req.user.id);
      
      if (!success) {
        return res.status(404).json({
          error: 'Drug not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Drug deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete drug error:', error);
      
      // Provide specific error messages for common issues
      if (error.message.includes('currently in active inventory')) {
        return res.status(409).json({
          error: 'Cannot delete drug that is currently in active inventory'
        });
      }
      
      res.status(500).json({
        error: error.message || 'Failed to delete drug'
      });
    }
  }
);

module.exports = router;