/**
 * Debug Context Provider
 * 
 * Provides debug logging functionality throughout the React app.
 * Includes global error handling, performance monitoring, and
 * development tools access.
 * 
 * @author PharmaTraK Development Team
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import safeDebugLogger, { logComponent, logError, logUserInteraction } from '../utils/safeDebugLogger';
// import apiInterceptor from '../utils/apiInterceptor'; // Temporarily disabled

const DebugContext = createContext();

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

export const DebugProvider = ({ children }) => {
  const [isDebugMode, setIsDebugMode] = useState(
    process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development'
  );
  const [debugStats, setDebugStats] = useState({});

  useEffect(() => {
    if (isDebugMode) {
      // Initialize debug logging
      console.log('🔍 Debug Context initialized');
      
      // Update debug stats periodically
      const interval = setInterval(() => {
        setDebugStats(safeDebugLogger.getSummary());
      }, 5000);

      // Setup global error handlers
      const handleError = (event) => {
        logError(event.error, 'global_error_handler');
      };

      const handleUnhandledRejection = (event) => {
        logError(event.reason, 'unhandled_promise_rejection');
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      // Monitor React hydration
      if (window.React && window.React.version) {
        console.log('⚛️ React version:', window.React.version);
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [isDebugMode]);

  // Debug utilities
  const debug = {
    // Component logging
    logComponent: (name, action, props, state) => {
      if (isDebugMode) {
        logComponent(name, action, props, state);
      }
    },

    // Error logging
    logError: (error, context, component) => {
      if (isDebugMode) {
        logError(error, context, component);
      }
    },

    // User interaction logging
    logUserAction: (action, element, data) => {
      if (isDebugMode) {
        logUserInteraction(action, element, data);
      }
    },

    // Performance logging (simplified for safe version)
    logPerformance: (metric, value, context) => {
      if (isDebugMode) {
        console.log(`⚡ Performance: ${metric} = ${value}ms`, context);
      }
    },

    // Function timing decorator
    time: (label, fn) => {
      if (!isDebugMode) return fn;
      
      return async (...args) => {
        const start = performance.now();
        try {
          const result = await fn(...args);
          const duration = performance.now() - start;
          console.log(`⚡ Performance: ${label} = ${Math.round(duration)}ms`);
          return result;
        } catch (error) {
          logError(error, `${label}_execution_error`);
          throw error;
        }
      };
    },

    // Assert function for development checks
    assert: (condition, message, data = null) => {
      if (!isDebugMode) return;
      
      if (!condition) {
        const error = new Error(`Assertion failed: ${message}`);
        logError(error, 'assertion_failed', data);
        console.error('❌ Assertion failed:', message, data);
      }
    },

    // Debug state inspector
    inspectState: (stateName, state) => {
      if (!isDebugMode) return;
      
      console.group(`🔍 State Inspector: ${stateName}`);
      console.table(state);
      console.log('Raw state:', state);
      console.groupEnd();
    },

    // API call debugger
    debugAPI: {
      logCall: (method, url, data) => {
        if (isDebugMode) {
          console.log(`🌐 API Call: ${method.toUpperCase()} ${url}`, data);
        }
      },
      
      logResponse: (method, url, response, duration) => {
        if (isDebugMode) {
          console.log(`✅ API Response: ${method.toUpperCase()} ${url} (${duration}ms)`, response);
        }
      },
      
      logError: (method, url, error, duration) => {
        if (isDebugMode) {
          console.error(`❌ API Error: ${method.toUpperCase()} ${url} (${duration}ms)`, error);
        }
      }
    },

    // Development tools
    tools: {
      showLogs: () => safeDebugLogger.showDebugPanel(),
      exportLogs: () => safeDebugLogger.exportLogs(),
      clearLogs: () => safeDebugLogger.clearLogs(),
      getStats: () => safeDebugLogger.getSummary(),
      
      // Memory usage
      getMemoryUsage: () => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      },
      
      // Component tree inspector
      inspectComponent: (componentRef) => {
        if (componentRef && componentRef.current) {
          console.group('🔍 Component Inspector');
          console.log('Component:', componentRef.current);
          console.log('Props:', componentRef.current.props);
          console.log('State:', componentRef.current.state);
          console.groupEnd();
        }
      }
    },

    // Debug flags
    flags: {
      logComponents: true,
      logAPI: true,
      logUserInteractions: true,
      logPerformance: true,
      logErrors: true
    },

    // Current stats
    stats: debugStats,
    
    // Debug mode state
    isEnabled: isDebugMode,
    toggle: () => setIsDebugMode(!isDebugMode)
  };

  return (
    <DebugContext.Provider value={debug}>
      {children}
    </DebugContext.Provider>
  );
};

// Hook for easy component debugging
export const useComponentDebug = (componentName) => {
  const debug = useDebug();
  
  return {
    onMount: (props) => debug.logComponent(componentName, 'mounted', props),
    onUpdate: (prevProps, nextProps) => debug.logComponent(componentName, 'updated', { prevProps, nextProps }),
    onUnmount: () => debug.logComponent(componentName, 'unmounted'),
    onError: (error) => debug.logError(error, 'component_error', componentName),
    logAction: (action, data) => debug.logUserAction(action, componentName, data),
    time: (label, fn) => debug.time(`${componentName}_${label}`, fn),
    assert: (condition, message, data) => debug.assert(condition, `[${componentName}] ${message}`, data)
  };
};

// Hook for API debugging
export const useAPIDebug = () => {
  const debug = useDebug();
  
  return {
    logCall: debug.debugAPI.logCall,
    logResponse: debug.debugAPI.logResponse,
    logError: debug.debugAPI.logError,
    wrapCall: (apiCall, method, url) => {
      return async (data) => {
        const start = performance.now();
        debug.debugAPI.logCall(method, url, data);
        
        try {
          const response = await apiCall(data);
          const duration = performance.now() - start;
          debug.debugAPI.logResponse(method, url, response, Math.round(duration));
          return response;
        } catch (error) {
          const duration = performance.now() - start;
          debug.debugAPI.logError(method, url, error, Math.round(duration));
          throw error;
        }
      };
    }
  };
};

export default DebugContext;