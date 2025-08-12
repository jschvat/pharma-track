const express = require('express');
const { validationResult, query, body } = require('express-validator');
const User = require('../models/User');
const Store = require('../models/Store');
const { authenticateToken, requireStoreAdmin, requireSameStoreOrAdmin, requireRole } = require('../middleware/auth');
const { 
  verifyName, 
  verifyEmail, 
  verifyPhoneNumber, 
  verifyPassword, 
  verifyAddress, 
  verifyRole, 
  verifyBoolean,
  verifyId
} = require('../middleware/dataVerification');

const router = express.Router();

// Debug endpoint to test if route is reachable
router.get('/debug', (req, res) => {
  res.json({ message: 'Users route is working', timestamp: new Date().toISOString() });
});

// Get stores available to admin for user assignment
router.get('/available-stores', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    // For now, admin can only manage their own store
    // In future, this could be expanded to support multiple stores per admin
    const store = await Store.findById(req.user.store_id);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json({
      stores: [{
        id: store.id,
        name: store.name,
        address: store.address
      }]
    });
    
  } catch (error) {
    console.error('Get available stores error:', error);
    res.status(500).json({ error: 'Failed to fetch available stores' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), [
  verifyName(),
  verifyEmail(),
  verifyPhoneNumber(),
  verifyPassword(),
  verifyAddress(),
  verifyRole(),
  body('store_id')
    .isInt({ min: 1 })
    .withMessage('Store ID is required and must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, phone, password, address, role = 'user', store_id } = req.body;

    // Admin must specify a store_id when creating users
    if (!store_id) {
      return res.status(400).json({ error: 'Store assignment is required' });
    }
    
    let targetStoreId = store_id;

    // Verify the store exists
    const store = await Store.findById(targetStoreId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = await User.create({
      name,
      email,
      phone,
      password,
      address,
      store_id: targetStoreId,
      role
    });

    const user = await User.findById(userId);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        store_id: user.store_id,
        role: user.role,
        is_active: user.is_active,
        date_created: user.date_created
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users (with filtering and pagination) - Admin access to all users
router.get('/', authenticateToken, requireRole('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('store_id').optional().isInt({ min: 1 }).withMessage('Store ID must be positive integer').toInt(),
  query('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean(),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, store_id, role, active, search } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (store_id) filters.store_id = store_id;
    if (role) filters.role = role;
    if (active !== undefined) filters.is_active = active;
    if (search) filters.search = search;

    const users = await User.findWithFilters(filters, limit, offset);
    const total = await User.countWithFilters(filters);

    res.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all users across all stores (super admin only)
router.get('/all', authenticateToken, requireRole('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('store_id').optional().isInt({ min: 1 }).withMessage('Store ID must be positive integer').toInt(),
  query('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean(),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, store_id, role, active, search } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (store_id) filters.store_id = store_id;
    if (role) filters.role = role;
    if (active !== undefined) filters.is_active = active;
    if (search) filters.search = search;

    const users = await User.findWithFilters(filters, limit, offset);
    const total = await User.countWithFilters(filters);

    res.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', authenticateToken, requireRole('admin'), [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        store_id: user.store_id,
        role: user.role,
        is_active: user.is_active,
        date_created: user.date_created
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), [
  verifyId(),
  verifyName().optional(),
  verifyPhoneNumber().optional(),
  verifyAddress().optional(),
  verifyRole().optional(),
  verifyBoolean('is_active')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, phone, address, role, is_active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await User.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedUser = await User.findById(id);
    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        store_id: updatedUser.store_id,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        date_created: updatedUser.date_created
      }
    });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user password
router.put('/:id/password', authenticateToken, requireRole('admin'), [
  verifyId(),
  verifyPassword('new_password')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { new_password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await User.updatePassword(id, new_password);
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // If trying to delete an admin, check if they're the last admin in their store
    if (user.role === 'admin' && user.store_id) {
      const adminsInStore = await User.findWithFilters({ 
        role: 'admin', 
        store_id: user.store_id,
        is_active: true 
      }, 100, 0);
      
      const activeAdminsInStore = adminsInStore.filter(admin => admin.is_active);
      
      if (activeAdminsInStore.length <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last admin for this store. Each store must have at least one admin.' 
        });
      }
    }

    const deleted = await User.delete(id);
    if (!deleted) {
      return res.status(400).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;