/**
 * Debug Middleware
 * 
 * Provides debugging middleware for different types of requests
 * and operations in the PharmaTraK application.
 */

const { debugger: devDebugger } = require('../utils/debugger');

/**
 * Database query debugging middleware
 * Wraps database operations to track performance and log queries
 */
const debugDatabaseQuery = (operation) => {
  return async (req, res, next) => {
    if (!devDebugger.isEnabled) {
      return next();
    }
    
    const startTime = Date.now();
    const requestId = req._debugRequestId || 'unknown';
    
    devDebugger.log('db', `Starting ${operation} operation`, {
      requestId,
      path: req.path,
      method: req.method
    });
    
    // Override res.json to capture query completion
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      devDebugger.log('db', `${operation} operation completed`, {
        requestId,
        duration: `${duration}ms`,
        hasData: data && Object.keys(data).length > 0,
        dataSize: data ? JSON.stringify(data).length : 0
      });
      
      if (duration > 1000) {
        devDebugger.log('performance', `Slow ${operation} operation detected`, {
          duration: `${duration}ms`,
          path: req.path
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Route-specific debugging middleware
 */
const debugRoute = (routeName, options = {}) => {
  return (req, res, next) => {
    if (!devDebugger.isEnabled) {
      return next();
    }
    
    const requestId = req._debugRequestId || Date.now();
    req._debugRequestId = requestId;
    
    devDebugger.log('api', `Entering ${routeName} route`, {
      requestId,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      hasBody: req.body && Object.keys(req.body).length > 0
    });
    
    // Start timing for this route
    devDebugger.startTimer(`route_${routeName}_${requestId}`);
    
    // Override res.json to capture route completion
    const originalJson = res.json;
    res.json = function(data) {
      const duration = devDebugger.endTimer(`route_${routeName}_${requestId}`);
      
      devDebugger.log('api', `Exiting ${routeName} route`, {
        requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      });
      
      if (res.statusCode >= 400) {
        devDebugger.log('error', `${routeName} route error`, {
          requestId,
          statusCode: res.statusCode,
          error: data.error || data.message
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Authentication debugging middleware
 */
const debugAuth = (req, res, next) => {
  if (!devDebugger.isEnabled) {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  const hasToken = authHeader && authHeader.startsWith('Bearer ');
  
  devDebugger.auth('token_verify', {
    path: req.path,
    hasToken,
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 50)
  });
  
  next();
};

/**
 * Inventory operation debugging middleware
 */
const debugInventoryOperation = (operation) => {
  return (req, res, next) => {
    if (!devDebugger.isEnabled) {
      return next();
    }
    
    const requestId = req._debugRequestId || Date.now();
    
    devDebugger.log('api', `Inventory ${operation} operation started`, {
      requestId,
      storeId: req.params.storeId,
      drugId: req.params.drugId || req.body?.drugId,
      quantity: req.body?.quantity,
      reason: req.body?.reason
    });
    
    // Track potential security concerns with inventory operations
    if (req.body && (req.body.quantity > 1000 || req.body.quantity < -1000)) {
      devDebugger.security('large_inventory_change', {
        operation,
        quantity: req.body.quantity,
        storeId: req.params.storeId,
        userId: req.user?.id,
        ip: req.ip
      });
    }
    
    next();
  };
};

/**
 * User management debugging middleware
 */
const debugUserOperation = (operation) => {
  return (req, res, next) => {
    if (!devDebugger.isEnabled) {
      return next();
    }
    
    const requestId = req._debugRequestId || Date.now();
    
    devDebugger.log('api', `User ${operation} operation`, {
      requestId,
      targetUserId: req.params.userId,
      performedBy: req.user?.id,
      role: req.user?.role,
      hasBody: req.body && Object.keys(req.body).length > 0
    });
    
    // Track sensitive user operations
    if (operation === 'delete' || operation === 'role_change') {
      devDebugger.security('sensitive_user_operation', {
        operation,
        targetUserId: req.params.userId,
        performedBy: req.user?.id,
        performerRole: req.user?.role,
        ip: req.ip
      });
    }
    
    next();
  };
};

/**
 * God mode operation debugging middleware
 */
const debugGodModeOperation = (req, res, next) => {
  if (!devDebugger.isEnabled) {
    return next();
  }
  
  devDebugger.security('god_mode_access', {
    operation: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

/**
 * Report generation debugging middleware
 */
const debugReportGeneration = (reportType) => {
  return (req, res, next) => {
    if (!devDebugger.isEnabled) {
      return next();
    }
    
    const requestId = req._debugRequestId || Date.now();
    
    devDebugger.log('api', `Report generation started: ${reportType}`, {
      requestId,
      storeId: req.params.storeId,
      filters: req.query,
      format: req.query.format || 'json'
    });
    
    devDebugger.startTimer(`report_${reportType}_${requestId}`);
    
    // Override res.json to capture completion
    const originalJson = res.json;
    res.json = function(data) {
      const duration = devDebugger.endTimer(`report_${reportType}_${requestId}`);
      
      devDebugger.log('performance', `Report ${reportType} generated`, {
        requestId,
        duration: `${duration}ms`,
        recordCount: Array.isArray(data) ? data.length : (data.data?.length || 0),
        sizeKB: Math.round(JSON.stringify(data).length / 1024)
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  debugDatabaseQuery,
  debugRoute,
  debugAuth,
  debugInventoryOperation,
  debugUserOperation,
  debugGodModeOperation,
  debugReportGeneration
};