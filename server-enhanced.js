require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import new logging and monitoring systems
const logger = require('./config/logger');
const { 
  requestTiming, 
  errorMonitoring, 
  securityMonitoring,
  healthCheck,
  systemMetrics 
} = require('./middleware/monitoring');
const {
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  helmetConfig,
  requestSizeLimit,
  sanitizeInput,
  corsConfig
} = require('./middleware/security');

// Import existing routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const drugRoutes = require('./routes/drugs');
const drugTransactionalRoutes = require('./routes/drugsTransactional');
const inventoryRoutes = require('./routes/inventory');
const inventorySnapshotRoutes = require('./routes/inventorySnapshot');
const auditLogRoutes = require('./routes/auditLog');
const storeSettingsRoutes = require('./routes/storeSettings');
const reportsRoutes = require('./routes/reports');
const godModeRoutes = require('./routes/godMode');

// Import existing middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeAndTrim, checkDataIntegrity } = require('./middleware/dataVerification');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== STARTUP LOGGING =====
logger.info('🚀 Starting PharmaTraK API Server', {
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  nodeVersion: process.version
});

// ===== SECURITY MIDDLEWARE =====
// Security headers
app.use(helmetConfig);

// Request size limiting
app.use(requestSizeLimit);

// Input sanitization
app.use(sanitizeInput);

// Security monitoring
app.use(securityMonitoring);

// ===== CORS CONFIGURATION =====
app.use(cors(corsConfig));

// Additional CORS handling for complex requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ===== REQUEST LOGGING =====
// Morgan HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Request timing and performance monitoring
app.use(requestTiming);

// ===== RATE LIMITING =====
// General rate limiting for all routes
app.use('/api', generalRateLimit);

// Strict rate limiting for authentication
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);

// ===== BODY PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATA VALIDATION MIDDLEWARE =====
app.use(sanitizeAndTrim);
app.use(checkDataIntegrity);

// ===== HEALTH AND MONITORING ENDPOINTS =====
// Health check endpoint (no rate limiting)
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// System metrics endpoint (with light rate limiting)
app.get('/metrics', systemMetrics);
app.get('/api/metrics', systemMetrics);

// ===== API ROUTES =====
// Apply API rate limiting to all API routes
app.use('/api', apiRateLimit);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/drugs-transactional', drugTransactionalRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-snapshot', inventorySnapshotRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/store-settings', storeSettingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/god-mode', godModeRoutes);

// ===== STATIC FILE SERVING =====
// Serve static files from the React app build directory
const path = require('path');
const frontendBuildPath = path.join(__dirname, 'frontend/build');

if (require('fs').existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  logger.warn('Frontend build directory not found', { 
    path: frontendBuildPath,
    message: 'Static file serving disabled'
  });
}

// ===== ERROR HANDLING =====
// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handler with enhanced logging
app.use(errorMonitoring);
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { 
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
});

// ===== SERVER STARTUP =====
const server = app.listen(PORT, () => {
  logger.info('✅ PharmaTraK API Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    processId: process.pid,
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
  
  // Log available endpoints
  logger.info('🔗 Available endpoints', {
    health: `http://localhost:${PORT}/health`,
    metrics: `http://localhost:${PORT}/metrics`,
    api: `http://localhost:${PORT}/api`
  });
});

// Export for testing
module.exports = app;