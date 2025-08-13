/**
 * Debug Logger Utility
 * 
 * Centralized debug logging system for PharmaTraK application.
 * Provides comprehensive logging with timestamps, caller information,
 * and structured data formatting for debugging purposes.
 * 
 * Features:
 * - Function entry/exit logging with timing
 * - API request/response logging with payloads
 * - Database query logging with parameters
 * - Error tracking with stack traces
 * - Configurable log levels
 * - Structured JSON output for analysis
 * 
 * @module utils/debugLogger
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Log levels for filtering debug output
 * @enum {number}
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * Current log level from environment or default to INFO
 * @type {number}
 */
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * Whether to log to file in addition to console
 * @type {boolean}
 */
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';

/**
 * Log file path for file logging
 * @type {string}
 */
const LOG_FILE_PATH = path.join(__dirname, '..', 'logs', 'debug.log');

/**
 * Get caller information from stack trace
 * 
 * Analyzes the call stack to determine which file and line number
 * called the logging function. Useful for tracing code execution.
 * 
 * Function Calls:
 * - Error() constructor (built-in)
 * - String.split() on stack trace
 * - Array.find() to locate caller
 * - String.match() for pattern extraction
 * 
 * Variables:
 * - stack: Raw stack trace string
 * - lines: Split stack trace lines
 * - callerLine: Line containing caller information
 * - match: Regex match results for file/line extraction
 * 
 * @returns {Object} Caller information
 * @returns {string} returns.file - File name of caller
 * @returns {number} returns.line - Line number of caller
 * @returns {string} returns.function - Function name of caller
 * 
 * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:64
 */
function getCallerInfo() {
  const stack = new Error().stack;
  const lines = stack.split('\n');
  
  // Find the first line that's not this file
  const callerLine = lines.find(line => 
    line.includes('.js') && 
    !line.includes('debugLogger.js') &&
    !line.includes('node_modules')
  );
  
  if (!callerLine) {
    return { file: 'unknown', line: 0, function: 'unknown' };
  }
  
  // Extract file, line, and function info
  const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
  if (match) {
    return {
      function: match[1] || 'anonymous',
      file: path.basename(match[2]),
      line: parseInt(match[3])
    };
  }
  
  // Fallback pattern
  const fallbackMatch = callerLine.match(/at\s+(.+?):(\d+):\d+/);
  if (fallbackMatch) {
    return {
      function: 'unknown',
      file: path.basename(fallbackMatch[1]),
      line: parseInt(fallbackMatch[2])
    };
  }
  
  return { file: 'unknown', line: 0, function: 'unknown' };
}

/**
 * Format timestamp for log entries
 * 
 * Creates a standardized timestamp string in ISO format
 * with millisecond precision for accurate timing analysis.
 * 
 * Function Calls:
 * - new Date() constructor (built-in)
 * - Date.toISOString() for ISO format
 * 
 * Variables:
 * - now: Current date/time object
 * 
 * @returns {string} Formatted timestamp string
 * 
 * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:110
 */
function formatTimestamp() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Write log entry to file (if file logging enabled)
 * 
 * Appends log entries to debug log file with error handling.
 * Creates log directory if it doesn't exist.
 * 
 * Function Calls:
 * - fs.mkdirSync() for directory creation
 * - fs.appendFileSync() for file writing
 * - path.dirname() for directory extraction
 * 
 * Variables:
 * - logEntry: Formatted log entry string
 * - logDir: Directory path for log file
 * 
 * @param {string} logEntry - Formatted log entry to write
 * 
 * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:130
 */
