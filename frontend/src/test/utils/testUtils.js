/**
 * PharmaTraK Testing Utilities
 * 
 * Comprehensive testing utilities and helpers for the PharmaTraK component library.
 * Provides mock data generators, custom render functions, accessibility helpers,
 * and pharmacy-specific testing utilities.
 * 
 * @module TestUtils
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// =============================================================================
// Custom Render Functions
// =============================================================================

/**
 * Custom render function with providers and context
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    preloadedState = {},
    route = '/',
    user = null,
    theme = 'light',
    ...renderOptions
  } = options;

  const mockAuthContextValue = {
    user: user || mockUsers.admin,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: !!user,
    loading: false,
    error: null,
    checkAuth: jest.fn(),
    updateUser: jest.fn()
  };

  const mockThemeContextValue = {
    theme,
    toggleTheme: jest.fn(),
    setTheme: jest.fn()
  };

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        <ThemeContext.Provider value={mockThemeContextValue}>
          {children}
        </ThemeContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );

  // Navigate to the specified route
  window.history.pushState({}, 'Test page', route);

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockAuthContextValue,
    mockThemeContextValue
  };
};

/**
 * Render component for accessibility testing
 */
export const renderForA11y = (ui, options = {}) => {
  const result = renderWithProviders(ui, options);
  return {
    ...result,
    checkA11y: async () => {
      const results = await axe(result.container);
      expect(results).toHaveNoViolations();
      return results;
    }
  };
};

/**
 * Render component with performance monitoring
 */
export const renderWithPerformance = (ui, options = {}) => {
  const startTime = performance.now();
  const result = renderWithProviders(ui, options);
  const renderTime = performance.now() - startTime;
  
  return {
    ...result,
    renderTime,
    measureRerender: () => {
      const rerenderStart = performance.now();
      result.rerender(ui);
      return performance.now() - rerenderStart;
    }
  };
};

// =============================================================================
// Mock Data Generators
// =============================================================================

export const mockUsers = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@pharmatrak.com',
    role: 'admin',
    store_id: 1,
    active_store_id: 1,
    store_name: 'Main Pharmacy',
    active_store_name: 'Main Pharmacy',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_login: '2024-08-21T10:00:00Z'
  },
  pharmacist: {
    id: 2,
    name: 'John Pharmacist',
    email: 'john@pharmatrak.com',
    role: 'pharmacist',
    store_id: 1,
    active_store_id: 1,
    store_name: 'Main Pharmacy',
    active_store_name: 'Main Pharmacy',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_login: '2024-08-21T09:30:00Z'
  },
  technician: {
    id: 3,
    name: 'Jane Technician',
    email: 'jane@pharmatrak.com',
    role: 'technician',
    store_id: 1,
    active_store_id: 1,
    store_name: 'Main Pharmacy',
    active_store_name: 'Main Pharmacy',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_login: '2024-08-21T09:00:00Z'
  }
};

export const mockStores = [
  {
    id: 1,
    name: 'Main Pharmacy',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipcode: '12345',
    phone: '(555) 123-4567',
    is_active: true
  },
  {
    id: 2,
    name: 'Branch Pharmacy',
    address: '456 Oak Ave',
    city: 'Somewhere',
    state: 'NY',
    zipcode: '67890',
    phone: '(555) 987-6543',
    is_active: true
  }
];

export const mockDrugs = [
  {
    id: 1,
    ndc: '0378-0781-05',
    generic_name: 'Acetaminophen',
    brand_name: 'Tylenol',
    strength: '500mg',
    dosage_form: 'TABLET',
    route: 'ORAL',
    manufacturer_name: 'Johnson & Johnson',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_updated: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    ndc: '0781-1506-01',
    generic_name: 'Ibuprofen',
    brand_name: 'Advil',
    strength: '200mg',
    dosage_form: 'TABLET',
    route: 'ORAL',
    manufacturer_name: 'Pfizer',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_updated: '2024-01-01T00:00:00Z'
  }
];

export const mockInventoryItems = [
  {
    id: 1,
    store_id: 1,
    drug_id: 1,
    quantity_on_hand: 100,
    reorder_level: 20,
    max_level: 500,
    unit_cost: 0.25,
    selling_price: 0.50,
    lot_number: 'LOT12345',
    expiration_date: '2025-12-31',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_updated: '2024-08-21T00:00:00Z',
    drug: mockDrugs[0]
  },
  {
    id: 2,
    store_id: 1,
    drug_id: 2,
    quantity_on_hand: 5,
    reorder_level: 25,
    max_level: 300,
    unit_cost: 0.15,
    selling_price: 0.35,
    lot_number: 'LOT67890',
    expiration_date: '2024-12-31',
    is_active: true,
    date_created: '2024-01-01T00:00:00Z',
    last_updated: '2024-08-21T00:00:00Z',
    drug: mockDrugs[1]
  }
];

