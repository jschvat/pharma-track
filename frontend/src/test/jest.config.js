/**
 * Jest Configuration for PharmaTraK Component Library
 * 
 * Comprehensive Jest configuration optimized for testing React components
 * with pharmacy-specific features, accessibility testing, and performance monitoring.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setupTests.js'
  ],
  
  // Module paths
  roots: [
    '<rootDir>/src'
  ],
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/test/**/*.test.js',
    '<rootDir>/src/test/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/components/common/**/*.js',
    '!src/components/common/**/*.stories.js',
    '!src/components/common/**/*.test.js',
    '!src/components/common/**/index.js',
    '!src/test/**/*'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    // Component-specific thresholds
    'src/components/common/PharmaButton.js': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    'src/components/common/PharmaModal.js': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/components/common/PharmaForm.js': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Module name mapping
  moduleNameMapping: {
    // CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/src/test/__mocks__/fileMock.js',
    
    // Component aliases
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        '@babel/plugin-proposal-private-property-in-object'
      ]
    }]
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-chartjs-2|chart.js|@testing-library)/)'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit
  forceExit: false,
  
  // Max workers for parallel testing
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/test/globalSetup.js',
  globalTeardown: '<rootDir>/src/test/globalTeardown.js',
  
  // Custom matchers and utilities
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setupTests.js'
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'PharmaTraK Component Library Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        suiteName: 'PharmaTraK Component Tests'
      }
    ]
  ],
  
  // Watch configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '<rootDir>/docs/'
  ],
  
  // Performance monitoring
  collectCoverageFrom: [
    'src/components/common/**/*.{js,jsx}',
    '!src/components/common/**/*.{stories,spec,test}.{js,jsx}',
    '!src/components/common/**/index.{js,jsx}',
    '!src/test/**/*'
  ],
  
  // Custom test environments for specific tests
  projects: [
    // Standard component tests
    {
      displayName: 'Components',
      testMatch: ['<rootDir>/src/test/components/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js']
    },
    
    // Integration tests
    {
      displayName: 'Integration',
      testMatch: ['<rootDir>/src/test/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js']
    },
    
    // Accessibility tests
    {
      displayName: 'Accessibility',
      testMatch: ['<rootDir>/src/test/**/*.a11y.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/src/test/setupTests.js',
        '<rootDir>/src/test/setupA11y.js'
      ]
    },
    
    // Performance tests
    {
      displayName: 'Performance',
      testMatch: ['<rootDir>/src/test/**/*.perf.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/src/test/setupTests.js',
        '<rootDir>/src/test/setupPerformance.js'
      ],
      testTimeout: 30000
    }
  ],
  
  // Custom test result processor
  testResultsProcessor: '<rootDir>/src/test/testResultsProcessor.js',
  
  // Snapshot configuration
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // Extensions to resolve
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Global variables
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.REACT_APP_ENV': 'test'
  }
};