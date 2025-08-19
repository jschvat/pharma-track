require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import enhanced debugger
const { debugger: devDebugger } = require('./utils/debugger');

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

// Enhanced debugging initialization
devDebugger.log('app', '🌟 Starting enhanced PharmaTraK server with debugging');
devDebugger.dumpEnv();
devDebugger.memoryUsage('Server Startup');

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

// Enhanced debugging middleware for API requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    devDebugger.apiRequest(req, res);
    
    // Track authentication requests
    if (req.path.includes('/auth')) {
      const action = req.path.includes('/login') ? 'login' : 
                    req.path.includes('/logout') ? 'logout' : 
                    req.path.includes('/register') ? 'register' : 'token_verify';
      
      devDebugger.auth(action, {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }
  }
  next();
});

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
app.get('/api/health', (req, res, next) => {
  devDebugger.log('api', 'Health check requested');
  devDebugger.memoryUsage('Health Check');
  healthCheck(req, res, next);
});

// System metrics endpoint (with light rate limiting)
app.get('/metrics', systemMetrics);
app.get('/api/metrics', systemMetrics);

// Development debugging endpoints
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/info', (req, res) => {
    devDebugger.log('api', 'Debug info requested');
    
    const debugInfo = {
      environment: process.env.NODE_ENV,
      debugEnabled: devDebugger.isEnabled,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      versions: process.versions,
      features: {
        cors: true,
        helmet: true,
        rateLimit: true,
        debugging: true,
        monitoring: true,
        logging: true
      }
    };
    
    res.json(debugInfo);
  });
  
  app.get('/api/debug/memory', (req, res) => {
    devDebugger.memoryUsage('Debug Memory Check');
    res.json({
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
}

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

// Enhanced error monitoring with debugging
app.use((err, req, res, next) => {
  devDebugger.error(err, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body ? 'present' : 'empty',
    ip: req.ip
  });
  errorMonitoring(err, req, res, next);
});

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
const server = app.listen(PORT, async () => {
  devDebugger.startTimer('server_startup');
  
  logger.info('✅ PharmaTraK API Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    processId: process.pid,
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
  
  // Enhanced debugging server startup
  devDebugger.log('app', '🌟 Enhanced PharmaTraK server started successfully');
  
  // Test database connection with debugging
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    devDebugger.log('db', 'Database connection test successful');
  } catch (error) {
    devDebugger.error(error, { context: 'database_connection_test' });
  }
  
  const startupTime = devDebugger.endTimer('server_startup');
  devDebugger.log('performance', `Server startup completed in ${startupTime}ms`);
  devDebugger.memoryUsage('Post-Startup');
  
  // Log available endpoints
  logger.info('🔗 Available endpoints', {
    health: `http://localhost:${PORT}/health`,
    metrics: `http://localhost:${PORT}/metrics`,
    api: `http://localhost:${PORT}/api`,
    debug: process.env.NODE_ENV === 'development' ? `http://localhost:${PORT}/api/debug/info` : 'disabled'
  });
});

// Export for testing
module.exports = app;