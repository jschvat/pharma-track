/**
 * API Service Module
 * 
 * Comprehensive HTTP client service for PharmaTraK frontend application.
 * Provides organized API endpoints with automatic authentication, error handling,
 * and request/response interceptors for seamless backend integration.
 * 
 * Key Features:
 * - Automatic JWT token management and injection
 * - Global authentication error handling with redirect
 * - Organized service modules for different domain areas
 * - Environment-based configuration
 * - Consistent request/response handling
 * 
 * Service Modules:
 * - authAPI: Authentication and user management
 * - storeAPI: Store/location management
 * - inventoryAPI: Inventory operations and tracking
 * - auditAPI: Audit trail and transaction history
 * - drugAPI: Drug database and FDA integration
 * - userAPI: User management and permissions
 * 
 * Security Features:
 * - Automatic token attachment to requests
 * - Token validation and refresh handling
 * - Automatic logout on authentication failure
 * - CSRF protection headers
 * 
 * @module services/api
 * @requires axios - HTTP client library
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 * @since 1.0.0
 */

import axios from 'axios';

/** 
 * Base API URL - configurable via environment variables
 * Falls back to localhost for development
 * @type {string}
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:44
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Debug logging for API calls
 * 
 * Logs API requests and responses for debugging purposes.
 * Includes timing information and error details.
 * 
 * Function Calls Made:
 * - console.log() for debug output
 * - console.error() for error output
 * - Date.now() for timing
 * 
 * Variables Used:
 * - method: HTTP method (GET, POST, etc.)
 * - url: Request URL
 * - data: Request/response data
 * - status: HTTP status code
 * - duration: Request duration in milliseconds
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:63
 */
const debugLog = {
  /**
   * Log API request details
   * 
   * @param {Object} config - Axios request configuration
   * @param {string} config.method - HTTP method
   * @param {string} config.url - Request URL
   * @param {*} config.data - Request body data
   * @param {Object} config.headers - Request headers
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:78
   */
  request: (config) => {
    // Debug logging disabled in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔵 API REQUEST: ${config.method?.toUpperCase()} ${config.url}`, {
        timestamp: new Date().toISOString(),
        method: config.method,
        url: config.url,
        params: config.params,
        data: config.data
      });
      
      // Note: Password debugging removed for security reasons
    }
    config.requestStartTime = Date.now();
    return config;
  },

  /**
   * Log API response details
   * 
   * @param {Object} response - Axios response object
   * @param {number} response.status - HTTP status code
   * @param {*} response.data - Response data
   * @param {Object} response.config - Original request configuration
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:101
   */
  response: (response) => {
    const duration = response.config.requestStartTime 
      ? Date.now() - response.config.requestStartTime 
      : null;
    
    // Debug logging disabled in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`🟢 API RESPONSE: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        duration: duration ? `${duration}ms` : null
      });
    }
    return response;
  },

  /**
   * Log API error details
   * 
   * @param {Object} error - Axios error object
   * @param {Object} error.response - Error response object
   * @param {Object} error.request - Original request object
   * @param {string} error.message - Error message
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:123
   */
  error: (error) => {
    const duration = error.config?.requestStartTime 
      ? Date.now() - error.config.requestStartTime 
      : null;

    if (error.response) {
      // Server responded with error status
      console.error(`🔴 API ERROR: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        timestamp: new Date().toISOString(),
        status: error.response.status,
        statusText: error.response.statusText,
        duration: duration ? `${duration}ms` : null,
        data: error.response.data,
        message: error.message,
        config: error.config ? {
          method: error.config.method,
          url: error.config.url,
          data: error.config.data
        } : null
      });
    } else if (error.request) {
      // Request made but no response received
      console.error(`🔴 API NETWORK ERROR: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        timestamp: new Date().toISOString(),
        message: error.message,
        code: error.code,
        duration: duration ? `${duration}ms` : null
      });
    } else {
      // Something else happened
      console.error(`🔴 API SETUP ERROR:`, {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack
      });
    }
    return Promise.reject(error);
  }
};