export const mockPrescriptions = [
  {
    id: 1,
    patient_id: 1,
    prescriber_id: 1,
    drug_id: 1,
    store_id: 1,
    rx_number: 'RX001234',
    quantity: 30,
    days_supply: 30,
    refills_remaining: 2,
    refills_authorized: 3,
    sig: 'Take 1 tablet by mouth every 6 hours as needed for pain',
    date_written: '2024-08-20',
    status: 'pending',
    priority: 'routine',
    is_controlled_substance: false,
    generic_substitution_allowed: true
  }
];

export const mockAuditLogs = [
  {
    id: 1,
    inventory_id: 1,
    store_id: 1,
    drug_id: 1,
    transaction_type: 'prescription_fill',
    quantity_change: -10,
    quantity_before: 110,
    quantity_after: 100,
    reason: 'Prescription fill for RX001234',
    reference_number: 'RX001234',
    performed_by: 2,
    transaction_date: '2024-08-21T10:00:00Z',
    user: mockUsers.pharmacist,
    drug: mockDrugs[0]
  }
];

// =============================================================================
// API Mock Utilities
// =============================================================================

/**
 * Create mock API response
 */
export const createMockApiResponse = (data, success = true, message = '') => ({
  success,
  data,
  message,
  errors: success ? [] : [{ code: 'TEST_ERROR', message: 'Test error' }],
  meta: Array.isArray(data) ? {
    page: 1,
    pageSize: 10,
    total: data.length,
    totalPages: Math.ceil(data.length / 10),
    hasNext: false,
    hasPrevious: false
  } : undefined
});

/**
 * Mock API functions
 */
export const mockApi = {
  // Auth API
  login: jest.fn(() => Promise.resolve(createMockApiResponse(mockUsers.admin))),
  logout: jest.fn(() => Promise.resolve(createMockApiResponse({}))),
  checkAuth: jest.fn(() => Promise.resolve(createMockApiResponse(mockUsers.admin))),

  // Users API
  getUsers: jest.fn(() => Promise.resolve(createMockApiResponse(Object.values(mockUsers)))),
  createUser: jest.fn((user) => Promise.resolve(createMockApiResponse({ ...user, id: Date.now() }))),
  updateUser: jest.fn((id, user) => Promise.resolve(createMockApiResponse({ ...user, id }))),
  deleteUser: jest.fn((id) => Promise.resolve(createMockApiResponse({}))),

  // Stores API
  getStores: jest.fn(() => Promise.resolve(createMockApiResponse(mockStores))),
  
  // Drugs API
  getDrugs: jest.fn(() => Promise.resolve(createMockApiResponse(mockDrugs))),
  searchFDA: jest.fn(() => Promise.resolve(createMockApiResponse(mockDrugs))),

  // Inventory API
  getInventory: jest.fn(() => Promise.resolve(createMockApiResponse(mockInventoryItems))),
  getInventoryStats: jest.fn(() => Promise.resolve(createMockApiResponse({
    totalItems: 150,
    lowStockItems: 5,
    expiringItems: 3,
    totalValue: 25000
  }))),
  updateInventory: jest.fn((id, data) => Promise.resolve(createMockApiResponse({ id, ...data }))),

  // Audit API
  getAuditLogs: jest.fn(() => Promise.resolve(createMockApiResponse(mockAuditLogs)))
};

// =============================================================================
// Event Testing Utilities
// =============================================================================

/**
 * Simulate form submission
 */
export const submitForm = async (form, data = {}) => {
  const user = userEvent.setup();
  
  // Fill form fields
  for (const [field, value] of Object.entries(data)) {
    const input = within(form).getByRole('textbox', { name: new RegExp(field, 'i') }) ||
                  within(form).getByLabelText(new RegExp(field, 'i')) ||
                  within(form).getByDisplayValue(value);
    
    if (input) {
      await user.clear(input);
      await user.type(input, String(value));
    }
  }

  // Submit form
  const submitButton = within(form).getByRole('button', { name: /submit|save|create|update/i });
  await user.click(submitButton);
};

/**
 * Test table interactions
 */
