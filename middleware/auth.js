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
    console.log('🔐 DEBUG AUTH: Decoded JWT userId:', decoded.userId);
    const user = await User.findById(decoded.userId);
    console.log('🔐 DEBUG AUTH: Found user:', user ? `${user.name} (${user.role})` : 'null');
    
    if (!user || !user.is_active) {
      console.log('❌ DEBUG AUTH: User invalid or inactive');
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('❌ DEBUG AUTH: Token verification failed:', error.message);
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

const requireAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'god_mode') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireStoreAdmin = async (req, res, next) => {
  console.log('🔐 requireStoreAdmin check:', { 
    userId: req.user.id, 
    userRole: req.user.role,
    hasAdminRole: req.user.role === 'admin' || req.user.role === 'god_mode'
  });
  
  if (req.user.role !== 'admin' && req.user.role !== 'god_mode') {
    console.log('❌ Access denied - user role is not admin or god_mode');
    return res.status(403).json({ error: 'Store admin access required' });
  }
  
  console.log('✅ Admin/God mode access granted');
  next();
};

const requireSameStoreOrAdmin = async (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin' || req.user.role === 'god_mode') {
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

const generateToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '24h');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdminRole,
  requireStoreAdmin,
  requireSameStoreOrAdmin,
  generateToken
};