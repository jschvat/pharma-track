/**
 * Jest Setup File
 * This file runs before each test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_pharmatrak';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests if needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // You can mock console methods here if needed
  // console.error = jest.fn();
  // console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global mocks for commonly used modules
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

// Helper functions for tests
global.testHelpers = {
  // Create mock FDA response
  createMockFDAResponse: (results = []) => ({
    data: {
      meta: {
        results: {
          total: results.length
        }
      },
      results: results
    }
  }),

  // Create mock drug data
  createMockDrug: (overrides = {}) => ({
    product_ndc: '0069-2587-10',
    generic_name: ['ACETAMINOPHEN'],
    brand_name: ['TYLENOL'],
    dosage_form: ['TABLET'],
    route: ['ORAL'],
    active_ingredients: [
      {
        name: 'ACETAMINOPHEN',
        strength: '325 mg/1'
      }
    ],
    openfda: {
      manufacturer_name: ['McNeil Consumer Healthcare']
    },
    product_type: 'HUMAN OTC DRUG',
    marketing_status: 'OTC monograph final',
    listing_expiration_date: '20251231',
    ...overrides
  }),

  // Create mock user data
  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '5551234567',
    address: '123 Test St',
    store_id: 1,
    role: 'user',
    is_active: true,
    date_created: new Date(),
    ...overrides
  }),

  // Create mock store data
  createMockStore: (overrides = {}) => ({
    id: 1,
    name: 'Test Pharmacy',
    address: '123 Main St',
    state: 'CA',
    zipcode: '90210',
    phone: '5551234567',
    fax: '5551234568',
    dea_registration_number: 'AB1234567',
    npi: '1234567890',
    admin_user_id: 1,
    date_created: new Date(),
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  randomNDC: () => {
    const part1 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const part3 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${part1}-${part2}-${part3}`;
  },

  randomEmail: () => `test${Math.floor(Math.random() * 10000)}@example.com`,

  // Mock JWT token
  generateMockJWT: () => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYzOTU5NjAwMCwiZXhwIjoxNjM5NjgyNDAwfQ.test_signature'
};

// Add custom matchers if needed
expect.extend({
  toBeValidNDC(received) {
    const ndcPattern = /^\d{10,11}$/;
    const cleanNDC = received.replace(/[^\d]/g, '');
    const pass = ndcPattern.test(cleanNDC);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid NDC`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid NDC (10-11 digits)`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailPattern.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  }
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in test environment, let Jest handle it
});