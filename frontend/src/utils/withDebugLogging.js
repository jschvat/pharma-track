/**
 * Higher-Order Component for Debug Logging
 * 
 * Wraps React components to automatically log lifecycle events,
 * prop changes, state changes, and render performance.
 * 
 * Usage:
 * export default withDebugLogging(MyComponent, 'MyComponent');
 * 
 * @author PharmaTraK Development Team
 */

import React, { Component, useEffect, useRef } from 'react';
import { logComponent, logError } from './safeDebugLogger';

// Higher-Order Component for Class Components
export const withDebugLogging = (WrappedComponent, componentName = 'UnknownComponent') => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
  
  if (!isDevelopment) {
    return WrappedComponent;
  }

  return class WithDebugLogging extends Component {
    constructor(props) {
      super(props);
      this.renderStartTime = null;
      this.componentName = componentName;
      
      logComponent(this.componentName, 'constructed', props);
    }

    componentDidMount() {
      logComponent(this.componentName, 'mounted', this.props);
      
      if (this.renderStartTime) {
        const renderTime = performance.now() - this.renderStartTime;
        console.log(`⚡ Performance: component_render = ${Math.round(renderTime)}ms`, { component: this.componentName });
      }
    }

    componentDidUpdate(prevProps, prevState) {
      logComponent(this.componentName, 'updated', {
        prevProps,
        currentProps: this.props,
        prevState,
        currentState: this.state
      });
      
      if (this.renderStartTime) {
        const renderTime = performance.now() - this.renderStartTime;
        console.log(`⚡ Performance: component_update = ${Math.round(renderTime)}ms`, { component: this.componentName });
      }
    }

    componentWillUnmount() {
      logComponent(this.componentName, 'unmounting', this.props);
    }

    componentDidCatch(error, errorInfo) {
      logError(error, errorInfo, this.componentName);
    }

    render() {
      this.renderStartTime = performance.now();
      
      try {
        return <WrappedComponent {...this.props} />;
      } catch (error) {
        logError(error, 'render_error', this.componentName);
        throw error;
      }
    }
  };
};

// Hook for Function Components
export const useDebugLogging = (componentName, props = null, state = null) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
  const renderStartTime = useRef(null);
  const mountedRef = useRef(false);
  const prevPropsRef = useRef(props);
  const prevStateRef = useRef(state);

  // Mount effect - always call hooks, but only log in development
  useEffect(() => {
    if (!isDevelopment) return;
    
    if (!mountedRef.current) {
      logComponent(componentName, 'mounted', props, state);
      mountedRef.current = true;
      
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        console.log(`⚡ Performance: component_render = ${Math.round(renderTime)}ms`, { component: componentName });
      }
    }
    
    // Cleanup function for unmount
    return () => {
      if (isDevelopment) {
        logComponent(componentName, 'unmounting', props, state);
      }
    };
  }, [isDevelopment, componentName, props, state]);

  // Update effect - always call hooks, but only log in development
  useEffect(() => {
    if (!isDevelopment || !mountedRef.current) return;
    
    const hasPropsChanged = JSON.stringify(props) !== JSON.stringify(prevPropsRef.current);
    const hasStateChanged = JSON.stringify(state) !== JSON.stringify(prevStateRef.current);
    
    if (hasPropsChanged || hasStateChanged) {
      logComponent(componentName, 'updated', {
        prevProps: prevPropsRef.current,
        currentProps: props,
        prevState: prevStateRef.current,
        currentState: state
      });
      
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        console.log(`⚡ Performance: component_update = ${Math.round(renderTime)}ms`, { component: componentName });
      }
    }
    
    prevPropsRef.current = props;
    prevStateRef.current = state;
  }, [isDevelopment, componentName, props, state]);

  // Set render start time
  if (isDevelopment) {
    renderStartTime.current = performance.now();
  }
};

// Hook for logging user interactions
export const useUserInteractionLogging = (componentName) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
  
  if (!isDevelopment) {
    return {};
  }

  return {
    onClick: (event) => {
      const element = event.target.tagName.toLowerCase();
      const text = event.target.textContent?.slice(0, 50) || '';
      logComponent(componentName, 'user_click', {
        element,
        text,
        className: event.target.className,
        id: event.target.id
      });
    },
    
    onSubmit: (event) => {
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData.entries());
      logComponent(componentName, 'form_submit', data);
    },
    
    onChange: (event) => {
      const element = event.target.tagName.toLowerCase();
      const name = event.target.name;
      const value = event.target.value;
      logComponent(componentName, 'input_change', {
        element,
        name,
        value: value?.length > 100 ? `${value.slice(0, 100)}...` : value
      });
    },
    
    onFocus: (event) => {
      const element = event.target.tagName.toLowerCase();
      const name = event.target.name;
      logComponent(componentName, 'focus', { element, name });
    },
    
    onBlur: (event) => {
      const element = event.target.tagName.toLowerCase();
      const name = event.target.name;
      logComponent(componentName, 'blur', { element, name });
    }
  };
};

// Error boundary component with logging
export class DebugErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    logError(error, errorInfo, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      if (process.env.NODE_ENV === 'development') {
        return (
          <div style={{ 
            padding: '20px', 
            margin: '20px', 
            border: '2px solid #dc2626', 
            borderRadius: '8px', 
            backgroundColor: '#fef2f2',
            fontFamily: 'monospace'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
              ❌ Component Error Caught by Debug Boundary
            </h2>
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <pre style={{ 
                background: '#f3f4f6', 
                padding: '12px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#dc2626', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset Component
            </button>
          </div>
        );
      }
      
      // Production fallback
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withDebugLogging;