export const testTableInteractions = {
  sort: async (columnHeader) => {
    const user = userEvent.setup();
    await user.click(columnHeader);
  },
  
  filter: async (filterInput, value) => {
    const user = userEvent.setup();
    await user.type(filterInput, value);
  },
  
  selectRow: async (checkbox) => {
    const user = userEvent.setup();
    await user.click(checkbox);
  },
  
  clickAction: async (button) => {
    const user = userEvent.setup();
    await user.click(button);
  }
};

/**
 * Test modal interactions
 */
export const testModalInteractions = {
  open: async (trigger) => {
    const user = userEvent.setup();
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  },
  
  close: async () => {
    const user = userEvent.setup();
    const closeButton = screen.getByRole('button', { name: /close|cancel/i });
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
  
  confirm: async () => {
    const user = userEvent.setup();
    const confirmButton = screen.getByRole('button', { name: /confirm|ok|yes|save/i });
    await user.click(confirmButton);
  }
};

// =============================================================================
// Accessibility Testing Utilities
// =============================================================================

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = async (container) => {
  const user = userEvent.setup();
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Test tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab();
    expect(focusableElements[i]).toHaveFocus();
  }

  // Test shift+tab navigation
  for (let i = focusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true });
    expect(focusableElements[i]).toHaveFocus();
  }
};

/**
 * Test ARIA attributes
 */
export const testAriaAttributes = (element, expectedAttributes) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(`aria-${attr}`, String(value));
  });
};

/**
 * Test screen reader announcements
 */
export const testScreenReaderAnnouncements = (element) => {
  expect(element).toHaveAttribute('role');
  
  if (element.hasAttribute('aria-live')) {
    expect(element).toHaveAttribute('aria-live', expect.stringMatching(/polite|assertive/));
  }
  
  if (element.hasAttribute('aria-labelledby')) {
    const labelId = element.getAttribute('aria-labelledby');
    expect(document.getElementById(labelId)).toBeInTheDocument();
  }
  
  if (element.hasAttribute('aria-describedby')) {
    const descriptionId = element.getAttribute('aria-describedby');
    expect(document.getElementById(descriptionId)).toBeInTheDocument();
  }
};

// =============================================================================
// Performance Testing Utilities
// =============================================================================

/**
 * Measure component render time
 */
export const measureRenderTime = (component, iterations = 10) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    render(component);
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times
  };
};

/**
 * Test memory leaks
 */
export const testMemoryLeaks = async (component, operations = []) => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  const { unmount } = render(component);
  
  // Perform operations that might cause memory leaks
  for (const operation of operations) {
    await operation();
  }
  
  unmount();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryDelta = finalMemory - initialMemory;
  
  return {
    initialMemory,
    finalMemory,
    memoryDelta,
    hasLeak: memoryDelta > 1000000 // 1MB threshold
  };
};

// =============================================================================
// Validation Testing Utilities
// =============================================================================

/**
 * Test pharmacy data validation
 */
export const testPharmacyValidation = {
  ndc: (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },
  
  dea: (value) => {
    if (!/^[A-Z]{2}[0-9]{7}$/.test(value)) return false;
    const checkDigit = parseInt(value[8]);
    const sum = (parseInt(value[2]) + parseInt(value[4]) + parseInt(value[6])) + 
                2 * (parseInt(value[3]) + parseInt(value[5]) + parseInt(value[7]));
    return checkDigit === sum % 10;
  },
  
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  phone: (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }
};

// =============================================================================
// Error Testing Utilities
// =============================================================================

/**
 * Test error boundaries
 */
export const testErrorBoundary = async (ErrorBoundary, ThrowError) => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  expect(spy).toHaveBeenCalled();
  
  spy.mockRestore();
};

/**
 * Create component that throws error
 */
export const createErrorComponent = (message = 'Test error') => {
  return function ErrorComponent() {
    throw new Error(message);
  };
};

// =============================================================================
// Export All Utilities
// =============================================================================

export default {
  // Render functions
  renderWithProviders,
  renderForA11y,
  renderWithPerformance,
  
  // Mock data
  mockUsers,
  mockStores,
  mockDrugs,
  mockInventoryItems,
  mockPrescriptions,
  mockAuditLogs,
  mockApi,
  createMockApiResponse,
  
  // Event testing
  submitForm,
  testTableInteractions,
  testModalInteractions,
  
  // Accessibility testing
  testKeyboardNavigation,
  testAriaAttributes,
  testScreenReaderAnnouncements,
  
  // Performance testing
  measureRenderTime,
  testMemoryLeaks,
  
  // Validation testing
  testPharmacyValidation,
  
  // Error testing
  testErrorBoundary,
  createErrorComponent
};