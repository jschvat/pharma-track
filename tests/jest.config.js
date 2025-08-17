/**
 * Jest Configuration for PharmaTraK Testing
 * 
 * Comprehensive test configuration supporting unit tests,
 * integration tests, and end-to-end testing.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '../',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/frontend/',
    'manual-fda-test.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'config/**/*.js',
    'services/**/*.js',
    'openfda/**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!coverage/**',
    '!frontend/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global.setup.js',
  globalTeardown: '<rootDir>/tests/setup/global.teardown.js',

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Timeout for tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Maximum number of concurrent workers (single worker for DB tests)
  maxWorkers: 1,

  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Transform configuration
  transform: {}
};