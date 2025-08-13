import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const storeSettingsAPI = {
  // Get all settings for a store
  getAll: async (storeId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.is_system !== undefined) params.append('is_system', filters.is_system);
    if (filters.setting_key) params.append('setting_key', filters.setting_key);
    
    return axios.get(`${API_BASE}/stores/${storeId}/settings?${params}`, {
      headers: getAuthHeaders()
    });
  },

  // Get default settings as key-value object
  getDefaults: async (storeId) => {
    return axios.get(`${API_BASE}/stores/${storeId}/settings/defaults`, {
      headers: getAuthHeaders()
    });
  },

  // Get specific setting by ID
  getById: async (storeId, settingId) => {
    return axios.get(`${API_BASE}/stores/${storeId}/settings/${settingId}`, {
      headers: getAuthHeaders()
    });
  },

  // Create new setting
  create: async (storeId, settingData) => {
    return axios.post(`${API_BASE}/stores/${storeId}/settings`, settingData, {
      headers: getAuthHeaders()
    });
  },

  // Update existing setting
  update: async (storeId, settingId, settingData) => {
    return axios.put(`${API_BASE}/stores/${storeId}/settings/${settingId}`, settingData, {
      headers: getAuthHeaders()
    });
  },

  // Delete setting
  delete: async (storeId, settingId) => {
    return axios.delete(`${API_BASE}/stores/${storeId}/settings/${settingId}`, {
      headers: getAuthHeaders()
    });
  },

  // Get setting change history
  getHistory: async (storeId, settingKey = 'all', limit = 50) => {
    return axios.get(`${API_BASE}/stores/${storeId}/settings/${settingKey}/history?limit=${limit}`, {
      headers: getAuthHeaders()
    });
  },

  // Initialize default settings for a store
  initialize: async (storeId) => {
    return axios.post(`${API_BASE}/stores/${storeId}/settings/initialize`, {}, {
      headers: getAuthHeaders()
    });
  },

  // Bulk update multiple settings
  bulkUpdate: async (storeId, settings) => {
    return axios.patch(`${API_BASE}/stores/${storeId}/settings/bulk`, { settings }, {
      headers: getAuthHeaders()
    });
  }
};

export default storeSettingsAPI;