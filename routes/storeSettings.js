const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { dataVerification } = require('../middleware/dataVerification');
const rateLimit = require('express-rate-limit');

// Rate limiting for settings operations
const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many settings requests from this IP, please try again later.' }
});

// Middleware to check if user is admin of the specific store
const requireStoreAdmin = async (req, res, next) => {
  try {
    const store_id = req.params.storeId || req.body.store_id;
    
    if (!store_id) {
      return res.status(400).json({ error: 'Store ID is required' });
    }
    
    const hasAccess = await StoreSettings.validateStoreAdminAccess(req.user.id, store_id);
    
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Must be store admin or system admin.' });
    }
    
    next();
  } catch (error) {
    console.error('Store admin validation error:', error);
    res.status(500).json({ error: 'Failed to validate store admin access' });
  }
};

// Apply rate limiting to all routes
router.use(settingsLimiter);

// GET /api/stores/:storeId/settings - Get all settings for a store
router.get('/:storeId/settings', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { is_system, setting_key } = req.query;
    
    const filters = {};
    if (is_system !== undefined) {
      filters.is_system = is_system === 'true';
    }
    if (setting_key) {
      filters.setting_key = setting_key;
    }
    
    const settings = await StoreSettings.findByStore(parseInt(storeId), filters);
    
    res.json({
      success: true,
      settings,
      count: settings.length
    });
    
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve store settings' });
  }
});

// GET /api/stores/:storeId/settings/defaults - Get default settings as key-value object
router.get('/:storeId/settings/defaults', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Allow any authenticated user to read default settings for their store
    if (req.user.active_store_id !== parseInt(storeId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Can only access your active store settings.' });
    }
    
    const settings = await StoreSettings.getDefaultSettings(parseInt(storeId));
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Get default settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve default settings' });
  }
});

// GET /api/stores/:storeId/settings/:settingId - Get specific setting
router.get('/:storeId/settings/:settingId', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const { settingId } = req.params;
    
    const setting = await StoreSettings.findById(parseInt(settingId));
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({
      success: true,
      setting
    });
    
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to retrieve setting' });
  }
});

// POST /api/stores/:storeId/settings - Create new setting
router.post('/:storeId/settings', 
  authenticateToken, 
  requireStoreAdmin,
  dataVerification([
    { field: 'setting_key', type: 'string', required: true, maxLength: 100 },
    { field: 'setting_value', type: 'any', required: true },
    { field: 'description', type: 'string', required: false, maxLength: 500 },
    { field: 'data_type', type: 'string', required: false, enum: ['string', 'number', 'boolean', 'json', 'array'] },
    { field: 'is_system', type: 'boolean', required: false }
  ]),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { setting_key, setting_value, description, data_type = 'string', is_system = false } = req.body;
      
      // Check if setting already exists
      const existing = await StoreSettings.findByStoreAndKey(parseInt(storeId), setting_key);
      if (existing) {
        return res.status(409).json({ error: 'Setting already exists for this store' });
      }
      
      const settingId = await StoreSettings.create({
        store_id: parseInt(storeId),
        setting_key,
        setting_value,
        description,
        data_type,
        is_system,
        created_by: req.user.id,
        updated_by: req.user.id
      });
      
      const newSetting = await StoreSettings.findById(settingId);
      
      res.status(201).json({
        success: true,
        message: 'Setting created successfully',
        setting: newSetting
      });
      
    } catch (error) {
      console.error('Create setting error:', error);
      res.status(500).json({ error: 'Failed to create setting' });
    }
  }
);

// PUT /api/stores/:storeId/settings/:settingId - Update setting
router.put('/:storeId/settings/:settingId',
  authenticateToken,
  requireStoreAdmin,
  dataVerification([
    { field: 'setting_value', type: 'any', required: false },
    { field: 'description', type: 'string', required: false, maxLength: 500 },
    { field: 'data_type', type: 'string', required: false, enum: ['string', 'number', 'boolean', 'json', 'array'] }
  ]),
  async (req, res) => {
    try {
      const { settingId } = req.params;
      const updateData = req.body;
      
      const updated = await StoreSettings.update(parseInt(settingId), updateData, req.user.id);
      
      if (!updated) {
        return res.status(404).json({ error: 'Setting not found or no changes made' });
      }
      
      const updatedSetting = await StoreSettings.findById(parseInt(settingId));
      
      res.json({
        success: true,
        message: 'Setting updated successfully',
        setting: updatedSetting
      });
      
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }
);

// DELETE /api/stores/:storeId/settings/:settingId - Delete setting
router.delete('/:storeId/settings/:settingId', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const { settingId } = req.params;
    
    const deleted = await StoreSettings.delete(parseInt(settingId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// GET /api/stores/:storeId/settings/:settingKey/history - Get setting change history
router.get('/:storeId/settings/:settingKey/history', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const { storeId, settingKey } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await StoreSettings.getSettingHistory(
      parseInt(storeId),
      settingKey === 'all' ? null : settingKey,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      history,
      count: history.length
    });
    
  } catch (error) {
    console.error('Get setting history error:', error);
    res.status(500).json({ error: 'Failed to retrieve setting history' });
  }
});

// POST /api/stores/:storeId/settings/initialize - Initialize default settings for store
router.post('/:storeId/settings/initialize', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const initialized = await StoreSettings.initializeDefaultSettings(parseInt(storeId), req.user.id);
    
    if (!initialized) {
      return res.status(500).json({ error: 'Failed to initialize default settings' });
    }
    
    const settings = await StoreSettings.findByStore(parseInt(storeId));
    
    res.json({
      success: true,
      message: 'Default settings initialized successfully',
      settings
    });
    
  } catch (error) {
    console.error('Initialize settings error:', error);
    res.status(500).json({ error: 'Failed to initialize default settings' });
  }
});

// PATCH /api/stores/:storeId/settings/bulk - Bulk update multiple settings
router.patch('/:storeId/settings/bulk',
  authenticateToken,
  requireStoreAdmin,
  dataVerification([
    { field: 'settings', type: 'array', required: true }
  ]),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { settings } = req.body;
      
      const results = [];
      const errors = [];
      
      for (const setting of settings) {
        try {
          const { setting_key, setting_value } = setting;
          
          const existing = await StoreSettings.findByStoreAndKey(parseInt(storeId), setting_key);
          
          if (existing) {
            const updated = await StoreSettings.update(existing.id, { setting_value }, req.user.id);
            results.push({ setting_key, updated });
          } else {
            const settingId = await StoreSettings.create({
              store_id: parseInt(storeId),
              setting_key,
              setting_value,
              description: `Auto-created setting for ${setting_key}`,
              data_type: typeof setting_value,
              is_system: false,
              created_by: req.user.id,
              updated_by: req.user.id
            });
            results.push({ setting_key, created: settingId });
          }
        } catch (error) {
          errors.push({ setting_key: setting.setting_key, error: error.message });
        }
      }
      
      res.json({
        success: errors.length === 0,
        message: `Processed ${results.length} settings`,
        results,
        errors
      });
      
    } catch (error) {
      console.error('Bulk update settings error:', error);
      res.status(500).json({ error: 'Failed to bulk update settings' });
    }
  }
);

module.exports = router;