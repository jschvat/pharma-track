import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { mockAxios } from '../setupTests';

// Mock user data for testing - defined first for use in mocks
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  store_id: 1,
  is_active: true
};

// Mock the auth API module early to prevent real API calls
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn().mockResolvedValue({ data: { token: 'mock-token', user: { id: 1, name: 'Test User' } } }),
    logout: jest.fn().mockResolvedValue({ data: { message: 'Logged out' } }),
    getProfile: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test User' } }),
    refreshToken: jest.fn().mockResolvedValue({ data: { token: 'mock-token' } })
  },
  drugAPI: {
    searchFDA: jest.fn().mockResolvedValue({ data: { results: [] } }),
    checkDrugsExist: jest.fn().mockResolvedValue({ existingNDCs: [] }),
    search: jest.fn().mockResolvedValue({ data: { drugs: [] } }),
    addFromFDAWithInventory: jest.fn().mockResolvedValue({ data: { success: true } })
  },
  inventoryAPI: {
    getByStore: jest.fn().mockResolvedValue({ data: { inventory: [], pagination: {} } }),
    fillPrescription: jest.fn().mockResolvedValue({ data: { success: true } }),
    returnToStock: jest.fn().mockResolvedValue({ data: { success: true } }),
    expire: jest.fn().mockResolvedValue({ data: { success: true } }),
    audit: jest.fn().mockResolvedValue({ data: { success: true } })
  },
  auditAPI: {
    getInventoryHistory: jest.fn().mockResolvedValue({ data: { history: [] } }),
    getNDCReport: jest.fn().mockResolvedValue({ data: {} }),
    exportNDCReport: jest.fn().mockResolvedValue({ data: 'csv,data' })
  },
  userAPI: {
    getAll: jest.fn().mockResolvedValue({ data: { users: [], pagination: {} } }),
    create: jest.fn().mockResolvedValue({ data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ data: { success: true } }),
    updatePassword: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } })
  },
  storeAPI: {
    getAll: jest.fn().mockResolvedValue({ data: { stores: [] } })
  }
}));

export const mockStore = {
  id: 1,
  name: 'Test Pharmacy',
  address: '123 Main St',
  city: 'Test City',
  state: 'NY',
  zipcode: '12345',
  phone: '555-0123',
  dea_registration_number: 'AB1234567',
  npi: '1234567890'
};

export const mockDrug = {
  id: 1,
  ndc: '12345-678-90',
  generic_name: 'Test Generic',
  brand_name: 'Test Brand',
  manufacturer_name: 'Test Manufacturer',
  dosage_form: 'TABLET',
  strength: '10 mg'
};

export const mockInventory = {
  id: 1,
  drug_id: 1,
  store_id: 1,
  quantity: 100,
  lot_number: 'LOT123',
  expiration_date: '2025-12-31',
  cost_per_unit: 1.50,
  is_active: true
};

// Custom render function that includes all providers
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    user = null,
    ...renderOptions
  } = {}
) => {
  // Set up localStorage with user data if provided
  if (user) {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(user));
  }

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to mock successful API responses
export const mockApiSuccess = (endpoint, data, method = 'get') => {
  const fullUrl = `http://localhost:3001/api${endpoint}`;
  
  switch (method.toLowerCase()) {
    case 'get':
      mockAxios.onGet(fullUrl).reply(200, { data });
      break;
    case 'post':
      mockAxios.onPost(fullUrl).reply(200, { data });
      break;
    case 'put':
      mockAxios.onPut(fullUrl).reply(200, { data });
      break;
    case 'delete':
      mockAxios.onDelete(fullUrl).reply(200, { data });
      break;
    default:
      mockAxios.onAny(fullUrl).reply(200, { data });
  }
};

// Helper to mock API errors
export const mockApiError = (endpoint, status = 500, message = 'Server Error', method = 'get') => {
  const fullUrl = `http://localhost:3001/api${endpoint}`;
  const errorData = { error: message };
  
  switch (method.toLowerCase()) {
    case 'get':
      mockAxios.onGet(fullUrl).reply(status, errorData);
      break;
    case 'post':
      mockAxios.onPost(fullUrl).reply(status, errorData);
      break;
    case 'put':
      mockAxios.onPut(fullUrl).reply(status, errorData);
      break;
    case 'delete':
      mockAxios.onDelete(fullUrl).reply(status, errorData);
      break;
    default:
      mockAxios.onAny(fullUrl).reply(status, errorData);
  }
};

// Helper to mock network timeout
export const mockApiTimeout = (endpoint, method = 'get') => {
  const fullUrl = `http://localhost:3001/api${endpoint}`;
  
  switch (method.toLowerCase()) {
    case 'get':
      mockAxios.onGet(fullUrl).timeout();
      break;
    case 'post':
      mockAxios.onPost(fullUrl).timeout();
      break;
    case 'put':
      mockAxios.onPut(fullUrl).timeout();
      break;
    case 'delete':
      mockAxios.onDelete(fullUrl).timeout();
      break;
    default:
      mockAxios.onAny(fullUrl).timeout();
  }
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock authentication APIs
export const setupAuthMocks = (user = mockUser) => {
  mockApiSuccess('/auth/me', user);
  mockApiSuccess('/auth/profile', user);
  mockApiSuccess('/auth/login', { token: 'mock-token', user }, 'post');
  mockApiSuccess('/auth/logout', { message: 'Logged out successfully' }, 'post');
};

// Helper to mock common dashboard APIs
export const setupDashboardMocks = () => {
  setupAuthMocks();
  mockApiSuccess('/stores/stats', {
    total_stores: 1,
    stores_with_admin: 1,
    unique_states: 1
  });
  mockApiSuccess('/drugs/stats/overview', {
    total_drugs: 100,
    active_drugs: 95,
    manufacturers: 25
  });
  mockApiSuccess('/inventory/store/1/stats', {
    total_items: 50,
    low_stock_items: 5,
    expiring_items: 3
  });
  mockApiSuccess('/inventory/store/1/low-stock', { inventory: [] });
  mockApiSuccess('/inventory/store/1/expiring', { inventory: [] });
  mockApiSuccess('/audit/store/1', { transactions: [] });
  mockApiSuccess('/audit/recent', { transactions: [] });
};

// Helper to mock inventory page APIs
export const setupInventoryMocks = (storeId = 1) => {
  setupAuthMocks();
  mockApiSuccess(`/inventory/store/${storeId}`, {
    inventory: [mockInventory],
    pagination: { page: 1, pages: 1, total: 1 }
  });
  mockApiSuccess(`/audit/inventory/1`, { transactions: [] });
};

// Helper to mock user management APIs
export const setupUserManagementMocks = () => {
  setupAuthMocks();
  mockApiSuccess('/users', {
    users: [mockUser],
    pagination: { page: 1, pages: 1, total: 1 }
  });
  mockApiSuccess('/stores', { stores: [mockStore] });
};

// Helper to mock store management APIs
export const setupStoreManagementMocks = () => {
  setupAuthMocks();
  mockApiSuccess('/stores', {
    stores: [mockStore],
    pagination: { page: 1, pages: 1, total: 1 }
  });
  mockApiSuccess('/stores/stats', {
    total_stores: 1,
    stores_with_admin: 1,
    unique_states: 1
  });
  mockApiSuccess('/users', { users: [mockUser] });
};