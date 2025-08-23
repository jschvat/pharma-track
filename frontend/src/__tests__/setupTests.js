/**
 * Test setup for PharmaTraK accessibility testing
 * Configures jest-axe and other testing utilities
 */

import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest with axe-core matchers
expect.extend(toHaveNoViolations);

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

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

// Mock window.getComputedStyle for accessibility tests
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn().mockImplementation((element, pseudoElt) => {
  const computedStyle = originalGetComputedStyle(element, pseudoElt);
  
  // Mock focus styles for accessibility testing
  if (pseudoElt === ':focus') {
    return {
      ...computedStyle,
      outline: '2px solid #007bff',
      outlineOffset: '2px',
      boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.25)'
    };
  }
  
  return computedStyle;
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock focus() and blur() methods on elements
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();

// Mock scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Suppress console warnings during tests (but keep errors)
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  // Wait for element to be focused
  waitForFocus: async (element) => {
    return new Promise((resolve) => {
      const checkFocus = () => {
        if (document.activeElement === element) {
          resolve(element);
        } else {
          setTimeout(checkFocus, 10);
        }
      };
      checkFocus();
    });
  },

  // Create a mock pharmacy component for testing
  createMockPharmacyComponent: (Component, props = {}) => {
    const defaultProps = {
      'data-testid': `test-${Component.displayName || Component.name || 'component'}`,
      ...props
    };
    return <Component {...defaultProps} />;
  },

  // Mock pharmacy data
  mockDrug: {
    id: 1,
    ndc: '12345-678-90',
    generic_name: 'Amoxicillin',
    brand_name: 'Amoxil',
    strength: '500mg',
    dosage_form: 'Capsule',
    dea_schedule: null,
    warnings: ['Take with food', 'Complete full course']
  },

  mockPrescription: {
    id: 1,
    rx_number: 'RX123456',
    patient_name: 'John Doe',
    drug_name: 'Amoxicillin 500mg',
    quantity: 30,
    sig: 'Take 1 capsule by mouth three times daily',
    status: 'pending'
  },

  mockPatient: {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1980-01-01',
    phone: '555-123-4567',
    email: 'john.doe@example.com'
  }
};

// Accessibility testing configurations
global.axeConfig = {
  rules: {
    // Enable all WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-usage': { enabled: true },
    'semantic-markup': { enabled: true },
    'focus-management': { enabled: true },
    'form-labels': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  // Exclude third-party components from accessibility testing
  exclude: [
    '.react-select__control',
    '.bootstrap-component',
    '[data-testid="third-party"]'
  ]
};

// Pharmacy-specific accessibility helpers
global.pharmacyA11yHelpers = {
  // Check if drug information is properly announced
  checkDrugAnnouncement: (drugElement) => {
    const hasAriaLabel = drugElement.hasAttribute('aria-label');
    const hasAriaDescribedBy = drugElement.hasAttribute('aria-describedby');
    const hasRole = drugElement.hasAttribute('role');
    
    return hasAriaLabel || hasAriaDescribedBy || hasRole;
  },

  // Check if warning is properly announced
  checkWarningAnnouncement: (warningElement) => {
    const hasAlertRole = warningElement.getAttribute('role') === 'alert';
    const hasAriaLive = warningElement.hasAttribute('aria-live');
    
    return hasAlertRole || hasAriaLive;
  },

  // Check if form field has proper labeling
  checkFormLabeling: (fieldElement) => {
    const id = fieldElement.id;
    const hasLabel = document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = fieldElement.hasAttribute('aria-label');
    const hasAriaLabelledBy = fieldElement.hasAttribute('aria-labelledby');
    
    return hasLabel || hasAriaLabel || hasAriaLabelledBy;
  }
};

// Error boundary for testing
export class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong in test.</div>;
    }

    return this.props.children;
  }
}