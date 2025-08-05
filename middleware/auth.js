const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
};

const requireStoreAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Store admin access required' });
  }
  next();
};

const requireSameStoreOrAdmin = async (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin') {
    return next();
  }

  if (targetUserId) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  next();
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireStoreAdmin,
  requireSameStoreOrAdmin,
  generateToken
};