/**
 * Enhanced Development Debugger
 * 
 * Comprehensive debugging utilities for PharmaTraK development.
 * Provides colored logging, request tracking, performance monitoring,
 * and development-specific diagnostic tools.
 */

const debug = require('debug');
const util = require('util');

// Create namespace-specific debuggers
const debuggers = {
  app: debug('pharmatrak:app'),
  db: debug('pharmatrak:db'),
  auth: debug('pharmatrak:auth'),
  api: debug('pharmatrak:api'),
  performance: debug('pharmatrak:performance'),
  security: debug('pharmatrak:security'),
  error: debug('pharmatrak:error'),
  test: debug('pharmatrak:test')
};

/**
 * Enhanced debugging class with colored output and formatting
 */
class DevDebugger {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.DEBUG;
    this.colors = this.initializeColors();
    this.timers = new Map();
    this.requestCounter = 0;
  }

  /**
   * Initialize color utilities (fallback if chalk fails to import)
   */
  initializeColors() {
    try {
      // For newer chalk versions that are ES modules, use a different approach
      let chalk;
      try {
        chalk = require('chalk');
      } catch (chalkError) {
        // If chalk is not available or is ES module, use fallback
        throw chalkError;
      }
      
      return {
        info: chalk.blue || ((text) => `\x1b[34m${text}\x1b[0m`),
        success: chalk.green || ((text) => `\x1b[32m${text}\x1b[0m`),
        warning: chalk.yellow || ((text) => `\x1b[33m${text}\x1b[0m`),
        error: chalk.red || ((text) => `\x1b[31m${text}\x1b[0m`),
        debug: chalk.gray || ((text) => `\x1b[90m${text}\x1b[0m`),
        highlight: chalk.cyan || ((text) => `\x1b[36m${text}\x1b[0m`),
        bold: chalk.bold || ((text) => `\x1b[1m${text}\x1b[0m`),
        dim: chalk.dim || ((text) => `\x1b[2m${text}\x1b[0m`)
      };
    } catch {
      // Fallback using ANSI codes
      return {
        info: (text) => `\x1b[34m${text}\x1b[0m`,     // Blue
        success: (text) => `\x1b[32m${text}\x1b[0m`,  // Green
        warning: (text) => `\x1b[33m${text}\x1b[0m`,  // Yellow
        error: (text) => `\x1b[31m${text}\x1b[0m`,    // Red
        debug: (text) => `\x1b[90m${text}\x1b[0m`,    // Gray
        highlight: (text) => `\x1b[36m${text}\x1b[0m`, // Cyan
        bold: (text) => `\x1b[1m${text}\x1b[0m`,      // Bold
        dim: (text) => `\x1b[2m${text}\x1b[0m`        // Dim
      };
    }
  }

  /**
   * Database query debugging
   */
  dbQuery(query, params = [], duration = null) {
    if (!this.isEnabled) return;
    
    const sanitizedQuery = query.replace(/\s+/g, ' ').trim();
    const formattedParams = params.length > 0 ? this.formatParams(params) : '';
    
    debuggers.db(this.colors.info('📊 DB Query:'));
    debuggers.db(this.colors.highlight(`   ${sanitizedQuery}`));
    
    if (formattedParams) {
      debuggers.db(this.colors.dim(`   Params: ${formattedParams}`));
    }
    
    if (duration !== null) {
      const durationColor = duration > 1000 ? this.colors.warning : this.colors.success;
      debuggers.db(durationColor(`   Duration: ${duration}ms`));
      
      if (duration > 1000) {
        debuggers.performance(this.colors.warning(`🐌 Slow query detected: ${duration}ms`));
        debuggers.performance(this.colors.dim(`   Query: ${sanitizedQuery}`));
      }
    }
  }

  /**
   * API request debugging
   */
  apiRequest(req, res) {
    if (!this.isEnabled) return;
    
    const requestId = ++this.requestCounter;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Start timing
    const startTime = Date.now();
    req._debugStartTime = startTime;
    req._debugRequestId = requestId;
    
    debuggers.api(this.colors.info(`🌐 [${requestId}] ${method} ${url}`));
    debuggers.api(this.colors.dim(`   IP: ${ip}`));
    debuggers.api(this.colors.dim(`   User-Agent: ${userAgent.substring(0, 50)}...`));
    
    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = this.sanitizeRequestBody(req.body);
      debuggers.api(this.colors.dim(`   Body: ${JSON.stringify(sanitizedBody, null, 2)}`));
    }
    
    // Log query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      debuggers.api(this.colors.dim(`   Query: ${JSON.stringify(req.query, null, 2)}`));
    }
    
    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const statusColor = res.statusCode >= 400 ? 
        debuggers.api.colors.error : 
        debuggers.api.colors.success;
      
      debuggers.api(statusColor(`✅ [${requestId}] ${res.statusCode} ${method} ${url} - ${duration}ms`));
      
      // Log response for errors or in verbose mode
      if (res.statusCode >= 400 || process.env.DEBUG_VERBOSE) {
        const responseData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        debuggers.api(this.colors.dim(`   Response: ${responseData.substring(0, 200)}...`));
      }
      
      return originalJson.call(this, data);
    };
  }

  /**
   * Authentication debugging
   */
  auth(action, details = {}) {
    if (!this.isEnabled) return;
    
    const actionColors = {
      login: this.colors.info,
      logout: this.colors.warning,
      register: this.colors.success,
      token_verify: this.colors.debug,
      password_change: this.colors.highlight
    };
    
    const color = actionColors[action] || this.colors.info;
    debuggers.auth(color(`🔐 Auth: ${action.toUpperCase()}`));
    
    Object.entries(details).forEach(([key, value]) => {
      if (key === 'password' || key === 'token') {
        debuggers.auth(this.colors.dim(`   ${key}: [REDACTED]`));
      } else {
        debuggers.auth(this.colors.dim(`   ${key}: ${value}`));
      }
    });
  }

  /**
   * Performance timing
   */
  startTimer(label) {
    if (!this.isEnabled) return;
    this.timers.set(label, Date.now());
    debuggers.performance(this.colors.info(`⏱️  Started timer: ${label}`));
  }

  endTimer(label) {
    if (!this.isEnabled) return;
    
    const startTime = this.timers.get(label);
    if (!startTime) {
      debuggers.performance(this.colors.warning(`⚠️  Timer '${label}' not found`));
      return;
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    const durationColor = duration > 1000 ? this.colors.warning : this.colors.success;
    debuggers.performance(durationColor(`⏱️  ${label}: ${duration}ms`));
    
    return duration;
  }

  /**
   * Security event debugging
   */
  security(event, details = {}) {
    if (!this.isEnabled) return;
    
    const eventColors = {
      rate_limit: this.colors.warning,
      suspicious_request: this.colors.error,
      auth_failure: this.colors.error,
      cors_violation: this.colors.warning,
      validation_error: this.colors.info
    };
    
    const color = eventColors[event] || this.colors.warning;
    debuggers.security(color(`🛡️  Security: ${event.toUpperCase()}`));
    
    Object.entries(details).forEach(([key, value]) => {
      debuggers.security(this.colors.dim(`   ${key}: ${value}`));
    });
  }

  /**
   * Error debugging with stack trace
   */
  error(error, context = {}) {
    if (!this.isEnabled) return;
    
    debuggers.error(this.colors.error(`❌ Error: ${error.message}`));
    
    if (error.stack) {
      debuggers.error(this.colors.dim(`   Stack: ${error.stack}`));
    }
    
    Object.entries(context).forEach(([key, value]) => {
      debuggers.error(this.colors.dim(`   ${key}: ${JSON.stringify(value)}`));
    });
  }

  /**
   * General purpose debugging with object inspection
   */
  log(namespace, message, data = null) {
    if (!this.isEnabled) return;
    
    const debugFunction = debuggers[namespace] || debuggers.app;
    debugFunction(this.colors && this.colors.info ? this.colors.info(message) : `[INFO] ${message}`);
    
    if (data !== null) {
      const inspected = util.inspect(data, { 
        colors: true, 
        depth: 3, 
        maxArrayLength: 5 
      });
      debugFunction(this.colors.dim(`   Data: ${inspected}`));
    }
  }

  /**
   * Test debugging
   */
  test(message, data = null) {
    if (!this.isEnabled) return;
    
    debuggers.test(this.colors.highlight(`🧪 Test: ${message}`));
    if (data) {
      debuggers.test(this.colors.dim(`   ${JSON.stringify(data, null, 2)}`));
    }
  }

  /**
   * Memory usage debugging
   */
  memoryUsage(label = 'Memory Usage') {
    if (!this.isEnabled) return;
    
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => `${Math.round(bytes / 1024 / 1024)}MB`;
    
    debuggers.performance(this.colors.info(`💾 ${label}:`));
    debuggers.performance(this.colors.dim(`   RSS: ${formatBytes(usage.rss)}`));
    debuggers.performance(this.colors.dim(`   Heap Used: ${formatBytes(usage.heapUsed)}`));
    debuggers.performance(this.colors.dim(`   Heap Total: ${formatBytes(usage.heapTotal)}`));
    debuggers.performance(this.colors.dim(`   External: ${formatBytes(usage.external)}`));
  }

  /**
   * Dump all environment variables (development only)
   */
  dumpEnv() {
    if (!this.isEnabled || process.env.NODE_ENV === 'production') return;
    
    debuggers.app(this.colors.info('🌍 Environment Variables:'));
    Object.entries(process.env)
      .filter(([key]) => key.startsWith('DB_') || key.startsWith('JWT_') || key.startsWith('NODE_'))
      .forEach(([key, value]) => {
        const displayValue = key.includes('PASSWORD') || key.includes('SECRET') ? '[REDACTED]' : value;
        debuggers.app(this.colors.dim(`   ${key}: ${displayValue}`));
      });
  }

  /**
   * Utility methods
   */
  formatParams(params) {
    return params.map(param => {
      if (typeof param === 'string' && param.length > 50) {
        return `"${param.substring(0, 47)}..."`;
      }
      return JSON.stringify(param);
    }).join(', ');
  }

  sanitizeRequestBody(body) {
    const sanitized = { ...body };
    ['password', 'token', 'secret', 'key'].forEach(sensitive => {
      if (sanitized[sensitive]) {
        sanitized[sensitive] = '[REDACTED]';
      }
    });
    return sanitized;
  }
}

// Create singleton instance
const devDebugger = new DevDebugger();

// Export both the class and instance
module.exports = {
  DevDebugger,
  debugger: devDebugger,
  debuggers // Export individual namespace debuggers
};

// Auto-enable debugging in development
if (process.env.NODE_ENV === 'development' && !process.env.DEBUG) {
  process.env.DEBUG = 'pharmatrak:*';
}