const express = require('express');
const { validationResult, query } = require('express-validator');
const fdaService = require('../openfda/fdaService');
const Drug = require('../models/Drug');
const StoreInventory = require('../models/StoreInventory');
const { authenticateToken, requireStoreAdmin } = require('../middleware/auth');
const { 
  verifyNDC, 
  verifyName, 
  verifyQuantity, 
  verifyPrice, 
  verifyDate,
  verifyId 
} = require('../middleware/dataVerification');

const router = express.Router();

// Search FDA database
router.get('/search/fda', authenticateToken, [
  query('ndc').optional().matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format'),
  query('generic_name').optional().isLength({ min: 2, max: 100 }).withMessage('Generic name must be 2-100 characters'),
  query('brand_name').optional().isLength({ min: 2, max: 100 }).withMessage('Brand name must be 2-100 characters'),
  query('manufacturer').optional().isLength({ min: 2, max: 100 }).withMessage('Manufacturer must be 2-100 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc, generic_name, brand_name, manufacturer, limit = 10 } = req.query;
    let result;

    const startTime = Date.now();

    if (ndc) {
      result = await fdaService.searchByNDC(ndc);
    } else if (generic_name) {
      result = await fdaService.searchByGenericName(generic_name, limit);
    } else if (brand_name) {
      result = await fdaService.searchByBrandName(brand_name, limit);
    } else if (manufacturer) {
      result = await fdaService.searchByManufacturer(manufacturer, limit);
    } else {
      // Advanced search with multiple criteria
      const criteria = {};
      if (ndc) criteria.ndc = ndc;
      if (generic_name) criteria.genericName = generic_name;
      if (brand_name) criteria.brandName = brand_name;
      if (manufacturer) criteria.manufacturer = manufacturer;
      
      if (Object.keys(criteria).length === 0) {
        return res.status(400).json({ 
          error: 'At least one search parameter is required (ndc, generic_name, brand_name, or manufacturer)' 
        });
      }
      
      result = await fdaService.advancedSearch(criteria, limit);
    }

    const responseTime = Date.now() - startTime;

    // Log search for analytics (optional)
    // TODO: Implement search history logging

    res.json({
      results: result.data.results || [],
      total: result.data.meta?.results?.total || 0,
      fromCache: result.fromCache,
      responseTime: responseTime
    });

  } catch (error) {
    console.error('FDA search error:', error);
    res.status(500).json({ 
      error: 'Failed to search FDA database',
      message: error.message 
    });
  }
});

// Add drug to local database from FDA data
router.post('/add-from-fda', authenticateToken, requireStoreAdmin, [
  verifyNDC()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc } = req.body;

    // Search FDA for this NDC
    const fdaResult = await fdaService.searchByNDC(ndc);
    
    if (!fdaResult.data.results || fdaResult.data.results.length === 0) {
      return res.status(404).json({ error: 'Drug not found in FDA database' });
    }

    const fdaData = fdaResult.data.results[0];
    
    // Add to local database
    const drugId = await Drug.createFromFDA(fdaData);
    const drug = await Drug.findById(drugId);

    res.status(201).json({
      message: 'Drug added to database successfully',
      drug: drug
    });

  } catch (error) {
    console.error('Add drug error:', error);
    res.status(500).json({ 
      error: 'Failed to add drug to database',
      message: error.message 
    });
  }
});

// Search local drug database
router.get('/search', authenticateToken, [
  query('ndc').optional().matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format'),
  query('generic_name').optional().isLength({ min: 2, max: 100 }).withMessage('Generic name must be 2-100 characters'),
  query('brand_name').optional().isLength({ min: 2, max: 100 }).withMessage('Brand name must be 2-100 characters'),
  query('manufacturer').optional().isLength({ min: 2, max: 100 }).withMessage('Manufacturer must be 2-100 characters'),
  query('dosage_form').optional().isLength({ min: 2, max: 50 }).withMessage('Dosage form must be 2-50 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      ndc, 
      generic_name: genericName, 
      brand_name: brandName, 
      manufacturer, 
      dosage_form: dosageForm,
      limit = 20 
    } = req.query;

    const criteria = {};
    if (ndc) criteria.ndc = ndc.replace(/[^\d]/g, '');
    if (genericName) criteria.genericName = genericName;
    if (brandName) criteria.brandName = brandName;
    if (manufacturer) criteria.manufacturer = manufacturer;
    if (dosageForm) criteria.dosageForm = dosageForm;

    const drugs = await Drug.search(criteria, limit);

    res.json({
      drugs: drugs,
      total: drugs.length
    });

  } catch (error) {
    console.error('Drug search error:', error);
    res.status(500).json({ 
      error: 'Failed to search drug database',
      message: error.message 
    });
  }
});

// Get drug by ID
router.get('/:id', authenticateToken, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await Drug.findById(id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json({ drug });

  } catch (error) {
    console.error('Get drug error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve drug',
      message: error.message 
    });
  }
});

// Get store inventory
router.get('/inventory/:storeId', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { low_stock, expiring_soon, active_only = 'true' } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filters = {
      activeOnly: active_only === 'true',
      lowStock: low_stock === 'true',
      expiringSoon: expiring_soon === 'true'
    };

    const inventory = await StoreInventory.getByStore(storeId, filters);

    res.json({
      inventory: inventory,
      total: inventory.length
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory',
      message: error.message 
    });
  }
});

// Add drug to store inventory
router.post('/inventory', authenticateToken, requireStoreAdmin, [
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

    const inventoryId = await StoreInventory.add(inventoryData);
    const inventory = await StoreInventory.findById(inventoryId);

    res.status(201).json({
      message: 'Drug added to inventory successfully',
      inventory: inventory
    });

  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to add drug to inventory',
      message: error.message 
    });
  }
});

// Update inventory item
router.put('/inventory/:id', authenticateToken, requireStoreAdmin, [
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

// Get low stock items
router.get('/inventory/:storeId/low-stock', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lowStock = await StoreInventory.getLowStock(storeId);

    res.json({
      lowStock: lowStock,
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
router.get('/inventory/:storeId/expiring', authenticateToken, [
  verifyId('storeId'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365').toInt()
], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expiring = await StoreInventory.getExpiring(storeId, days);

    res.json({
      expiring: expiring,
      total: expiring.length,
      days: days
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
router.get('/inventory/:storeId/stats', authenticateToken, [verifyId('storeId')], async (req, res) => {
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

// FDA cache statistics (admin only)
router.get('/fda/cache-stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const cacheStats = fdaService.getCacheStats();
    res.json({ cacheStats });

  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve cache statistics',
      message: error.message 
    });
  }
});

module.exports = router;