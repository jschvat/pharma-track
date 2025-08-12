module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    'manual-fda-test.js'  // Exclude manual test from Jest
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'openfda/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],

  // Module paths
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],

  // Transform configuration
  transform: {},

  // Timeout for tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset modules before each test
  resetModules: true,

  // Error handling
  errorOnDeprecated: true,

  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};