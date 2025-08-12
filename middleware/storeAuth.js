const UserStoreAccess = require('../models/UserStoreAccess');

/**
 * Middleware to ensure user has access to their active store
 */
const requireActiveStore = async (req, res, next) => {
  try {
    if (!req.user || !req.user.active_store_id) {
      return res.status(400).json({ 
        error: 'No active store selected',
        requiresStoreSelection: true 
      });
    }

    // Verify user still has access to their active store
    const hasAccess = await UserStoreAccess.hasStoreAccess(
      req.user.id, 
      req.user.active_store_id
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access to active store revoked',
        requiresStoreSelection: true 
      });
    }

    next();
  } catch (error) {
    console.error('Active store validation error:', error);
    res.status(500).json({ error: 'Store access validation failed' });
  }
};

/**
 * Middleware to ensure user has access to a specific store
 * @param {string} storeIdParam - Parameter name containing store ID (default: 'storeId')
 * @param {string} accessLevel - Required access level ('user' or 'admin')
 */
const requireStoreAccess = (storeIdParam = 'storeId', accessLevel = 'user') => {
  return async (req, res, next) => {
    try {
      const storeId = req.params[storeIdParam] || req.body[storeIdParam] || req.query[storeIdParam];
      
      if (!storeId) {
        return res.status(400).json({ error: `Store ID parameter '${storeIdParam}' is required` });
      }

      const hasAccess = await UserStoreAccess.hasStoreAccess(
        req.user.id, 
        parseInt(storeId), 
        accessLevel
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: `Insufficient access to store ${storeId}`,
          requiredLevel: accessLevel
        });
      }

      // Add store info to request for convenience
      req.storeId = parseInt(storeId);
      next();
    } catch (error) {
      console.error('Store access validation error:', error);
      res.status(500).json({ error: 'Store access validation failed' });
    }
  };
};

/**
 * Middleware to ensure user can only access their active store
 * Automatically uses the user's active store ID
 */
const restrictToActiveStore = (accessLevel = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.active_store_id) {
        return res.status(400).json({ 
          error: 'No active store selected',
          requiresStoreSelection: true 
        });
      }

      const hasAccess = await UserStoreAccess.hasStoreAccess(
        req.user.id, 
        req.user.active_store_id, 
        accessLevel
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: `Insufficient access to active store`,
          requiredLevel: accessLevel
        });
      }

      // Add active store info to request
      req.storeId = req.user.active_store_id;
      next();
    } catch (error) {
      console.error('Active store restriction error:', error);
      res.status(500).json({ error: 'Store access validation failed' });
    }
  };
};

/**
 * Middleware to validate store ID in URL matches user's permissions
 * Used for routes like /inventory/store/:storeId
 */
const validateStoreParam = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    
    if (!storeId) {
      return next(); // Let other validation handle missing storeId
    }

    const hasAccess = await UserStoreAccess.hasStoreAccess(
      req.user.id, 
      parseInt(storeId)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        error: `Access denied to store ${storeId}`
      });
    }

    req.storeId = parseInt(storeId);
    next();
  } catch (error) {
    console.error('Store parameter validation error:', error);
    res.status(500).json({ error: 'Store validation failed' });
  }
};

/**
 * Middleware to validate user has access to the store that owns the inventory item
 * Used for routes like /inventory/:id
 */
const validateInventoryAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return next(); // Let other validation handle missing id
    }

    // Get inventory item to find its store
    const StoreInventory = require('../models/StoreInventory');
    const inventory = await StoreInventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user has access to the inventory item's store
    const hasAccess = await UserStoreAccess.hasStoreAccess(
      req.user.id, 
      inventory.store_id
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied to inventory item'
      });
    }

    // Add store info to request
    req.storeId = inventory.store_id;
    req.inventoryItem = inventory;
    next();
  } catch (error) {
    console.error('Inventory access validation error:', error);
    res.status(500).json({ error: 'Access validation failed' });
  }
};

module.exports = {
  requireActiveStore,
  requireStoreAccess,
  restrictToActiveStore,
  validateStoreParam,
  validateInventoryAccess
};