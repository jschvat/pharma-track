/**
 * Development Debug Logger
 * 
 * Comprehensive logging middleware for React frontend development.
 * Captures API calls, errors, function calls, and component lifecycle events.
 * Only active in development mode.
 * 
 * Features:
 * - API call logging with request/response data
 * - Error tracking with stack traces
 * - Function call tracing
 * - Component lifecycle logging
 * - Performance monitoring
 * - State change tracking
 * - User interaction logging
 * 
 * @author PharmaTraK Development Team
 */

class DebugLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs
    this.startTime = Date.now();
    
    if (this.isDevelopment) {
      this.initializeLogger();
    }
  }

  initializeLogger() {
    try {
      console.log('🔍 Debug Logger initialized for development');
      
      // Override console methods to capture logs
      this.setupConsoleInterceptor();
      
      // Setup error tracking
      this.setupErrorTracking();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Add keyboard shortcuts for debug tools
      this.setupKeyboardShortcuts();
      
      console.log('✅ Debug Logger setup complete');
    } catch (error) {
      console.error('❌ Debug Logger initialization failed:', error);
      // Disable debug mode if initialization fails
      this.isDevelopment = false;
    }
  }

  // Core logging method
  log(level, category, message, data = null) {
    if (!this.isDevelopment) return;

    const timestamp = Date.now();
    const logEntry = {
      id: `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      relativeTime: timestamp - this.startTime,
      level, // 'info', 'warn', 'error', 'debug', 'api', 'component', 'function'
      category, // 'api', 'component', 'function', 'error', 'user', 'performance'
      message,
      data,
      stack: level === 'error' ? new Error().stack : null,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to logs array
    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console with formatting
    this.outputToConsole(logEntry);
  }

  // API Call Logging
  logAPICall(method, url, requestData, responseData, duration, error = null) {
    const data = {
      method,
      url,
      requestData: this.sanitizeData(requestData),
      responseData: this.sanitizeData(responseData),
      duration,
      error: error ? {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: this.sanitizeData(error.response?.data)
      } : null
    };

    this.log(
      error ? 'error' : 'api',
      'api',
      `${method.toUpperCase()} ${url} ${error ? 'FAILED' : 'SUCCESS'} (${duration}ms)`,
      data
    );
  }

  // Component Lifecycle Logging
  logComponent(componentName, action, props = null, state = null) {
    this.log(
      'debug',
      'component',
      `${componentName} ${action}`,
      {
        componentName,
        action, // 'mounted', 'updated', 'unmounted', 'rendered', 'error'
        props: this.sanitizeData(props),
        state: this.sanitizeData(state)
      }
    );
  }

  // Function Call Logging
  logFunction(functionName, args = null, result = null, duration = null, error = null) {
    this.log(
      error ? 'error' : 'debug',
      'function',
      `${functionName}() ${error ? 'FAILED' : 'EXECUTED'}${duration ? ` (${duration}ms)` : ''}`,
      {
        functionName,
        args: this.sanitizeData(args),
        result: this.sanitizeData(result),
        duration,
        error: error ? { message: error.message, stack: error.stack } : null
      }
    );
  }

  // Error Logging
  logError(error, context = null, component = null) {
    this.log(
      'error',
      'error',
      error.message || 'Unknown error',
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        component
      }
    );
  }

  // User Interaction Logging
  logUserInteraction(action, element, data = null) {
    this.log(
      'info',
      'user',
      `User ${action}`,
      {
        action, // 'click', 'submit', 'navigate', 'input', 'focus', 'blur'
        element,
        data: this.sanitizeData(data),
        timestamp: Date.now()
      }
    );
  }

  // Performance Logging
  logPerformance(metric, value, context = null) {
    this.log(
      'info',
      'performance',
      `${metric}: ${value}ms`,
      {
        metric, // 'render_time', 'api_response', 'component_load', 'page_load'
        value,
        context
      }
    );
  }

  // Console interceptor
  setupConsoleInterceptor() {
    try {
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        try {
          this.log('info', 'console', args.join(' '), args);
        } catch (error) {
          // Silently fail to avoid infinite loops
        }
        originalLog.apply(console, args);
      };

      console.warn = (...args) => {
        try {
          this.log('warn', 'console', args.join(' '), args);
        } catch (error) {
          // Silently fail to avoid infinite loops
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        try {
          this.log('error', 'console', args.join(' '), args);
        } catch (error) {
          // Silently fail to avoid infinite loops
        }
        originalError.apply(console, args);
      };
    } catch (error) {
      console.warn('Debug logger could not setup console interceptor:', error);
    }
  }

  // Error tracking setup
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.logError(event.error, 'window_error', null);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, 'unhandled_promise_rejection', null);
    });
  }

  // Performance monitoring
  setupPerformanceMonitoring() {
    // Monitor page load time
    window.addEventListener('load', () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.logPerformance('page_load', loadTime);
      }
    });

    // Monitor navigation - safer approach for React Router v6
    let navigationStart = performance.now();
    
    // Use a safer history monitoring approach
    if (typeof window !== 'undefined' && window.history) {
      try {
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        window.history.pushState = function(...args) {
          try {
            const navigationTime = performance.now() - navigationStart;
            debugLogger.logPerformance('navigation', navigationTime, { to: args[2] });
            navigationStart = performance.now();
          } catch (error) {
            console.warn('Debug logger navigation monitoring error:', error);
          }
          return originalPushState.apply(this, args);
        };

        window.history.replaceState = function(...args) {
          try {
            const navigationTime = performance.now() - navigationStart;
            debugLogger.logPerformance('navigation', navigationTime, { to: args[2] });
            navigationStart = performance.now();
          } catch (error) {
            console.warn('Debug logger navigation monitoring error:', error);
          }
          return originalReplaceState.apply(this, args);
        };
      } catch (error) {
        console.warn('Debug logger could not setup navigation monitoring:', error);
      }
    }

    // Alternative: Monitor URL changes using popstate
    window.addEventListener('popstate', () => {
      try {
        const navigationTime = performance.now() - navigationStart;
        this.logPerformance('navigation_popstate', navigationTime, { url: window.location.href });
        navigationStart = performance.now();
      } catch (error) {
        console.warn('Debug logger popstate monitoring error:', error);
      }
    });
  }

  // Keyboard shortcuts for debug tools
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl + Shift + D = Show debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.showDebugPanel();
      }
      
      // Ctrl + Shift + L = Export logs
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        this.exportLogs();
      }
      
      // Ctrl + Shift + C = Clear logs
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        this.clearLogs();
      }
    });
  }

  // Output formatting for console
  outputToConsole(logEntry) {
    const { level, category, message, data, relativeTime } = logEntry;
    const timeString = `+${relativeTime}ms`;
    
    const styles = {
      api: 'color: #2563eb; font-weight: bold;',
      error: 'color: #dc2626; font-weight: bold;',
      warn: 'color: #d97706; font-weight: bold;',
      component: 'color: #059669; font-weight: bold;',
      function: 'color: #7c3aed; font-weight: bold;',
      user: 'color: #db2777; font-weight: bold;',
      performance: 'color: #ea580c; font-weight: bold;',
      info: 'color: #374151;'
    };

    const emoji = {
      api: '🌐',
      error: '❌',
      warn: '⚠️',
      component: '⚛️',
      function: '🔧',
      user: '👆',
      performance: '⚡',
      info: 'ℹ️'
    };

    console.groupCollapsed(
      `%c${emoji[level] || 'ℹ️'} [${category.toUpperCase()}] ${message} %c(${timeString})`,
      styles[level] || styles.info,
      'color: #9ca3af; font-size: 0.8em;'
    );
    
    if (data) {
      console.log('Data:', data);
    }
    
    console.groupEnd();
  }

  // Data sanitization (remove sensitive data)
  sanitizeData(data) {
    if (!data) return data;
    
    try {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'authorization'];
      const dataString = JSON.stringify(data);
      
      // Check if data contains sensitive information
      const hasSensitiveData = sensitiveKeys.some(key => 
        dataString.toLowerCase().includes(key.toLowerCase())
      );
      
      if (hasSensitiveData) {
        return this.maskSensitiveData(JSON.parse(JSON.stringify(data)));
      }
      
      return data;
    } catch (error) {
      return '[Unable to serialize data]';
    }
  }

  // Mask sensitive data
  maskSensitiveData(obj) {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'authorization'];
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
          obj[key] = '[MASKED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = this.maskSensitiveData(obj[key]);
        }
      }
    }
    
    return obj;
  }

  // Debug panel
  showDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      return;
    }

    this.createDebugPanel();
  }

  createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; width: 400px; max-height: 600px; background: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-family: monospace;">
        <div style="background: #f8f9fa; padding: 12px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: between; align-items: center;">
          <strong>🔍 Debug Panel</strong>
          <div>
            <button onclick="debugLogger.exportLogs()" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">Export</button>
            <button onclick="debugLogger.clearLogs()" style="margin-left: 4px; padding: 4px 8px; font-size: 12px;">Clear</button>
            <button onclick="document.getElementById('debug-panel').style.display='none'" style="margin-left: 4px; padding: 4px 8px; font-size: 12px;">×</button>
          </div>
        </div>
        <div style="padding: 12px; max-height: 500px; overflow-y: auto;" id="debug-logs">
          ${this.generateLogHTML()}
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }

  generateLogHTML() {
    return this.logs.slice(-50).map(log => `
      <div style="margin-bottom: 8px; padding: 8px; background: ${log.level === 'error' ? '#fee' : log.level === 'warn' ? '#fff3cd' : '#f8f9fa'}; border-radius: 4px; font-size: 12px;">
        <div style="font-weight: bold; color: ${log.level === 'error' ? '#dc2626' : log.level === 'warn' ? '#d97706' : '#374151'};">
          [${log.category.toUpperCase()}] ${log.message}
        </div>
        <div style="color: #6b7280; font-size: 11px;">+${log.relativeTime}ms</div>
        ${log.data ? `<details><summary style="cursor: pointer;">Data</summary><pre style="font-size: 10px; margin: 4px 0; padding: 4px; background: #f3f4f6; border-radius: 2px; overflow-x: auto;">${JSON.stringify(log.data, null, 2)}</pre></details>` : ''}
      </div>
    `).join('');
  }

  // Export logs
  exportLogs() {
    const logsData = {
      exportTime: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      url: window.location.href,
      userAgent: navigator.userAgent,
      logs: this.logs
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmatrak-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Debug logs exported');
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    console.clear();
    console.log('🧹 Debug logs cleared');
    
    const logContainer = document.getElementById('debug-logs');
    if (logContainer) {
      logContainer.innerHTML = '<div style="text-align: center; color: #6b7280;">Logs cleared</div>';
    }
  }

  // Get filtered logs
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Get summary statistics
  getSummary() {
    const summary = {
      totalLogs: this.logs.length,
      sessionDuration: Date.now() - this.startTime,
      categories: {},
      levels: {},
      errors: this.logs.filter(log => log.level === 'error').length,
      apiCalls: this.logs.filter(log => log.category === 'api').length
    };

    this.logs.forEach(log => {
      summary.categories[log.category] = (summary.categories[log.category] || 0) + 1;
      summary.levels[log.level] = (summary.levels[log.level] || 0) + 1;
    });

    return summary;
  }
}

// Create global instance
const debugLogger = new DebugLogger();

// Helper functions for easy access
export const logAPI = (method, url, requestData, responseData, duration, error) => 
  debugLogger.logAPICall(method, url, requestData, responseData, duration, error);

export const logComponent = (componentName, action, props, state) =>
  debugLogger.logComponent(componentName, action, props, state);

export const logFunction = (functionName, args, result, duration, error) =>
  debugLogger.logFunction(functionName, args, result, duration, error);

export const logError = (error, context, component) =>
  debugLogger.logError(error, context, component);

export const logUserInteraction = (action, element, data) =>
  debugLogger.logUserInteraction(action, element, data);

export const logPerformance = (metric, value, context) =>
  debugLogger.logPerformance(metric, value, context);

// Function decorator for automatic logging
export const withLogging = (fn, functionName) => {
  return function(...args) {
    const start = performance.now();
    try {
      const result = fn.apply(this, args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then(res => {
            const duration = performance.now() - start;
            logFunction(functionName || fn.name, args, res, duration);
            return res;
          })
          .catch(error => {
            const duration = performance.now() - start;
            logFunction(functionName || fn.name, args, null, duration, error);
            throw error;
          });
      }
      
      // Handle synchronous functions
      const duration = performance.now() - start;
      logFunction(functionName || fn.name, args, result, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logFunction(functionName || fn.name, args, null, duration, error);
      throw error;
    }
  };
};

export default debugLogger;