/**
 * PharmaPerformanceOptimizer - Performance Enhancement Utilities
 * 
 * A comprehensive performance optimization suite for pharmacy applications
 * with lazy loading, virtualization, memoization, debouncing, and monitoring
 * specifically designed for medical data handling and user experience.
 * 
 * Features:
 * - Intelligent component lazy loading with preloading strategies
 * - Virtual scrolling for large datasets (drug catalogs, prescriptions)
 * - Advanced memoization patterns for expensive computations
 * - Debouncing and throttling for real-time search and validation
 * - Memory leak prevention and cleanup utilities
 * - Performance monitoring and metrics collection
 * - Bundle size optimization techniques
 * - Image and asset lazy loading with pharmacy-specific placeholders
 * 
 * @module PharmaPerformanceOptimizer
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo, 
  memo, 
  lazy, 
  Suspense,
  createContext,
  useContext
} from 'react';
// Simple debounce and throttle implementations to avoid external dependencies
const debounce = (func, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};

const throttle = (func, limit) => {
  let inThrottle;
  const throttled = (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
  throttled.cancel = () => { inThrottle = false; };
  return throttled;
};

// Performance Context for global optimization settings
const PerformanceContext = createContext();

// Performance monitoring utilities
export class PerformanceMonitor {
  static metrics = new Map();
  static observers = new Map();
  
  static startTiming(label) {
    const startTime = performance.now();
    this.metrics.set(label, { startTime, measurements: [] });
    return () => this.endTiming(label);
  }
  
  static endTiming(label) {
    const endTime = performance.now();
    const metric = this.metrics.get(label);
    if (metric) {
      const duration = endTime - metric.startTime;
      metric.measurements.push(duration);
      console.log(`⚡ Performance [${label}]: ${duration.toFixed(2)}ms`);
      return duration;
    }
  }
  
  static measureComponent(componentName, renderFunction) {
    const startTiming = this.startTiming(`Component:${componentName}`);
    const result = renderFunction();
    startTiming();
    return result;
  }
  
  static getMetrics() {
    const summary = {};
    this.metrics.forEach((metric, label) => {
      const measurements = metric.measurements;
      if (measurements.length > 0) {
        summary[label] = {
          count: measurements.length,
          average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
          min: Math.min(...measurements),
          max: Math.max(...measurements),
          total: measurements.reduce((a, b) => a + b, 0)
        };
      }
    });
    return summary;
  }
  
  static observeElementPerformance(element, callback) {
    if (!window.IntersectionObserver) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(element);
    this.observers.set(element, observer);
    
    return () => {
      observer.disconnect();
      this.observers.delete(element);
    };
  }
}

// Memoization utilities for pharmacy data
export const PharmaMemo = {
  // Memoize drug calculations (NDC validation, dosage conversions)
  drugCalculation: memo((drugData, calculation) => {
    console.log('🧮 Computing drug calculation:', calculation);
    switch (calculation) {
      case 'ndc-validation':
        return PharmaMemo.validateNDC(drugData.ndc);
      case 'dosage-conversion':
        return PharmaMemo.convertDosage(drugData.strength, drugData.unit);
      case 'interaction-check':
        return PharmaMemo.checkInteractions(drugData.id, drugData.activeIngredients);
      default:
        return drugData;
    }
  }),
  
  validateNDC: (ndc) => {
    // Expensive NDC validation logic
    const cleaned = ndc.replace(/[^0-9]/g, '');
    return {
      isValid: cleaned.length >= 10 && cleaned.length <= 11,
      formatted: cleaned.replace(/(\d{4,5})(\d{3,4})(\d{1,2})/, '$1-$2-$3'),
      labeler: cleaned.substring(0, 5),
      product: cleaned.substring(5, 9),
      package: cleaned.substring(9)
    };
  },
  
  convertDosage: (strength, unit) => {
    // Complex dosage conversion calculations
    const conversions = {
      'mg': { factor: 1, base: 'mg' },
      'g': { factor: 1000, base: 'mg' },
      'mcg': { factor: 0.001, base: 'mg' },
      'ml': { factor: 1, base: 'ml' },
      'l': { factor: 1000, base: 'ml' }
    };
    
    const conversion = conversions[unit.toLowerCase()];
    if (!conversion) return { original: strength, unit };
    
    return {
      original: strength,
      unit,
      standardized: parseFloat(strength) * conversion.factor,
      standardUnit: conversion.base
    };
  },
  
  checkInteractions: (drugId, activeIngredients) => {
    // Simulate expensive interaction checking
    return {
      drugId,
      hasInteractions: Math.random() > 0.7,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      interactionCount: Math.floor(Math.random() * 5)
    };
  }
};

// Debouncing utilities for search and validation
export const usePharmaDebounce = (callback, delay = 300, dependencies = []) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [...dependencies, delay] // eslint-disable-line react-hooks/exhaustive-deps
  );
  
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
  
  return debouncedCallback;
};

// Throttling for real-time updates
export const usePharmaThrottle = (callback, limit = 100, dependencies = []) => {
  const throttledCallback = useMemo(
    () => throttle(callback, limit),
    [...dependencies, limit] // eslint-disable-line react-hooks/exhaustive-deps
  );
  
  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
  
  return throttledCallback;
};

// Virtual scrolling component for large datasets
export const VirtualizedPharmaList = memo(({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );
  
  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    visibleEnd
  );
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = Math.max(0, visibleStart - overscan) * itemHeight;
  
  return (
    <div
      ref={containerRef}
      className={`pharma-virtual-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id || (visibleStart - overscan + index)}
              style={{ height: itemHeight }}
              className="pharma-virtual-list-item"
            >
              {renderItem(item, visibleStart - overscan + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Lazy loading component with pharmacy-specific placeholders
export const PharmaLazyImage = memo(({
  src,
  alt,
  placeholder = null,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;
    
    return PerformanceMonitor.observeElementPerformance(element, () => {
      setIsInView(true);
    });
  }, []);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  const defaultPlaceholder = (
    <div className="pharma-image-placeholder">
      <div className="pharma-placeholder-icon">💊</div>
      <div className="pharma-placeholder-text">Loading...</div>
    </div>
  );
  
  return (
    <div ref={imgRef} className={`pharma-lazy-image ${className}`}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          {...props}
        />
      )}
      {(!isInView || !isLoaded) && (placeholder || defaultPlaceholder)}
    </div>
  );
});

// Performance-optimized search component
export const PharmaOptimizedSearch = memo(({
  onSearch,
  placeholder = 'Search drugs...',
  debounceMs = 300,
  minLength = 2,
  className = '',
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = usePharmaDebounce(async (searchQuery) => {
    if (searchQuery.length >= minLength) {
      setIsSearching(true);
      try {
        await onSearch(searchQuery);
      } finally {
        setIsSearching(false);
      }
    }
  }, debounceMs, [onSearch, minLength]);
  
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  return (
    <div className={`pharma-optimized-search ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="form-control"
        {...props}
      />
      {isSearching && (
        <div className="pharma-search-spinner">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
});

// Memory leak prevention hook
export const useCleanup = (cleanupFunction) => {
  const cleanupRef = useRef(cleanupFunction);
  
  useEffect(() => {
    cleanupRef.current = cleanupFunction;
  }, [cleanupFunction]);
  
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(performance.now());
  
  useEffect(() => {
    renderCountRef.current++;
    
    return () => {
      const unmountTime = performance.now();
      const totalTime = unmountTime - mountTimeRef.current;
      console.log(`📊 Component [${componentName}]: ${renderCountRef.current} renders, ${totalTime.toFixed(2)}ms lifecycle`);
    };
  });
  
  return {
    renderCount: renderCountRef.current,
    measureRender: (renderFunction) => {
      return PerformanceMonitor.measureComponent(componentName, renderFunction);
    }
  };
};

// Batch updates for multiple state changes
export const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const timeoutRef = useRef(null);
  
  const batchUpdate = useCallback((updateFunction) => {
    setUpdates(prev => [...prev, updateFunction]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates(current => {
        current.forEach(update => update());
        return [];
      });
    }, 0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return batchUpdate;
};

// Intelligent preloading for pharmacy routes
export const usePharmaPreloader = () => {
  const preloadedModules = useRef(new Set());
  
  const preloadRoute = useCallback(async (routeName) => {
    if (preloadedModules.current.has(routeName)) {
      return;
    }
    
    try {
      switch (routeName) {
        case 'inventory':
          await import('../Inventory');
          break;
        case 'prescriptions':
          await import('../Prescriptions');
          break;
        case 'patients':
          await import('../Patients');
          break;
        case 'drugs':
          await import('../Drugs');
          break;
        case 'reports':
          await import('../Reports');
          break;
        default:
          console.warn(`Unknown route for preloading: ${routeName}`);
          return;
      }
      
      preloadedModules.current.add(routeName);
      console.log(`✅ Preloaded route: ${routeName}`);
    } catch (error) {
      console.error(`❌ Failed to preload route ${routeName}:`, error);
    }
  }, []);
  
  const preloadCriticalRoutes = useCallback(() => {
    const criticalRoutes = ['inventory', 'prescriptions'];
    criticalRoutes.forEach(route => preloadRoute(route));
  }, [preloadRoute]);
  
  return { preloadRoute, preloadCriticalRoutes };
};

// Performance Provider for global optimization settings
export const PerformanceProvider = ({ 
  children,
  enableMonitoring = process.env.NODE_ENV === 'development',
  enableVirtualization = true,
  debounceDefault = 300,
  throttleDefault = 100
}) => {
  const { preloadCriticalRoutes } = usePharmaPreloader();
  
  useEffect(() => {
    if (enableMonitoring) {
      console.log('🚀 PharmaTraK Performance Monitoring Enabled');
      
      // Preload critical routes after a short delay
      setTimeout(preloadCriticalRoutes, 1000);
    }
  }, [enableMonitoring, preloadCriticalRoutes]);
  
  const contextValue = {
    enableMonitoring,
    enableVirtualization,
    debounceDefault,
    throttleDefault,
    getMetrics: PerformanceMonitor.getMetrics
  };
  
  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook for using performance context
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};

// Lazy loading utilities for components
export const createPharmaLazyComponent = (importFunction, fallback = null) => {
  const LazyComponent = lazy(importFunction);
  
  return memo((props) => (
    <Suspense fallback={fallback || <div className="pharma-loading-placeholder">Loading component...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  ));
};

// Bundle optimization utilities
export const BundleOptimizer = {
  // Dynamic imports for heavy components
  loadHeavyComponent: async (componentName) => {
    const loadingStart = performance.now();
    
    try {
      let component;
      switch (componentName) {
        case 'chart':
          component = await import('react-chartjs-2');
          break;
        case 'pdf':
          component = await import('jspdf');
          break;
        case 'excel':
          component = await import('xlsx');
          break;
        default:
          throw new Error(`Unknown heavy component: ${componentName}`);
      }
      
      const loadingTime = performance.now() - loadingStart;
      console.log(`📦 Loaded ${componentName} in ${loadingTime.toFixed(2)}ms`);
      
      return component;
    } catch (error) {
      console.error(`❌ Failed to load ${componentName}:`, error);
      throw error;
    }
  },
  
  // Tree shaking helpers
  importOnlyNeeded: (library, methods) => {
    return methods.reduce((acc, method) => {
      acc[method] = library[method];
      return acc;
    }, {});
  }
};

// All components are already individually exported above

export default {
  PerformanceMonitor,
  PharmaMemo,
  usePharmaDebounce,
  usePharmaThrottle,
  VirtualizedPharmaList,
  PharmaLazyImage,
  PharmaOptimizedSearch,
  useCleanup,
  usePerformanceMonitor,
  useBatchedUpdates,
  usePharmaPreloader,
  PerformanceProvider,
  usePerformance,
  createPharmaLazyComponent,
  BundleOptimizer
};