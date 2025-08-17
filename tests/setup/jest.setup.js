/**
 * Jest Setup File
 * 
 * Global setup configuration for all tests.
 * Runs before each test file.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'pharmatrak_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'pharmatrak_password';
process.env.DB_NAME = process.env.DB_NAME_TEST || 'pharmatrak_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests

// Extend Jest timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  /**
   * Generate test user data
   */
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    phone: '555-0123',
    address: '123 Test St',
    role: 'user',
    store_id: 1,
    ...overrides
  }),

  /**
   * Generate test drug data
   */
  createTestDrug: (overrides = {}) => ({
    ndc: '12345-678-90',
    generic_name: 'Test Generic Drug',
    brand_name: 'Test Brand',
    dosage_form: 'tablet',
    strength: '10mg',
    route: 'oral',
    manufacturer_name: 'Test Pharma Inc',
    ...overrides
  }),

  /**
   * Generate test inventory data
   */
  createTestInventory: (overrides = {}) => ({
    store_id: 1,
    drug_id: 1,
    quantity_on_hand: 100,
    reorder_level: 10,
    unit_cost: 5.99,
    selling_price: 12.99,
    lot_number: 'TEST123',
    expiration_date: '2025-12-31',
    supplier: 'Test Supplier',
    ...overrides
  }),

  /**
   * Generate test store data
   */
  createTestStore: (overrides = {}) => ({
    name: 'Test Pharmacy',
    address: '123 Test Ave',
    city: 'Test City',
    state: 'TS',
    zip_code: '12345',
    phone: '555-0100',
    email: 'test@testpharmacy.com',
    dea_registration_number: 'TEST123456',
    npi: '1234567890',
    ...overrides
  }),

  /**
   * Sleep utility for async tests
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random string
   */
  randomString: (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate unique email
   */
  uniqueEmail: () => `test-${Date.now()}@example.com`,

  /**
   * Clean up test data helper
   */
  cleanupTestData: async (db, tables = []) => {
    if (!db) return;
    
    try {
      // Disable foreign key checks for cleanup
      await db.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Clean up specified tables
      for (const table of tables) {
        await db.execute(`DELETE FROM ${table} WHERE id > 0`);
      }
      
      // Re-enable foreign key checks
      await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }
};

// Mock console methods to reduce noise (but allow errors)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors visible
  debug: jest.fn()
};

// Restore console for debugging when needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Global error handler for unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process in tests, but log the error
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});