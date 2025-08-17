/**
 * Winston Logger Configuration
 * 
 * Comprehensive logging system for PharmaTraK with structured logging,
 * log rotation, and different log levels for development and production.
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'blue',
  debug: 'cyan',
  silly: 'grey'
});

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'pharmatrak-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file - only errors
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined log file - all levels
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      handleExceptions: true,
      handleRejections: true,
      maxSize: '50m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // HTTP access log
    new DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '50m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Performance log for slow queries and operations
    new DailyRotateFile({
      filename: path.join(logDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

// Add custom logging methods
logger.addMethod = function(name, level, fn) {
  this[name] = function() {
    if (typeof fn === 'function') {
      return fn.apply(this, arguments);
    }
    return this.log(level, ...arguments);
  };
};

// Custom methods for specific use cases
logger.addMethod('security', 'warn', function(message, meta = {}) {
  this.warn(message, { 
    type: 'security',
    ip: meta.ip,
    userAgent: meta.userAgent,
    userId: meta.userId,
    ...meta 
  });
});

logger.addMethod('performance', 'info', function(message, meta = {}) {
  this.info(message, { 
    type: 'performance',
    duration: meta.duration,
    query: meta.query,
    endpoint: meta.endpoint,
    ...meta 
  });
});

logger.addMethod('database', 'debug', function(message, meta = {}) {
  this.debug(message, { 
    type: 'database',
    query: meta.query,
    duration: meta.duration,
    rows: meta.rows,
    ...meta 
  });
});

logger.addMethod('audit', 'info', function(message, meta = {}) {
  this.info(message, { 
    type: 'audit',
    userId: meta.userId,
    action: meta.action,
    resource: meta.resource,
    ...meta 
  });
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;