/**
 * Main axios instance with base configuration
 * Used by all API service modules for consistent behavior
 * @type {AxiosInstance}
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:165
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== REQUEST INTERCEPTOR =====
/**
 * Request interceptor - Automatically adds authentication token and debug logging
 * 
 * Retrieves JWT token from localStorage and adds to Authorization header.
 * Also adds comprehensive debug logging for all outgoing requests.
 * 
 * Function Calls Made:
 * - localStorage.getItem() for token retrieval
 * - debugLog.request() for request logging (this file line 78)
 * 
 * Variables Used:
 * - config: Axios request configuration object
 * - token: JWT authentication token from localStorage
 * - error: Any error that occurs during request setup
 * 
 * @param {AxiosRequestConfig} config - Request configuration
 * @returns {AxiosRequestConfig} Modified config with auth header and debug info
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:203
 */
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add debug logging
    debugLog.request(config);
    
    return config;
  },
  (error) => {
    console.error('🔴 REQUEST INTERCEPTOR ERROR:', {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
/**
 * Response interceptor - Handles global authentication errors and debug logging
 * 
 * Automatically logs out user and redirects to login on 401 errors.
 * Clears stored authentication data to prevent stale state.
 * Adds comprehensive debug logging for all responses and errors.
 * 
 * Function Calls Made:
 * - localStorage.removeItem() for clearing auth data
 * - debugLog.response() for response logging (this file line 101)
 * - debugLog.error() for error logging (this file line 123)
 * 
 * Variables Used:
 * - response: Successful response object from server
 * - error: Error response object or network error
 * 
 * @param {AxiosResponse} response - Successful response object
 * @param {AxiosError} error - Error response object
 * @returns {Promise} Response promise or rejection
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:244
 */
api.interceptors.response.use(
  (response) => {
    // Add debug logging for successful responses
    debugLog.response(response);
    return response;
  },
  (error) => {
    // Add debug logging for errors
    debugLog.error(error);
    
    // Handle authentication failures globally
    if (error.response?.status === 401) {
      console.warn('🔓 AUTHENTICATION FAILURE - Redirecting to login', {
        timestamp: new Date().toISOString(),
        url: error.config?.url,
        status: error.response?.status
      });
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password, rememberMe = false) => api.post('/auth/login', { email, password, rememberMe }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const storeAPI = {
  getAll: (params) => api.get('/stores', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (storeData) => api.post('/stores', storeData),
  update: (id, storeData) => api.put(`/stores/${id}`, storeData),
  delete: (id) => api.delete(`/stores/${id}`),
  getStats: () => api.get('/stores/stats'),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getAllStores: (params) => api.get('/users/all', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updatePassword: (id, passwordData) => api.put(`/users/${id}/password`, passwordData),
  // Note: Admin users cannot be deleted. Only regular users can be deleted.
  delete: (id) => api.delete(`/users/${id}`),
};

/**
 * Drug API Service Module
 * 
 * Handles all drug-related API operations including FDA integration,
 * local database management, and inventory operations. Provides
 * a centralized interface for all drug-related backend communications.
 * 
 * @namespace drugAPI
 * 
 * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:290
 */
export const drugAPI = {
  /**
   * Get all drugs with pagination and filtering
   * 
   * Retrieves paginated list of drugs from local database with optional filters.
   * 
   * Function Calls Made:
   * - api.get() to backend endpoint /drugs/all
   * 
   * Variables Used:
   * - params: Query parameters for pagination and filtering
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number for pagination
   * @param {number} [params.limit=20] - Number of results per page
   * @param {boolean} [params.active=true] - Filter by active status
   * @returns {Promise<Object>} Response with drugs array and pagination info
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:309
   */
  getAll: (params) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DRUG API: Getting all drugs', { params });
    }
    return api.get('/drugs/all', { params });
  },

  /**
   * Search local drug database
   * 
   * Searches the local drug database using various criteria including
   * NDC, generic name, brand name, manufacturer, and dosage form.
   * 
   * Function Calls Made:
   * - api.get() to backend endpoint /drugs/search
   * 
   * Variables Used:
   * - params: Search parameters object
   * 
   * @param {Object} params - Search parameters
   * @param {string} [params.ndc] - National Drug Code to search
   * @param {string} [params.generic_name] - Generic drug name
   * @param {string} [params.brand_name] - Brand/trade name
   * @param {string} [params.manufacturer] - Manufacturer name
   * @param {string} [params.dosage_form] - Dosage form (tablet, capsule, etc.)
   * @param {number} [params.limit=20] - Maximum results to return
   * @returns {Promise<Object>} Response with matching drugs array
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:337
   */
  search: (params) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DRUG API: Searching local database', { params });
    }
    return api.get('/drugs/search', { params });
  },

  /**
   * Search FDA drug database
   * 
   * Searches the FDA National Drug Code database using various criteria.
   * Returns comprehensive drug information including packaging details.
   * 
   * Function Calls Made:
   * - api.get() to backend endpoint /drugs/search/fda
   * 
   * Variables Used:
   * - params: FDA search parameters object
   * 
   * @param {Object} params - FDA search parameters
   * @param {string} [params.ndc] - National Drug Code to search
   * @param {string} [params.generic_name] - Generic drug name
   * @param {string} [params.brand_name] - Brand/trade name
   * @param {string} [params.manufacturer] - Manufacturer name
   * @param {number} [params.limit=10] - Maximum results to return (1-100)
   * @returns {Promise<Object>} Response with FDA results and metadata
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:361
   */
  searchFDA: (params) => {
    console.log('🔍 DRUG API: Searching FDA database', { params });
    return api.get('/drugs/search/fda', { params });
  },

  /**
   * Get drug by ID
   * 
   * Retrieves detailed information for a specific drug by its database ID.
   * 
   * Function Calls Made:
   * - api.get() to backend endpoint /drugs/{id}
   * 
   * Variables Used:
   * - id: Database ID of the drug to retrieve
   * 
   * @param {number} id - Drug database ID
   * @returns {Promise<Object>} Response with drug details
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:379
   */
  getById: (id) => {
    console.log('🔍 DRUG API: Getting drug by ID', { id });
    return api.get(`/drugs/${id}`);
  },

  /**
   * Update drug information
   * 
   * Updates existing drug record in the local database.
   * Requires store admin permissions.
   * 
   * Function Calls Made:
   * - api.put() to backend endpoint /drugs/{id}
   * 
   * Variables Used:
   * - id: Database ID of the drug to update
   * - drugData: Updated drug information object
   * 
   * @param {number} id - Drug database ID
   * @param {Object} drugData - Updated drug information
   * @param {string} [drugData.generic_name] - Generic drug name
   * @param {string} [drugData.brand_name] - Brand/trade name
   * @param {string} [drugData.dosage_form] - Dosage form
   * @param {string} [drugData.route] - Administration route
   * @param {string} [drugData.strength] - Drug strength
   * @param {string} [drugData.manufacturer_name] - Manufacturer name
   * @param {boolean} [drugData.is_active] - Active status
   * @returns {Promise<Object>} Response with updated drug details
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:405
   */
  update: (id, drugData) => {
    console.log('✏️ DRUG API: Updating drug', { id, drugData });
    return api.put(`/drugs/${id}`, drugData);
  },

  /**
   * Delete drug (soft delete)
   * 
   * Soft deletes a drug by setting is_active to false.
   * Requires store admin permissions.
   * 
   * Function Calls Made:
   * - api.delete() to backend endpoint /drugs/{id}
   * 
   * Variables Used:
   * - id: Database ID of the drug to delete
   * 
   * @param {number} id - Drug database ID
   * @returns {Promise<Object>} Response confirming deletion
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:425
   */
  delete: (id) => {
    console.log('🗑️ DRUG API: Deleting drug', { id });
    return api.delete(`/drugs/${id}`);
  },

  /**
   * Add drug from FDA without initial inventory
   * 
   * Creates a drug record in the local database from FDA data
   * without adding initial inventory. Legacy method.
   * 
   * Function Calls Made:
   * - api.post() to backend endpoint /drugs/add-from-fda
   * 
   * Variables Used:
   * - ndc: National Drug Code to add from FDA
   * 
   * @param {string} ndc - National Drug Code
   * @returns {Promise<Object>} Response with created drug details
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:443
   */
  addFromFDA: (ndc) => {
    console.log('➕ DRUG API: Adding drug from FDA', { ndc });
    return api.post('/drugs/add-from-fda', { ndc });
  },

  /**
   * Add drug from FDA with initial inventory
   * 
   * Creates a drug record from FDA data and immediately adds initial
   * inventory for the user's store. This is the preferred method for
   * adding drugs as it ensures inventory tracking from the start.
   * 
   * Function Calls Made:
   * - api.post() to backend endpoint /drugs/add-from-fda-with-inventory
   * 
   * Variables Used:
   * - data: Request data containing NDC and initial inventory details
   * 
   * @param {Object} data - Request data
   * @param {string} data.ndc - National Drug Code (standardized to 5-4-2 format)
   * @param {Object} data.initialInventory - Initial inventory details
   * @param {number} data.initialInventory.quantity - Initial quantity on hand
   * @param {number} [data.initialInventory.reorder_level=10] - Reorder threshold
   * @param {number} [data.initialInventory.unit_cost] - Cost per unit
   * @param {number} [data.initialInventory.selling_price] - Selling price per unit
   * @param {string} [data.initialInventory.lot_number] - Lot/batch number
   * @param {string} [data.initialInventory.expiration_date] - Expiration date
   * @param {string} [data.initialInventory.supplier] - Supplier name
   * @returns {Promise<Object>} Response with drug and inventory details
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:465
   */
  addFromFDAWithInventory: (data) => {
    console.log('➕ DRUG API: Adding drug from FDA with inventory', { 
      ndc: data.ndc, 
      hasInitialInventory: !!data.initialInventory,
      quantity: data.initialInventory?.quantity
    });
    return api.post('/drugs/add-from-fda-with-inventory', data);
  },

  /**
   * Get drug statistics overview
   * 
   * Retrieves statistical overview of drugs in the system.
   * Requires store admin permissions.
   * 
   * Function Calls Made:
   * - api.get() to backend endpoint /drugs/stats/overview
   * 
   * @returns {Promise<Object>} Response with drug statistics
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:487
   */
  getStats: () => {
    console.log('📊 DRUG API: Getting drug statistics');
    return api.get('/drugs/stats/overview');
  },

  /**
   * Add drug to inventory
   * 
   * Adds a drug to store inventory with specified details.
   * Requires store admin permissions.
   * 
   * Function Calls Made:
   * - api.post() to backend endpoint /drugs/inventory
   * 
   * Variables Used:
   * - inventoryData: Inventory details object
   * 
   * @param {Object} inventoryData - Inventory details
   * @param {number} inventoryData.drug_id - Drug database ID
   * @param {number} inventoryData.quantity_on_hand - Current quantity
   * @param {number} inventoryData.reorder_level - Reorder threshold
   * @param {number} [inventoryData.unit_cost] - Cost per unit
   * @param {number} [inventoryData.selling_price] - Selling price per unit
   * @param {string} [inventoryData.lot_number] - Lot/batch number
   * @param {string} [inventoryData.expiration_date] - Expiration date
   * @param {string} [inventoryData.supplier] - Supplier name
   * @returns {Promise<Object>} Response with inventory details
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:509
   */
  addToInventory: (inventoryData) => {
    console.log('📦 DRUG API: Adding drug to inventory', { 
      drugId: inventoryData.drug_id,
      quantity: inventoryData.quantity_on_hand
    });
    return api.post('/drugs/inventory', inventoryData);
  },

  /**
   * Check if drugs exist in store inventory
   * 
   * Checks which drugs from a provided list of NDCs already exist
   * in the authenticated user's store inventory. Used by the frontend
   * to determine which drugs should be disabled or filtered.
   * 
   * Function Calls Made:
   * - api.post() to backend endpoint /drugs/check-exist
   * 
   * Variables Used:
   * - ndcs: Array of NDC strings to check
   * 
   * @param {string[]} ndcs - Array of NDCs to check
   * @returns {Promise<Object>} Response with existing NDCs array
   * 
   * Location: /home/jason/Development/claude/pharmatrak/frontend/src/services/api.js:533
   */
  checkDrugsExist: (ndcs) => {
    console.log('✅ DRUG API: Checking drug existence', { 
      ndcsCount: ndcs?.length,
      sampleNDCs: ndcs?.slice(0, 3)
    });
    return api.post('/drugs/check-exist', { ndcs });
  }
};

export const inventoryAPI = {
  getByStore: (storeId, params) => api.get(`/inventory/store/${storeId}`, { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (inventoryData) => api.post('/inventory', inventoryData),
  update: (id, inventoryData) => api.put(`/inventory/${id}`, inventoryData),
  delete: (id) => api.delete(`/inventory/${id}`),
  adjustStock: (id, adjustment, reason) => api.patch(`/inventory/${id}/adjust-stock`, { adjustment, reason }),
  setQuantity: (id, quantity) => api.patch(`/inventory/${id}/set-quantity`, { quantity }),
  getLowStock: (storeId, params) => api.get(`/inventory/store/${storeId}/low-stock`, { params }),
  getExpiring: (storeId, params) => api.get(`/inventory/store/${storeId}/expiring`, { params }),
  getStats: (storeId) => api.get(`/inventory/store/${storeId}/stats`),
  fillPrescription: (id, data) => api.post(`/inventory/${id}/fill-prescription`, data),
  returnToStock: (id, data) => api.post(`/inventory/${id}/return-to-stock`, data),
  expire: (id, data) => api.post(`/inventory/${id}/expire`, data),
  audit: (id, data) => api.post(`/inventory/${id}/audit`, data),
  getRunningTotal: (id) => api.get(`/inventory/${id}/running-total`),
  bulkAdjustStock: (adjustments) => api.post('/inventory/bulk/adjust-stock', { adjustments }),
  bulkUpdate: (updates) => api.put('/inventory/bulk/update', { updates }),
};

export const auditAPI = {
  getInventoryHistory: (inventoryId, params) => api.get(`/audit/inventory/${inventoryId}`, { params }),
  getDrugHistory: (drugId, params) => api.get(`/audit/drug/${drugId}`, { params }),
  getStoreHistory: (storeId, params) => api.get(`/audit/store/${storeId}`, { params }),
  getStoreStats: (storeId, params) => api.get(`/audit/store/${storeId}/stats`, { params }),
  getRecentTransactions: (params) => api.get('/audit/recent', { params }),
  getNDCReport: (storeId, ndc, params) => api.get(`/audit/ndc-report/${storeId}/${ndc}`, { params }),
  exportNDCReport: (storeId, ndc, params) => api.get(`/audit/ndc-report/${storeId}/${ndc}/export`, { params }),
};

export const storeAccessAPI = {
  getMyStores: () => api.get('/store-access/my-stores'),
  getActiveStore: () => api.get('/store-access/active-store'),
  setActiveStore: (storeId) => api.post('/store-access/set-active-store', { storeId }),
  grantAccess: (userId, storeId, accessLevel) => api.post('/store-access/grant-access', { userId, storeId, accessLevel }),
  revokeAccess: (userId, storeId) => api.post('/store-access/revoke-access', { userId, storeId }),
  getStoreUsers: (storeId) => api.get(`/store-access/store/${storeId}/users`),
};

// Import and re-export the store settings API
export { storeSettingsAPI } from './storeSettingsAPI';

export default api;