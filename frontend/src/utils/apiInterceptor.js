/**
 * API Interceptor for Development Logging
 * 
 * Automatically intercepts all API calls and logs them using the debug logger.
 * Works with axios and fetch requests.
 * 
 * @author PharmaTraK Development Team
 */

import { logAPI } from './debugLogger';

class APIInterceptor {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';
    
    if (this.isDevelopment) {
      this.setupInterceptors();
    }
  }

  setupInterceptors() {
    this.interceptFetch();
    this.interceptAxios();
    // console.log('🌐 API Interceptor initialized for development logging');
  }

  // Intercept native fetch
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const method = options.method || 'GET';
      const startTime = performance.now();
      
      let requestData = null;
      try {
        if (options.body) {
          if (typeof options.body === 'string') {
            requestData = JSON.parse(options.body);
          } else if (options.body instanceof FormData) {
            requestData = '[FormData]';
          } else {
            requestData = options.body;
          }
        }
      } catch (error) {
        requestData = '[Unable to parse request body]';
      }

      try {
        const response = await originalFetch.apply(window, args);
        const duration = performance.now() - startTime;
        
        // Clone response to read body without consuming it
        const responseClone = response.clone();
        let responseData = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await responseClone.json();
          } else {
            responseData = `[${contentType || 'unknown content type'}]`;
          }
        } catch (error) {
          responseData = '[Unable to parse response]';
        }

        // Log the API call
        if (response.ok) {
          logAPI(method, url, requestData, responseData, Math.round(duration));
        } else {
          const error = {
            message: `HTTP ${response.status} ${response.statusText}`,
            response: {
              status: response.status,
              statusText: response.statusText,
              data: responseData
            }
          };
          logAPI(method, url, requestData, responseData, Math.round(duration), error);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        logAPI(method, url, requestData, null, Math.round(duration), error);
        throw error;
      }
    };
  }

  // Intercept axios if it's available
  interceptAxios() {
    // Try to find axios in the window object or as an import
    setTimeout(() => {
      const axios = window.axios;
      if (!axios) return;

      // Request interceptor
      axios.interceptors.request.use(
        (config) => {
          config._requestStartTime = performance.now();
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor
      axios.interceptors.response.use(
        (response) => {
          const duration = performance.now() - response.config._requestStartTime;
          const method = response.config.method?.toUpperCase() || 'GET';
          const url = response.config.url;
          
          let requestData = null;
          if (response.config.data) {
            try {
              requestData = typeof response.config.data === 'string' 
                ? JSON.parse(response.config.data) 
                : response.config.data;
            } catch {
              requestData = response.config.data;
            }
          }

          logAPI(method, url, requestData, response.data, Math.round(duration));
          return response;
        },
        (error) => {
          if (error.config) {
            const duration = performance.now() - error.config._requestStartTime;
            const method = error.config.method?.toUpperCase() || 'GET';
            const url = error.config.url;
            
            let requestData = null;
            if (error.config.data) {
              try {
                requestData = typeof error.config.data === 'string' 
                  ? JSON.parse(error.config.data) 
                  : error.config.data;
              } catch {
                requestData = error.config.data;
              }
            }

            logAPI(method, url, requestData, null, Math.round(duration), error);
          }
          return Promise.reject(error);
        }
      );

      // console.log('📡 Axios interceptors setup for API logging');
    }, 1000); // Delay to ensure axios is loaded
  }
}

// Create and export the interceptor
const apiInterceptor = new APIInterceptor();

export default apiInterceptor;