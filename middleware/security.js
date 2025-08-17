/**
 * Security Middleware
 * 
 * Comprehensive security middleware including rate limiting,
 * request validation, and protection against common attacks.
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../config/logger');

/**
 * General rate limiting for all routes
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiting for authentication routes
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.security('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
      attempts: req.rateLimit?.totalHits
    });
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * API rate limiting for authenticated users
 */
const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for API endpoints
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id ? `user_${req.user.id}` : req.ip;
  },
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down.',
    retryAfter: '1 minute'
  },
  handler: (req, res) => {
    logger.security('API rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      error: 'API rate limit exceeded',
      message: 'Too many API requests. Please slow down.',
      retryAfter: '1 minute'
    });
  }
});

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    logger.security('Request size limit exceeded', {
      contentLength: req.headers['content-length'],
      maxSize,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request size exceeds the maximum allowed limit',
      maxSize: '10MB'
    });
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous HTML/script tags
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Allow localhost in development
    const devIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    const allAllowedIPs = process.env.NODE_ENV === 'development' 
      ? [...allowedIPs, ...devIPs]
      : allowedIPs;
    
    if (allAllowedIPs.length === 0 || allAllowedIPs.includes(clientIP)) {
      return next();
    }
    
    logger.security('IP access denied', {
      clientIP,
      allowedIPs: allAllowedIPs,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(403).json({
      error: 'Access forbidden',
      message: 'Your IP address is not authorized to access this resource'
    });
  };
};

/**
 * CORS configuration for production
 */
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    // Add production origins from environment
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security('CORS origin blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Response-Time'],
  maxAge: 86400 // 24 hours
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  helmetConfig,
  requestSizeLimit,
  sanitizeInput,
  ipWhitelist,
  corsConfig
};