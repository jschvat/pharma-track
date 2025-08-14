const express = require('express');
const rateLimit = require('express-rate-limit');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const Store = require('../models/Store');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { 
  verifyEmail, 
  verifyPhoneNumber, 
  verifyName, 
  verifyAddress, 
  verifyPassword 
} = require('../middleware/dataVerification');

const router = express.Router();

// Rate limiters for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts from this IP, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, [
  verifyName(),
  verifyEmail(),
  verifyPhoneNumber(),
  verifyPassword(),
  verifyAddress(),
  body('store_id').isInt({ min: 1 }).withMessage('Valid store ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, address, store_id } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const store = await Store.findById(store_id);
    if (!store) {
      return res.status(400).json({ error: 'Invalid store ID' });
    }

    const userId = await User.create({
      name,
      email,
      phone,
      password,
      address,
      store_id,
      role: 'user'
    });

    const token = generateToken(userId);
    const user = await User.findById(userId);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        store_id: user.store_id,
        active_store_id: user.active_store_id,
        store_name: user.store_name,
        active_store_name: user.active_store_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', loginLimiter, [
  verifyEmail(),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe = false } = req.body;

    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await User.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, rememberMe);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        store_id: user.store_id,
        active_store_id: user.active_store_id,
        store_name: user.store_name,
        active_store_name: user.active_store_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile with fresh data
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user.id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User account not found or inactive' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        store_id: user.store_id,
        active_store_id: user.active_store_id,
        store_name: user.store_name,
        active_store_name: user.active_store_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      store_id: user.store_id,
      active_store_id: user.active_store_id,
      store_name: user.store_name,
      active_store_name: user.active_store_name,
      role: user.role,
      date_created: user.date_created
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticateToken, [
  verifyName().optional(),
  verifyPhoneNumber().optional(),
  verifyAddress().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updated = await User.update(req.user.id, updateData);
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedUser = await User.findById(req.user.id);
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        store_id: updatedUser.store_id,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;