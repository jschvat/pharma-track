/**
 * Simple debug logger utility
 * Provides logging functions used by the routes
 */

const debugLogger = {
  // Function entry logging
  functionEntry: (functionName, params = {}) => {
    console.log(`🚀 ENTRY: ${functionName}`, params);
  },

  // Function exit logging
  functionExit: (functionName, result = {}) => {
    console.log(`✅ EXIT: ${functionName}`, result);
  },

  // API request logging
  apiRequest: (req, description = '') => {
    console.log(`📨 API REQUEST: ${req.method} ${req.path} - ${description}`, {
      user: req.user?.email,
      store: req.user?.store_id
    });
  },

  // API response logging
  apiResponse: (req, res, data = {}, responseTime = null) => {
    console.log(`📤 API RESPONSE: ${req.method} ${req.path}`, {
      status: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : null
    });
  },

  // Database query logging
  dbQuery: (query, params = [], operation = 'QUERY', duration = null) => {
    console.log(`🗄️ DB ${operation}:`, {
      query: query.substring ? query.substring(0, 100) + '...' : query,
      params: params.length,
      duration: duration ? `${duration}ms` : null
    });
  },

  // FDA API call logging
  fdaApiCall: (description, params = {}, result = null, fromCache = false, duration = null) => {
    console.log(`🏛️ FDA API: ${description}`, {
      params,
      fromCache,
      resultsCount: result?.results?.length || 0,
      duration: duration ? `${duration}ms` : null
    });
  },

  // Info level logging
  info: (message, data = {}) => {
    console.log(`ℹ️ INFO: ${message}`, data);
  },

  // Debug level logging
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 DEBUG: ${message}`, data);
    }
  },

  // Trace level logging (most verbose)
  trace: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'trace') {
      console.log(`🔍 TRACE: ${message}`, data);
    }
  },

  // Warning logging
  warn: (message, data = {}) => {
    console.warn(`⚠️ WARN: ${message}`, data);
  },

  // Error logging
  error: (message, data = {}) => {
    console.error(`❌ ERROR: ${message}`, data);
  }
};

module.exports = debugLogger;