import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockApiSuccess, mockApiError, mockApiTimeout } from './test-utils';

/**
 * Enhanced Test Utilities for Comprehensive Frontend Testing
 * 
 * This file provides advanced testing utilities for:
 * - Button interaction testing
 * - Form validation testing  
 * - API error handling
 * - Accessibility testing
 * - Navigation testing
 * - Loading state testing
 */

// ============================================================================
// BUTTON TESTING UTILITIES
// ============================================================================

/**
 * Tests all buttons in a component for basic functionality
 * @param {JSX.Element} component - The React component to test
 * @param {Object} options - Test configuration options
 */
export const testAllButtons = async (component, options = {}) => {
  const {
    skipButtons = [],
    customActions = {},
    expectedDisabledButtons = [],
    timeout = 3000
  } = options;

  const { container } = renderWithProviders(component);
  
  // Find all buttons
  const buttons = container.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
  const results = {
    total: buttons.length,
    tested: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const button of buttons) {
    const buttonText = button.textContent || button.getAttribute('aria-label') || button.getAttribute('title') || `button-${results.tested}`;
    
    if (skipButtons.includes(buttonText)) {
      continue;
    }

    results.tested++;

    try {
      // Check if button is properly accessible
      expect(button).toBeInTheDocument();
      
      // Test if button is disabled when expected
      if (expectedDisabledButtons.includes(buttonText)) {
        expect(button).toBeDisabled();
      } else {
        expect(button).not.toBeDisabled();
      }

      // Test click interaction
      const user = userEvent.setup();
      
      if (customActions[buttonText]) {
        await customActions[buttonText](button, user);
      } else {
        await user.click(button);
      }

      // Test keyboard interaction (Enter and Space)
      button.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' '); // Space key

      results.passed++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        button: buttonText,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Tests button loading states
 * @param {JSX.Element} component - Component containing loading buttons
 * @param {Array} buttonSelectors - Array of button selectors to test
 */
export const testButtonLoadingStates = async (component, buttonSelectors) => {
  renderWithProviders(component);
  const user = userEvent.setup();
  const results = [];

  for (const selector of buttonSelectors) {
    const button = screen.getByRole('button', { name: selector });
    
    // Click button to trigger loading
    await user.click(button);
    
    // Check for loading indicators
    const loadingStates = [
      screen.queryByTestId('loading-spinner'),
      screen.queryByText(/loading/i),
      screen.queryByText(/please wait/i),
      button.hasAttribute('disabled')
    ];

    results.push({
      button: selector,
      hasLoadingState: loadingStates.some(state => state)
    });
  }

  return results;
};

// ============================================================================
// FORM TESTING UTILITIES
// ============================================================================

/**
 * Comprehensively tests a form with various input combinations
 * @param {JSX.Element} component - Form component to test
 * @param {Object} testCases - Test cases configuration
 */
export const testFormValidation = async (component, testCases) => {
  const {
    requiredFields = [],
    optionalFields = [],
    invalidInputs = {},
    validInputs = {},
    submitSelector = 'button[type="submit"]'
  } = testCases;

  renderWithProviders(component);
  const user = userEvent.setup();
  const results = {
    requiredFieldTests: [],
    invalidInputTests: [],
    validInputTests: [],
    submissionTest: null
  };

  // Test required fields
  for (const fieldName of requiredFields) {
    try {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      
      // Test empty submission
      const submitBtn = screen.getByRole('button', { name: /submit|save|create|update/i });
      await user.click(submitBtn);
      
      const hasValidationError = field.validity?.valueMissing || 
                                screen.queryByText(new RegExp(`${fieldName}.*required`, 'i'));
      
      results.requiredFieldTests.push({
        field: fieldName,
        showsRequiredError: !!hasValidationError,
        passed: !!hasValidationError
      });
    } catch (error) {
      results.requiredFieldTests.push({
        field: fieldName,
        error: error.message,
        passed: false
      });
    }
  }

  // Test invalid inputs
  for (const [fieldName, invalidValue] of Object.entries(invalidInputs)) {
    try {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      
      await user.clear(field);
      await user.type(field, invalidValue);
      
      // Trigger validation
      await user.tab();
      
      const hasValidationError = !field.validity?.valid || 
                                screen.queryByText(new RegExp('invalid', 'i'));
      
      results.invalidInputTests.push({
        field: fieldName,
        value: invalidValue,
        showsValidationError: !!hasValidationError,
        passed: !!hasValidationError
      });
    } catch (error) {
      results.invalidInputTests.push({
        field: fieldName,
        value: invalidValue,
        error: error.message,
        passed: false
      });
    }
  }

  // Test valid inputs
  for (const [fieldName, validValue] of Object.entries(validInputs)) {
    try {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      
      await user.clear(field);
      await user.type(field, validValue);
      
      // Trigger validation
      await user.tab();
      
      const isValid = field.validity?.valid !== false && 
                     !screen.queryByText(new RegExp(`${fieldName}.*invalid`, 'i'));
      
      results.validInputTests.push({
        field: fieldName,
        value: validValue,
        isValid,
        passed: isValid
      });
    } catch (error) {
      results.validInputTests.push({
        field: fieldName,
        value: validValue,
        error: error.message,
        passed: false
      });
    }
  }

  return results;
};

// ============================================================================
// API ERROR TESTING UTILITIES
// ============================================================================

/**
 * Tests component behavior with various API error scenarios
 * @param {JSX.Element} component - Component that makes API calls
 * @param {Object} apiEndpoints - API endpoints to test
 */
export const testApiErrorHandling = async (component, apiEndpoints) => {
  const errorScenarios = [
    { status: 400, message: 'Bad Request' },
    { status: 401, message: 'Unauthorized' },
    { status: 403, message: 'Forbidden' },
    { status: 404, message: 'Not Found' },
    { status: 429, message: 'Rate Limited' },
    { status: 500, message: 'Internal Server Error' },
    { status: 503, message: 'Service Unavailable' }
  ];

  const results = [];

  for (const [endpointName, endpoint] of Object.entries(apiEndpoints)) {
    for (const scenario of errorScenarios) {
      // Mock the error
      mockApiError(endpoint.path, scenario.status, scenario.message, endpoint.method);
      
      renderWithProviders(component);
      
      try {
        // Trigger the API call (this depends on the component)
        if (endpoint.trigger) {
          await endpoint.trigger();
        }

        // Wait for error handling
        await waitFor(() => {
          const errorElement = screen.queryByText(new RegExp(scenario.message, 'i')) ||
                              screen.queryByText(/error/i) ||
                              screen.queryByText(/something went wrong/i);
          
          results.push({
            endpoint: endpointName,
            scenario: `${scenario.status} - ${scenario.message}`,
            hasErrorHandling: !!errorElement,
            passed: !!errorElement
          });
        }, { timeout: 3000 });
      } catch (error) {
        results.push({
          endpoint: endpointName,
          scenario: `${scenario.status} - ${scenario.message}`,
          error: error.message,
          passed: false
        });
      }
    }
  }

  return results;
};

// ============================================================================
// ACCESSIBILITY TESTING UTILITIES
// ============================================================================

/**
 * Tests accessibility features of a component
 * @param {JSX.Element} component - Component to test
 * @param {Object} options - Accessibility test options
 */
export const testAccessibility = async (component, options = {}) => {
  const {
    checkLabels = true,
    checkKeyboardNavigation = true,
    checkAriaAttributes = true,
    checkColorContrast = false // Requires additional setup
  } = options;

  renderWithProviders(component);
  const user = userEvent.setup();
  const results = {
    labels: [],
    keyboardNav: [],
    ariaAttributes: [],
    colorContrast: []
  };

  if (checkLabels) {
    // Test form field labels
    const inputs = screen.getAllByRole('textbox', { hidden: false })
      .concat(screen.getAllByRole('combobox', { hidden: false }))
      .concat(screen.getAllByRole('checkbox', { hidden: false }))
      .concat(screen.getAllByRole('radio', { hidden: false }));

    for (const input of inputs) {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      screen.queryByLabelText(input.name || '');
      
      results.labels.push({
        element: input.tagName,
        hasLabel: !!hasLabel,
        passed: !!hasLabel
      });
    }
  }

  if (checkKeyboardNavigation) {
    // Test tab navigation
    const focusableElements = screen.getAllByRole('button')
      .concat(screen.getAllByRole('link'))
      .concat(screen.getAllByRole('textbox'))
      .concat(screen.getAllByRole('combobox'));

    let tabIndex = 0;
    for (const element of focusableElements) {
      try {
        await user.tab();
        const isFocused = document.activeElement === element;
        
        results.keyboardNav.push({
          element: element.tagName,
          tabIndex,
          isFocusable: !element.hasAttribute('disabled'),
          receivedFocus: isFocused,
          passed: !element.hasAttribute('disabled') ? isFocused : true
        });
        
        tabIndex++;
      } catch (error) {
        results.keyboardNav.push({
          element: element.tagName,
          error: error.message,
          passed: false
        });
      }
    }
  }

  if (checkAriaAttributes) {
    // Check for proper ARIA attributes
    const elementsWithAriaRoles = document.querySelectorAll('[role]');
    
    elementsWithAriaRoles.forEach(element => {
      const role = element.getAttribute('role');
      const hasAriaLabel = element.hasAttribute('aria-label') || 
                          element.hasAttribute('aria-labelledby');
      
      results.ariaAttributes.push({
        role,
        hasAriaLabel,
        passed: hasAriaLabel || ['presentation', 'none'].includes(role)
      });
    });
  }

  return results;
};

// ============================================================================
// NAVIGATION TESTING UTILITIES  
// ============================================================================

/**
 * Tests navigation functionality
 * @param {JSX.Element} component - Component with navigation
 * @param {Array} routes - Routes to test
 */
export const testNavigation = async (component, routes) => {
  renderWithProviders(component);
  const user = userEvent.setup();
  const results = [];

  for (const route of routes) {
    try {
      const navElement = screen.getByRole('link', { name: new RegExp(route.name, 'i') }) ||
                        screen.getByText(new RegExp(route.name, 'i'));
      
      await user.click(navElement);
      
      // Check if navigation occurred
      await waitFor(() => {
        const currentUrl = window.location.pathname;
        const navigated = currentUrl === route.path || currentUrl.includes(route.path);
        
        results.push({
          route: route.name,
          expectedPath: route.path,
          currentPath: currentUrl,
          navigated,
          passed: navigated
        });
      });
    } catch (error) {
      results.push({
        route: route.name,
        error: error.message,
        passed: false
      });
    }
  }

  return results;
};

// ============================================================================
// DATA INPUT TESTING UTILITIES
// ============================================================================

/**
 * Tests various data input scenarios
 * @param {JSX.Element} component - Component with data inputs
 * @param {Object} testData - Test data scenarios
 */
export const testDataInputs = async (component, testData) => {
  renderWithProviders(component);
  const user = userEvent.setup();
  const results = [];

  for (const [fieldName, scenarios] of Object.entries(testData)) {
    for (const scenario of scenarios) {
      try {
        const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
        
        // Clear and input data
        await user.clear(field);
        await user.type(field, scenario.input);
        
        // Trigger validation/processing
        await user.tab();
        
        // Check results
        const fieldValue = field.value;
        const isValid = field.validity?.valid !== false;
        const matchesExpected = scenario.expected ? fieldValue === scenario.expected : true;
        
        results.push({
          field: fieldName,
          scenario: scenario.name,
          input: scenario.input,
          output: fieldValue,
          expected: scenario.expected,
          isValid,
          matchesExpected,
          passed: isValid && matchesExpected
        });
      } catch (error) {
        results.push({
          field: fieldName,
          scenario: scenario.name,
          error: error.message,
          passed: false
        });
      }
    }
  }

  return results;
};

// ============================================================================
// COMPREHENSIVE TEST RUNNER
// ============================================================================

/**
 * Runs all comprehensive tests on a component
 * @param {JSX.Element} component - Component to test comprehensively
 * @param {Object} testConfig - Configuration for all tests
 */
export const runComprehensiveTests = async (component, testConfig = {}) => {
  const results = {
    timestamp: new Date().toISOString(),
    component: testConfig.componentName || 'Unknown',
    results: {}
  };

  console.log(`🧪 Starting comprehensive tests for ${results.component}`);

  try {
    // Button tests
    if (testConfig.buttons) {
      console.log('🔘 Testing buttons...');
      results.results.buttons = await testAllButtons(component, testConfig.buttons);
    }

    // Form validation tests
    if (testConfig.forms) {
      console.log('📝 Testing form validation...');
      results.results.forms = await testFormValidation(component, testConfig.forms);
    }

    // API error tests
    if (testConfig.apiErrors) {
      console.log('🌐 Testing API error handling...');
      results.results.apiErrors = await testApiErrorHandling(component, testConfig.apiErrors);
    }

    // Accessibility tests
    if (testConfig.accessibility) {
      console.log('♿ Testing accessibility...');
      results.results.accessibility = await testAccessibility(component, testConfig.accessibility);
    }

    // Navigation tests
    if (testConfig.navigation) {
      console.log('🧭 Testing navigation...');
      results.results.navigation = await testNavigation(component, testConfig.navigation);
    }

    // Data input tests
    if (testConfig.dataInputs) {
      console.log('💾 Testing data inputs...');
      results.results.dataInputs = await testDataInputs(component, testConfig.dataInputs);
    }

    console.log(`✅ Comprehensive tests completed for ${results.component}`);
  } catch (error) {
    console.error(`❌ Comprehensive tests failed for ${results.component}:`, error);
    results.error = error.message;
  }

  return results;
};

export default {
  testAllButtons,
  testButtonLoadingStates,
  testFormValidation,
  testApiErrorHandling,
  testAccessibility,
  testNavigation,
  testDataInputs,
  runComprehensiveTests
};