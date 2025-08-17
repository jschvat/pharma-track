/**
 * Monitoring and Health Check Middleware
 * 
 * Provides system health monitoring, performance tracking,
 * and error monitoring capabilities.
 */

const logger = require('../config/logger');
const { pool: db } = require('../config/database');

/**
 * Request timing middleware for performance monitoring
 */
const requestTiming = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.performance('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Add response time header
    res.set('X-Response-Time', `${duration}ms`);
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Error monitoring middleware
 */
const errorMonitoring = (err, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // Log error with context
  logger.error('API Error', {
    errorId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
    }
  });
  
  // Send error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'An error occurred',
    errorId,
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * Security monitoring middleware
 */
const securityMonitoring = (req, res, next) => {
  const suspiciousPatterns = [
    /(\<script|\<iframe|\<object)/i,
    /(union|select|insert|delete|drop|update)\s/i,
    /\.\.\//,
    /__proto__|constructor\.prototype/,
    /javascript:|data:|vbscript:/i
  ];
  
  const requestString = JSON.stringify({
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // Check for suspicious patterns
  const threats = suspiciousPatterns.filter(pattern => pattern.test(requestString));
  
  if (threats.length > 0) {
    logger.security('Suspicious request detected', {
      patterns: threats.map(t => t.toString()),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  }
  
  next();
};

/**
 * Database health check
 */
const checkDatabaseHealth = async () => {
  try {
    const start = Date.now();
    await db.execute('SELECT 1 as health_check');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * System health endpoint
 */
const healthCheck = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database
    const dbHealth = await checkDatabaseHealth();
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Check uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const uptime = {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    };
    
    // Check disk space (if available)
    let diskSpace = null;
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      diskSpace = {
        available: 'N/A', // Would need additional package to get disk space
        total: 'N/A'
      };
    } catch (e) {
      // Disk space check not available
    }
    
    const healthData = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${Date.now() - startTime}ms`,
      checks: {
        database: dbHealth,
        memory: {
          status: memoryMB.heapUsed < 500 ? 'healthy' : 'warning',
          usage: memoryMB
        },
        uptime,
        ...(diskSpace && { disk: diskSpace })
      }
    };
    
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
    
    // Log health check if unhealthy
    if (healthData.status !== 'healthy') {
      logger.warn('Health check showing degraded status', healthData);
    }
    
  } catch (error) {
    logger.error('Health check failed', { error: error.message, stack: error.stack });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * System metrics endpoint
 */
const systemMetrics = async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Database connection pool stats
    let poolStats = null;
    try {
      poolStats = {
        active: db.pool?.config?.connectionLimit - (db.pool?._freeConnections?.length || 0) || 0,
        idle: db.pool?._freeConnections?.length || 0,
        total: db.pool?.config?.connectionLimit || 0
      };
    } catch (e) {
      // Pool stats not available
    }
    
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        heapUsedPercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      ...(poolStats && { database: { connectionPool: poolStats } })
    };
    
    res.json(metrics);
    
  } catch (error) {
    logger.error('Failed to get system metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
};

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
  requestTiming,
  errorMonitoring,
  securityMonitoring,
  healthCheck,
  systemMetrics
};