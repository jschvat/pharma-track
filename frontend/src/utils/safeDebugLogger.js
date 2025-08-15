/**
 * Safe Development Debug Logger
 * 
 * A simplified version of the debug logger that avoids React Router conflicts.
 * Focuses on core logging without history manipulation.
 * 
 * @author PharmaTraK Development Team
 */

class SafeDebugLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
    this.logs = [];
    this.maxLogs = 500; // Reduced for safety
    this.startTime = Date.now();
    
    if (this.isDevelopment) {
      this.initializeLogger();
    }
  }

  initializeLogger() {
    try {
      console.log('🔍 Safe Debug Logger initialized for development');
      
      // Setup minimal error tracking
      this.setupErrorTracking();
      
      // Add keyboard shortcuts for debug tools
      this.setupKeyboardShortcuts();
      
      console.log('✅ Safe Debug Logger setup complete');
    } catch (error) {
      console.error('❌ Safe Debug Logger initialization failed:', error);
      this.isDevelopment = false;
    }
  }

  // Core logging method
  log(level, category, message, data = null) {
    if (!this.isDevelopment) return;

    try {
      const timestamp = Date.now();
      const logEntry = {
        id: `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        relativeTime: timestamp - this.startTime,
        level,
        category,
        message,
        data: this.sanitizeData(data),
        url: window.location.href
      };

      this.logs.push(logEntry);
      
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      this.outputToConsole(logEntry);
    } catch (error) {
      // Silently fail to avoid cascading errors
    }
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
        statusText: error.response?.statusText
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
        action,
        props: this.sanitizeData(props),
        state: this.sanitizeData(state)
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
        action,
        element,
        data: this.sanitizeData(data)
      }
    );
  }

  // Error tracking setup
  setupErrorTracking() {
    try {
      window.addEventListener('error', (event) => {
        this.logError(event.error, 'window_error', null);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError(event.reason, 'unhandled_promise_rejection', null);
      });
    } catch (error) {
      console.warn('Could not setup error tracking:', error);
    }
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    try {
      document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
          event.preventDefault();
          this.showDebugPanel();
        }
        
        if (event.ctrlKey && event.shiftKey && event.key === 'L') {
          event.preventDefault();
          this.exportLogs();
        }
        
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
          event.preventDefault();
          this.clearLogs();
        }
      });
    } catch (error) {
      console.warn('Could not setup keyboard shortcuts:', error);
    }
  }

  // Console output
  outputToConsole(logEntry) {
    try {
      const { level, category, message, data, relativeTime } = logEntry;
      const timeString = `+${relativeTime}ms`;
      
      const styles = {
        api: 'color: #2563eb; font-weight: bold;',
        error: 'color: #dc2626; font-weight: bold;',
        warn: 'color: #d97706; font-weight: bold;',
        component: 'color: #059669; font-weight: bold;',
        user: 'color: #db2777; font-weight: bold;',
        info: 'color: #374151;'
      };

      const emoji = {
        api: '🌐',
        error: '❌',
        warn: '⚠️',
        component: '⚛️',
        user: '👆',
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
    } catch (error) {
      // Silently fail
    }
  }

  // Data sanitization
  sanitizeData(data) {
    if (!data) return data;
    
    try {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
      const dataString = JSON.stringify(data);
      
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

  maskSensitiveData(obj) {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
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

  // Debug panel (simplified)
  showDebugPanel() {
    try {
      const panel = document.getElementById('debug-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        return;
      }

      this.createDebugPanel();
    } catch (error) {
      console.error('Could not show debug panel:', error);
    }
  }

  createDebugPanel() {
    try {
      const panel = document.createElement('div');
      panel.id = 'debug-panel';
      panel.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; width: 400px; max-height: 600px; background: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-family: monospace;">
          <div style="background: #f8f9fa; padding: 12px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: between; align-items: center;">
            <strong>🔍 Debug Panel (Safe)</strong>
            <div>
              <button onclick="safeDebugLogger.exportLogs()" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">Export</button>
              <button onclick="safeDebugLogger.clearLogs()" style="margin-left: 4px; padding: 4px 8px; font-size: 12px;">Clear</button>
              <button onclick="document.getElementById('debug-panel').style.display='none'" style="margin-left: 4px; padding: 4px 8px; font-size: 12px;">×</button>
            </div>
          </div>
          <div style="padding: 12px; max-height: 500px; overflow-y: auto;" id="debug-logs">
            ${this.generateLogHTML()}
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
    } catch (error) {
      console.error('Could not create debug panel:', error);
    }
  }

  generateLogHTML() {
    try {
      return this.logs.slice(-30).map(log => `
        <div style="margin-bottom: 8px; padding: 8px; background: ${log.level === 'error' ? '#fee' : log.level === 'warn' ? '#fff3cd' : '#f8f9fa'}; border-radius: 4px; font-size: 12px;">
          <div style="font-weight: bold; color: ${log.level === 'error' ? '#dc2626' : log.level === 'warn' ? '#d97706' : '#374151'};">
            [${log.category.toUpperCase()}] ${log.message}
          </div>
          <div style="color: #6b7280; font-size: 11px;">+${log.relativeTime}ms</div>
        </div>
      `).join('');
    } catch (error) {
      return '<div style="text-align: center; color: #6b7280;">Error generating logs</div>';
    }
  }

  // Export logs
  exportLogs() {
    try {
      const logsData = {
        exportTime: new Date().toISOString(),
        totalLogs: this.logs.length,
        url: window.location.href,
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
    } catch (error) {
      console.error('Could not export logs:', error);
    }
  }

  // Clear logs
  clearLogs() {
    try {
      this.logs = [];
      console.log('🧹 Debug logs cleared');
      
      const logContainer = document.getElementById('debug-logs');
      if (logContainer) {
        logContainer.innerHTML = '<div style="text-align: center; color: #6b7280;">Logs cleared</div>';
      }
    } catch (error) {
      console.error('Could not clear logs:', error);
    }
  }

  getSummary() {
    try {
      const summary = {
        totalLogs: this.logs.length,
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
    } catch (error) {
      return { totalLogs: 0, categories: {}, levels: {}, errors: 0, apiCalls: 0 };
    }
  }
}

// Create global instance
const safeDebugLogger = new SafeDebugLogger();

// Make it available globally for debug panel buttons
window.safeDebugLogger = safeDebugLogger;

// Helper functions
export const logAPI = (method, url, requestData, responseData, duration, error) => 
  safeDebugLogger.logAPICall(method, url, requestData, responseData, duration, error);

export const logComponent = (componentName, action, props, state) =>
  safeDebugLogger.logComponent(componentName, action, props, state);

export const logError = (error, context, component) =>
  safeDebugLogger.logError(error, context, component);

export const logUserInteraction = (action, element, data) =>
  safeDebugLogger.logUserInteraction(action, element, data);

export default safeDebugLogger;