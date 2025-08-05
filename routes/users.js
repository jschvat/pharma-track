const express = require('express');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Store = require('../models/Store');
const { authenticateToken, requireStoreAdmin, requireSameStoreOrAdmin } = require('../middleware/auth');
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

router.post('/', authenticateToken, requireStoreAdmin, [
  verifyName(),
  verifyEmail(),
  verifyPhoneNumber(),
  verifyPassword(),
  verifyAddress(),
  verifyRole()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, address, role = 'user' } = req.body;

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
      store_id: req.user.store_id,
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

router.get('/', authenticateToken, async (req, res) => {
  try {
    let users;
    
    if (req.user.role === 'admin') {
      users = await User.findByStoreId(req.user.store_id);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', authenticateToken, requireSameStoreOrAdmin, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role !== 'admin' && user.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
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

router.put('/:id', authenticateToken, requireSameStoreOrAdmin, [
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

    if (req.user.role !== 'admin' && user.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role !== 'admin' && (role !== undefined || is_active !== undefined)) {
      return res.status(403).json({ error: 'Only admins can change role or active status' });
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

router.delete('/:id', authenticateToken, requireStoreAdmin, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Can only delete users from your store' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
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