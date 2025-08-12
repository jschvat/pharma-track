const express = require('express');
const { validationResult, body } = require('express-validator');
const UserStoreAccess = require('../models/UserStoreAccess');
const { authenticateToken } = require('../middleware/auth');
const { verifyId } = require('../middleware/dataVerification');

const router = express.Router();

// Get all stores user has access to
router.get('/my-stores', authenticateToken, async (req, res) => {
  try {
    const stores = await UserStoreAccess.getUserStores(req.user.id);
    
    res.json({
      stores,
      activeStoreId: req.user.active_store_id,
      total: stores.length
    });
  } catch (error) {
    console.error('Get user stores error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve accessible stores',
      message: error.message 
    });
  }
});

// Get user's current active store
router.get('/active-store', authenticateToken, async (req, res) => {
  try {
    const activeStore = await UserStoreAccess.getActiveStore(req.user.id);
    
    if (!activeStore) {
      return res.status(400).json({ 
        error: 'No active store set',
        requiresStoreSelection: true 
      });
    }
    
    res.json({ activeStore });
  } catch (error) {
    console.error('Get active store error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve active store',
      message: error.message 
    });
  }
});

// Set active store for user
router.post('/set-active-store', authenticateToken, [
  body('storeId').isInt({ min: 1 }).withMessage('Valid store ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.body;
    
    // Verify user has access to this store
    const hasAccess = await UserStoreAccess.hasStoreAccess(req.user.id, storeId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to selected store' });
    }

    const success = await UserStoreAccess.setActiveStore(req.user.id, storeId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to set active store' });
    }

    // Get updated active store information
    const activeStore = await UserStoreAccess.getActiveStore(req.user.id);
    
    res.json({
      message: 'Active store updated successfully',
      activeStore
    });
  } catch (error) {
    console.error('Set active store error:', error);
    res.status(500).json({ 
      error: 'Failed to set active store',
      message: error.message 
    });
  }
});

// Grant store access to a user (admin only)
router.post('/grant-access', authenticateToken, [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('storeId').isInt({ min: 1 }).withMessage('Valid store ID required'),
  body('accessLevel').isIn(['user', 'admin']).withMessage('Access level must be user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, storeId, accessLevel } = req.body;
    
    // Check if requesting user has admin access to this store
    const hasAdminAccess = await UserStoreAccess.hasStoreAccess(req.user.id, storeId, 'admin');
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Admin access required to grant store access' });
    }

    const success = await UserStoreAccess.grantStoreAccess(userId, storeId, accessLevel, req.user.id);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to grant store access' });
    }

    res.json({
      message: 'Store access granted successfully',
      userId,
      storeId,
      accessLevel,
      grantedBy: req.user.id
    });
  } catch (error) {
    console.error('Grant store access error:', error);
    res.status(500).json({ 
      error: 'Failed to grant store access',
      message: error.message 
    });
  }
});

// Revoke store access from a user (admin only)
router.post('/revoke-access', authenticateToken, [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('storeId').isInt({ min: 1 }).withMessage('Valid store ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, storeId } = req.body;
    
    // Check if requesting user has admin access to this store
    const hasAdminAccess = await UserStoreAccess.hasStoreAccess(req.user.id, storeId, 'admin');
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Admin access required to revoke store access' });
    }

    // Prevent self-revocation if it's the last admin access
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot revoke your own store access' });
    }

    const success = await UserStoreAccess.revokeStoreAccess(userId, storeId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to revoke store access or user has no access' });
    }

    res.json({
      message: 'Store access revoked successfully',
      userId,
      storeId,
      revokedBy: req.user.id
    });
  } catch (error) {
    console.error('Revoke store access error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke store access',
      message: error.message 
    });
  }
});

// Get all users with access to a specific store (admin only)
router.get('/store/:storeId/users', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Check if requesting user has admin access to this store
    const hasAdminAccess = await UserStoreAccess.hasStoreAccess(req.user.id, parseInt(storeId), 'admin');
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Admin access required to view store users' });
    }

    const users = await UserStoreAccess.getStoreUsers(parseInt(storeId));
    
    res.json({
      users,
      storeId: parseInt(storeId),
      total: users.length
    });
  } catch (error) {
    console.error('Get store users error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve store users',
      message: error.message 
    });
  }
});

module.exports = router;