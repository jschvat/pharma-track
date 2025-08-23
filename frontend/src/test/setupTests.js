/**
 * Jest Test Setup
 * 
 * Global test setup and configuration for PharmaTraK component library tests.
 * Configures testing utilities, mocks, and environment setup.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
  
  // Trigger intersection for testing
  trigger(entries) {
    this.callback(entries);
  }
};

// Mock window.getComputedStyle
global.getComputedStyle = (element) => ({
  getPropertyValue: (property) => {
    switch (property) {
      case 'display':
        return 'block';
      case 'visibility':
        return 'visible';
      case 'opacity':
        return '1';
      default:
        return '';
    }
  }
});

// Mock window.scrollTo
global.scrollTo = jest.fn();

// Mock performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  ...global.URL,
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock Blob constructor
global.Blob = class MockBlob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
    this.size = content ? content.join('').length : 0;
    this.type = options?.type || '';
  }
};

// Mock File constructor
global.File = class MockFile extends global.Blob {
  constructor(content, name, options) {
    super(content, options);
    this.name = name;
    this.lastModified = Date.now();
  }
};

// Mock FileReader
global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onprogress = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = Array.isArray(file.content) ? file.content.join('') : 'mock content';
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,bW9jayBjb250ZW50';
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  abort() {
    this.readyState = 2;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Map(),
    statusText: 'OK'
  })
);

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  // Suppress React warning about act() for async operations
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An invalid form control')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  // Suppress specific warnings during tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: jest.fn(({ data, options }) => (
    React.createElement('div', {
      'data-testid': 'bar-chart',
      'data-chart-data': JSON.stringify(data),
      'data-chart-options': JSON.stringify(options)
    })
  )),
  Line: jest.fn(({ data, options }) => (
    React.createElement('div', {
      'data-testid': 'line-chart',
      'data-chart-data': JSON.stringify(data),
      'data-chart-options': JSON.stringify(options)
    })
  )),
  Pie: jest.fn(({ data, options }) => (
    React.createElement('div', {
      'data-testid': 'pie-chart',
      'data-chart-data': JSON.stringify(data),
      'data-chart-options': JSON.stringify(options)
    })
  )),
}));

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    }
  }));
});

// Mock xlsx
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
    sheet_to_json: jest.fn(() => [])
  },
  write: jest.fn(() => 'mock-excel-data'),
  writeFile: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/test',
    search: '',
    hash: '',
    state: null,
    key: 'test'
  }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

// Custom matchers for pharmacy-specific validation
expect.extend({
  toBeValidNDC(received) {
    const cleaned = received.replace(/[^0-9]/g, '');
    const isValid = cleaned.length >= 10 && cleaned.length <= 11;
    
    return {
      message: () => `expected ${received} to be a valid NDC`,
      pass: isValid
    };
  },
  
  toBeValidDEA(received) {
    const isValid = /^[A-Z]{2}[0-9]{7}$/.test(received);
    
    return {
      message: () => `expected ${received} to be a valid DEA number`,
      pass: isValid
    };
  },
  
  toHavePharmacyData(received, expectedFields) {
    const hasAllFields = expectedFields.every(field => 
      received.hasOwnProperty(field) && received[field] !== undefined
    );
    
    return {
      message: () => `expected object to have pharmacy fields: ${expectedFields.join(', ')}`,
      pass: hasAllFields
    };
  }
});

// Global test utilities
global.testUtils = {
  // Create mock pharmacy data
  createMockDrug: (overrides = {}) => ({
    id: 1,
    ndc: '0378-0781-05',
    generic_name: 'Acetaminophen',
    brand_name: 'Tylenol',
    strength: '500mg',
    dosage_form: 'TABLET',
    route: 'ORAL',
    manufacturer_name: 'Johnson & Johnson',
    is_active: true,
    ...overrides
  }),
  
  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@pharmatrak.com',
    role: 'pharmacist',
    store_id: 1,
    is_active: true,
    ...overrides
  }),
  
  createMockInventoryItem: (overrides = {}) => ({
    id: 1,
    store_id: 1,
    drug_id: 1,
    quantity_on_hand: 100,
    reorder_level: 20,
    max_level: 500,
    unit_cost: 0.25,
    selling_price: 0.50,
    is_active: true,
    ...overrides
  }),
  
  // Wait for async operations
  waitForAsync: async (callback, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = await callback();
        if (result) return result;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Async operation timed out after ${timeout}ms`);
  }
};

// Setup error boundary for catching React errors in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset window size
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

// Global setup for all tests
beforeAll(() => {
  // Set up fake timers for tests that need them
  jest.useFakeTimers();
});

afterAll(() => {
  // Restore real timers
  jest.useRealTimers();
});

// Export test utilities for use in test files
export * from './utils/testUtils';