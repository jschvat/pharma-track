const express = require('express');
const { validationResult, query, body } = require('express-validator');
const Store = require('../models/Store');
const User = require('../models/User');
const { authenticateToken, requireRole, requireAdminRole } = require('../middleware/auth');
const { 
  verifyName, 
  verifyAddress, 
  verifyCity,
  verifyState, 
  verifyZipcode, 
  verifyPhoneNumber, 
  verifyFaxNumber, 
  verifyDeaNumber, 
  verifyNpiNumber,
  verifyId
} = require('../middleware/dataVerification');

const router = express.Router();

router.post('/', authenticateToken, requireAdminRole, [
  verifyName(),
  verifyAddress(),
  verifyCity(),
  verifyState(),
  verifyZipcode(),
  verifyPhoneNumber(),
  verifyFaxNumber(),
  verifyDeaNumber(),
  verifyNpiNumber(),
  body('admin_user_id').optional().isInt({ min: 1 }).withMessage('Valid admin user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, city, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = req.body;

    const existingDeaStore = await Store.findByDeaNumber(dea_registration_number);
    if (existingDeaStore) {
      return res.status(400).json({ error: 'DEA registration number already exists' });
    }

    const existingNpiStore = await Store.findByNpi(npi);
    if (existingNpiStore) {
      return res.status(400).json({ error: 'NPI number already exists' });
    }

    if (admin_user_id) {
      const adminUser = await User.findById(admin_user_id);
      if (!adminUser) {
        return res.status(400).json({ error: 'Admin user not found' });
      }
    }

    const storeId = await Store.create({
      name,
      address,
      city,
      state,
      zipcode,
      phone,
      fax,
      dea_registration_number,
      npi,
      admin_user_id
    });

    const store = await Store.findById(storeId);

    res.status(201).json({
      message: 'Store created successfully',
      store
    });

  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Get all stores with filtering and pagination
router.get('/', authenticateToken, requireAdminRole, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('state').optional().isLength({ min: 2, max: 2 }).withMessage('State must be 2 characters'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters'),
  query('admin_only').optional().isBoolean().withMessage('Admin only must be boolean').toBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, state, search, admin_only } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (state) filters.state = state.toUpperCase();
    if (search) filters.search = search;
    if (admin_only) filters.admin_user_id = req.user.id;

    const stores = await Store.findWithFilters(filters, limit, offset);
    const total = await Store.countWithFilters(filters);

    console.log(`📊 Stores API: Found ${stores.length} stores, total: ${total}`);
    
    res.json({ 
      stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get store statistics
router.get('/stats', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const stats = await Store.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({ error: 'Failed to fetch store statistics' });
  }
});

router.get('/:id', authenticateToken, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

router.put('/:id', authenticateToken, requireAdminRole, [
  verifyId(),
  verifyName().optional(),
  verifyAddress().optional(),
  verifyCity().optional(),
  verifyState().optional(),
  verifyZipcode().optional(),
  verifyPhoneNumber().optional(),
  verifyFaxNumber().optional(),
  verifyDeaNumber().optional(),
  verifyNpiNumber().optional(),
  body('admin_user_id').optional().isInt({ min: 1 }).withMessage('Valid admin user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, address, city, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (dea_registration_number && dea_registration_number !== store.dea_registration_number) {
      const existingDeaStore = await Store.findByDeaNumber(dea_registration_number);
      if (existingDeaStore) {
        return res.status(400).json({ error: 'DEA registration number already exists' });
      }
    }

    if (npi && npi !== store.npi) {
      const existingNpiStore = await Store.findByNpi(npi);
      if (existingNpiStore) {
        return res.status(400).json({ error: 'NPI number already exists' });
      }
    }

    if (admin_user_id) {
      const adminUser = await User.findById(admin_user_id);
      if (!adminUser) {
        return res.status(400).json({ error: 'Admin user not found' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state) updateData.state = state;
    if (zipcode) updateData.zipcode = zipcode;
    if (phone) updateData.phone = phone;
    if (fax !== undefined) updateData.fax = fax;
    if (dea_registration_number) updateData.dea_registration_number = dea_registration_number;
    if (npi) updateData.npi = npi;
    if (admin_user_id !== undefined) updateData.admin_user_id = admin_user_id;

    const updated = await Store.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedStore = await Store.findById(id);
    res.json({
      message: 'Store updated successfully',
      store: updatedStore
    });

  } catch (error) {
    console.error('Store update error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

router.delete('/:id', authenticateToken, requireAdminRole, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const deleted = await Store.delete(id);
    if (!deleted) {
      return res.status(400).json({ error: 'Failed to delete store' });
    }

    res.json({ message: 'Store deleted successfully' });

  } catch (error) {
    console.error('Store deletion error:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

module.exports = router;