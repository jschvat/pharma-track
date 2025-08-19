/**
 * Debug Logger Utility
 * 
 * Captures all console output and saves it to a debug file for Claude to analyze.
 * This helps debug complex React issues without cluttering the browser console.
 */

class DebugLogger {
  constructor() {
    this.logs = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.maxLogs = 1000; // Prevent memory issues
    
    if (this.isEnabled) {
      this.interceptConsole();
      this.startPeriodicSave();
    }
  }

  interceptConsole() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    // Override console methods
    console.log = (...args) => {
      this.addLog('LOG', args);
      this.originalConsole.log(...args);
    };

    console.error = (...args) => {
      this.addLog('ERROR', args);
      this.originalConsole.error(...args);
    };

    console.warn = (...args) => {
      this.addLog('WARN', args);
      this.originalConsole.warn(...args);
    };

    console.info = (...args) => {
      this.addLog('INFO', args);
      this.originalConsole.info(...args);
    };
  }

  addLog(level, args) {
    const timestamp = new Date().toISOString();
    const argsArray = Array.isArray(args) ? args : [args];
    const message = argsArray.map(arg => {
      try {
        return typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return '[Object - JSON Error]';
      }
    }).join(' ');

    const logEntry = {
      timestamp,
      level,
      message,
      component: this.getComponentName()
    };

    this.logs.push(logEntry);

    // Keep only recent logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getComponentName() {
    try {
      const stack = new Error().stack;
      if (!stack) return 'Unknown';
      
      const stackLines = stack.split('\n');
      
      // Look for React component names in the stack
      for (const line of stackLines) {
        if (line.includes('Inventory') || line.includes('Dashboard') || line.includes('App')) {
          const match = line.match(/at (\w+)/);
          return match ? match[1] : 'Unknown';
        }
      }
      return 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  }

  async saveToFile() {
    if (!this.isEnabled || this.logs.length === 0) return;

    try {
      const debugOutput = {
        timestamp: new Date().toISOString(),
        totalLogs: this.logs.length,
        logs: this.logs
      };

      // Send to backend endpoint that will save to file
      await fetch('/api/debug/save-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(debugOutput)
      });

      console.info(`📁 Debug logs saved: ${this.logs.length} entries`);
      
    } catch (error) {
      this.originalConsole.error('Failed to save debug logs:', error);
    }
  }

  startPeriodicSave() {
    // Save logs every 10 seconds
    setInterval(() => {
      this.saveToFile();
    }, 10000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveToFile();
    });
  }

  // Manual save method
  async forceSave() {
    await this.saveToFile();
  }

  // Get current logs for immediate inspection
  getCurrentLogs() {
    return this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    console.info('🗑️ Debug logs cleared');
  }

  // Filter logs by component
  getComponentLogs(componentName) {
    return this.logs.filter(log => 
      log.component === componentName || 
      log.message.includes(componentName)
    );
  }

  // Filter logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Get recent logs (last N entries)
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }
}

// Create global debug logger instance
const debugLogger = new DebugLogger();

// Export for manual control
export default debugLogger;

// Make it available globally for browser console access
if (typeof window !== 'undefined') {
  window.debugLogger = debugLogger;
}