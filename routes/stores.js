const express = require('express');
const { validationResult } = require('express-validator');
const Store = require('../models/Store');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  verifyName, 
  verifyAddress, 
  verifyState, 
  verifyZipcode, 
  verifyPhoneNumber, 
  verifyFaxNumber, 
  verifyDeaNumber, 
  verifyNpiNumber,
  verifyId
} = require('../middleware/dataVerification');

const router = express.Router();

router.post('/', authenticateToken, requireRole('admin'), [
  verifyName(),
  verifyAddress(),
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

    const { name, address, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = req.body;

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

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stores = await Store.findAll();
    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
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

router.put('/:id', authenticateToken, requireRole('admin'), [
  verifyId(),
  verifyName().optional(),
  verifyAddress().optional(),
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
    const { name, address, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = req.body;

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

router.delete('/:id', authenticateToken, requireRole('admin'), [verifyId()], async (req, res) => {
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