function writeToFile(logEntry) {
  if (!LOG_TO_FILE) return;
  
  try {
    // Ensure log directory exists
    const logDir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(LOG_FILE_PATH, logEntry + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Core logging function
 * 
 * Central logging mechanism that formats and outputs debug information.
 * Handles console and file output, caller tracking, and structured formatting.
 * 
 * Function Calls:
 * - formatTimestamp() - this file line 110
 * - getCallerInfo() - this file line 64  
 * - JSON.stringify() for object serialization
 * - console.log() for console output
 * - writeToFile() - this file line 130
 * 
 * Variables:
 * - level: Log level number
 * - message: Primary log message
 * - data: Additional structured data
 * - timestamp: Formatted timestamp string
 * - caller: Caller information object
 * - logEntry: Complete formatted log entry
 * 
 * @param {number} level - Log level from LOG_LEVELS enum
 * @param {string} message - Primary log message
 * @param {Object} [data={}] - Additional structured data to log
 * 
 * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:163
 */
function log(level, message, data = {}) {
  if (level > CURRENT_LOG_LEVEL) return;
  
  const timestamp = formatTimestamp();
  const caller = getCallerInfo();
  const levelName = Object.keys(LOG_LEVELS)[level];
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    caller: `${caller.file}:${caller.line} in ${caller.function}()`,
    data: Object.keys(data).length > 0 ? data : undefined
  };
  
  const formattedEntry = JSON.stringify(logEntry, null, 2);
  console.log(formattedEntry);
  writeToFile(formattedEntry);
}

/**
 * Debug Logger Object
 * 
 * Main export providing all logging methods and utilities.
 * Each method corresponds to a different log level for categorization.
 */
const debugLogger = {
  /**
   * Log error messages with ERROR level
   * 
   * Used for critical errors that need immediate attention.
   * Always displayed regardless of log level setting.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * @param {string} message - Error message
   * @param {Object} [data={}] - Error details and context
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:197
   */
  error: (message, data = {}) => log(LOG_LEVELS.ERROR, message, data),
  
  /**
   * Log warning messages with WARN level
   * 
   * Used for potentially problematic situations that don't stop execution.
   * Displayed when log level is WARN or higher.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * @param {string} message - Warning message
   * @param {Object} [data={}] - Warning details and context
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:211
   */
  warn: (message, data = {}) => log(LOG_LEVELS.WARN, message, data),
  
  /**
   * Log informational messages with INFO level
   * 
   * Used for general application flow and important events.
   * Displayed when log level is INFO or higher (default).
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * @param {string} message - Information message
   * @param {Object} [data={}] - Additional information
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:225
   */
  info: (message, data = {}) => log(LOG_LEVELS.INFO, message, data),
  
  /**
   * Log debug messages with DEBUG level
   * 
   * Used for detailed debugging information during development.
   * Only displayed when log level is DEBUG or higher.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * @param {string} message - Debug message
   * @param {Object} [data={}] - Debug details and variables
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:239
   */
  debug: (message, data = {}) => log(LOG_LEVELS.DEBUG, message, data),
  
  /**
   * Log trace messages with TRACE level
   * 
   * Used for very detailed execution tracing and function flow.
   * Only displayed when log level is TRACE (most verbose).
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * @param {string} message - Trace message
   * @param {Object} [data={}] - Trace details and execution context
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:253
   */
  trace: (message, data = {}) => log(LOG_LEVELS.TRACE, message, data),
  
  /**
   * Log function entry with parameters
   * 
   * Specialized logging for function entry points with parameter tracking.
   * Useful for tracing function calls and parameter values.
   * 
   * Function Calls:
   * - getCallerInfo() - this file line 64
   * - log() - this file line 163
   * 
   * Variables:
   * - caller: Caller information object
   * - functionName: Name of the function being entered
   * - params: Parameters passed to the function
   * 
   * @param {string} functionName - Name of function being entered
   * @param {Object} [params={}] - Parameters passed to function
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:270
   */
  functionEntry: (functionName, params = {}) => {
    const caller = getCallerInfo();
    log(LOG_LEVELS.TRACE, `ENTER: ${functionName}()`, {
      function: functionName,
      file: caller.file,
      line: caller.line,
      parameters: params
    });
  },
  
  /**
   * Log function exit with return value
   * 
   * Specialized logging for function exit points with return value tracking.
   * Useful for tracing function outputs and execution completion.
   * 
   * Function Calls:
   * - getCallerInfo() - this file line 64
   * - log() - this file line 163
   * 
   * Variables:
   * - caller: Caller information object
   * - functionName: Name of the function being exited
   * - returnValue: Value being returned by the function
   * 
   * @param {string} functionName - Name of function being exited
   * @param {*} [returnValue] - Value being returned by function
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:293
   */
  functionExit: (functionName, returnValue = undefined) => {
    const caller = getCallerInfo();
    log(LOG_LEVELS.TRACE, `EXIT: ${functionName}()`, {
      function: functionName,
      file: caller.file,
      line: caller.line,
      returnValue: returnValue !== undefined ? returnValue : 'undefined'
    });
  },
  
  /**
   * Log API request details
   * 
   * Specialized logging for HTTP API requests with comprehensive details.
   * Tracks method, URL, headers, body, and user information.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * Variables:
   * - req: Express request object
   * - method: HTTP method (GET, POST, etc.)
   * - url: Request URL path
   * - headers: Request headers object
   * - body: Request body data
   * - user: User information from JWT
   * - ip: Client IP address
   * 
   * @param {Object} req - Express request object
   * @param {string} [additionalInfo=''] - Additional context information
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:320
   */
  apiRequest: (req, additionalInfo = '') => {
    log(LOG_LEVELS.INFO, `API REQUEST: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      additionalInfo
    });
  },
  
  /**
   * Log API response details
   * 
   * Specialized logging for HTTP API responses with status and data tracking.
   * Useful for monitoring API performance and debugging response issues.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * Variables:
   * - req: Express request object
   * - res: Express response object
   * - data: Response data being sent
   * - statusCode: HTTP status code
   * - responseTime: Time taken to process request
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {*} data - Response data being sent
   * @param {number} [responseTime] - Time taken to process request
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:350
   */
  apiResponse: (req, res, data, responseTime = null) => {
    log(LOG_LEVELS.INFO, `API RESPONSE: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseData: data,
      responseTime: responseTime ? `${responseTime}ms` : null,
      user: req.user ? { id: req.user.id, email: req.user.email } : null
    });
  },
  
  /**
   * Log database query details
   * 
   * Specialized logging for database operations with query and parameter tracking.
   * Essential for debugging database issues and monitoring query performance.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * Variables:
   * - query: SQL query string
   * - params: Query parameters array
   * - operation: Type of database operation
   * - table: Database table being accessed
   * - executionTime: Time taken for query execution
   * 
   * @param {string} query - SQL query string
   * @param {Array} [params=[]] - Query parameters
   * @param {string} [operation=''] - Type of operation (SELECT, INSERT, etc.)
   * @param {number} [executionTime] - Query execution time in milliseconds
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:376
   */
  dbQuery: (query, params = [], operation = '', executionTime = null) => {
    log(LOG_LEVELS.DEBUG, `DATABASE QUERY: ${operation}`, {
      query: query.replace(/\s+/g, ' ').trim(),
      parameters: params,
      operation,
      executionTime: executionTime ? `${executionTime}ms` : null
    });
  },
  
  /**
   * Log FDA API call details
   * 
   * Specialized logging for FDA API interactions with request/response tracking.
   * Critical for monitoring FDA API usage and debugging integration issues.
   * 
   * Function Calls:
   * - log() - this file line 163
   * 
   * Variables:
   * - endpoint: FDA API endpoint URL
   * - params: API request parameters
   * - responseData: FDA API response data
   * - fromCache: Whether response came from cache
   * - responseTime: Time taken for API call
   * 
   * @param {string} endpoint - FDA API endpoint
   * @param {Object} params - API request parameters
   * @param {*} [responseData] - FDA API response data
   * @param {boolean} [fromCache=false] - Whether response came from cache
   * @param {number} [responseTime] - API call duration in milliseconds
   * 
   * Location: /home/jason/Development/claude/pharmatrak/utils/debugLogger.js:400
   */
  fdaApiCall: (endpoint, params, responseData = null, fromCache = false, responseTime = null) => {
    log(LOG_LEVELS.INFO, `FDA API CALL: ${endpoint}`, {
      endpoint,
      parameters: params,
      responseData: responseData ? {
        resultsCount: responseData.results ? responseData.results.length : 0,
        hasResults: responseData.results && responseData.results.length > 0,
        firstResult: responseData.results ? responseData.results[0] : null
      } : null,
      fromCache,
      responseTime: responseTime ? `${responseTime}ms` : null
    });
  }
};

module.exports = debugLogger;