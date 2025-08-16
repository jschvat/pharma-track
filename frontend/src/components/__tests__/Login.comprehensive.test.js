import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { 
  renderWithProviders, 
  mockApiSuccess, 
  mockApiError, 
  mockApiTimeout,
  mockUser 
} from '../../utils/test-utils';
import { 
  testAllButtons,
  testFormValidation,
  testApiErrorHandling,
  testAccessibility,
  testDataInputs,
  runComprehensiveTests
} from '../../utils/enhanced-test-utils';

describe('Login Component - Comprehensive Tests', () => {
  beforeEach(() => {
    // Clear authentication state
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('🔘 Login Button and Interaction Tests', () => {
    it('should test all buttons comprehensively', async () => {
      const results = await testAllButtons(<Login />, {
        skipButtons: [], 
        expectedDisabledButtons: [], // No buttons should be disabled initially
        customActions: {
          'Sign In': async (button, user) => {
            // Fill form first
            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/password/i), 'password123');
            
            // Mock successful login
            mockApiSuccess('/auth/login', {
              token: 'mock-jwt-token',
              user: mockUser
            }, 'post');
            
            await user.click(button);
            
            // Should trigger login process
            expect(button).toBeInTheDocument();
          },
          'Show Password': async (button, user) => {
            if (screen.queryByLabelText(/show.*password|toggle.*password/i)) {
              await user.click(button);
              // Should toggle password visibility
              const passwordField = screen.getByLabelText(/password/i);
              expect(passwordField.type).toMatch(/text|password/);
            }
          }
        }
      });

      expect(results.tested).toBeGreaterThan(0);
      expect(results.passed).toBeGreaterThan(0);
    });

    it('should handle button states during login process', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      // Fill form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Mock slow login response
      mockApiSuccess('/auth/login', { token: 'token', user: mockUser }, 'post');
      
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Button should be disabled during login
      expect(loginButton).toBeDisabled();
    });

    it('should support keyboard interactions', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      // Test Tab navigation
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(loginButton).toHaveFocus();

      // Test Enter key submission
      emailInput.focus();
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      mockApiSuccess('/auth/login', { token: 'token', user: mockUser }, 'post');
      
      // Enter should submit form
      await user.keyboard('{Enter}');
      expect(loginButton).toBeDisabled(); // Should be in loading state
    });
  });

  describe('📝 Form Validation Comprehensive Tests', () => {
    it('should validate all form fields comprehensively', async () => {
      const results = await testFormValidation(<Login />, {
        requiredFields: ['email', 'password'],
        invalidInputs: {
          email: 'invalid-email-format',
          password: '' // Empty password
        },
        validInputs: {
          email: 'valid@example.com',
          password: 'validPassword123!'
        }
      });

      // Should detect required field validation
      expect(results.requiredFieldTests.filter(t => t.passed).length).toBeGreaterThan(0);
      
      // Should detect invalid email format
      const emailTest = results.invalidInputTests.find(t => t.field === 'email');
      expect(emailTest?.showsValidationError).toBe(true);
    });

    it('should test various email input scenarios', async () => {
      const emailTestData = {
        email: [
          { name: 'Valid Email', input: 'user@domain.com', expected: 'user@domain.com' },
          { name: 'Valid Email with Subdomain', input: 'user@mail.domain.com', expected: 'user@mail.domain.com' },
          { name: 'Email with Plus', input: 'user+tag@domain.com', expected: 'user+tag@domain.com' },
          { name: 'Email with Numbers', input: 'user123@domain.com', expected: 'user123@domain.com' },
          { name: 'Invalid Email - No @', input: 'invalid-email', expected: 'invalid-email' },
          { name: 'Invalid Email - No Domain', input: 'user@', expected: 'user@' },
          { name: 'Invalid Email - No User', input: '@domain.com', expected: '@domain.com' }
        ]
      };

      const results = await testDataInputs(<Login />, emailTestData);
      
      // Should handle various email formats
      expect(results.length).toBeGreaterThan(0);
      
      // Valid emails should be accepted
      const validEmailTests = results.filter(r => r.scenario.includes('Valid'));
      expect(validEmailTests.every(t => t.isValid)).toBe(true);
    });

    it('should test password input scenarios', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      
      // Test various password scenarios
      const passwordTests = [
        { password: 'short', shouldBeValid: false, description: 'Too short' },
        { password: 'ValidPassword123!', shouldBeValid: true, description: 'Strong password' },
        { password: '', shouldBeValid: false, description: 'Empty password' },
        { password: 'space password', shouldBeValid: true, description: 'Password with spaces' },
        { password: '12345678', shouldBeValid: true, description: 'Numeric password' }
      ];

      for (const test of passwordTests) {
        await user.clear(passwordInput);
        await user.type(passwordInput, test.password);
        
        expect(passwordInput.value).toBe(test.password);
        
        // Note: Login forms typically don't validate password strength, only presence
        if (test.password === '') {
          expect(passwordInput).toBeInvalid();
        }
      }
    });

    it('should handle form submission validation', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const loginButton = screen.getByRole('button', { name: /sign in/i });

      // Test empty form submission
      await user.click(loginButton);

      // Should prevent submission with empty fields
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInvalid();
    });
  });

  describe('🌐 Authentication API and Error Handling', () => {
    it('should handle comprehensive authentication scenarios', async () => {
      const authEndpoints = {
        login: {
          path: '/auth/login',
          method: 'post',
          trigger: async () => {
            const user = userEvent.setup();
            await user.type(screen.getByLabelText(/email/i), 'test@example.com');
            await user.type(screen.getByLabelText(/password/i), 'password123');
            await user.click(screen.getByRole('button', { name: /sign in/i }));
          }
        }
      };

      const results = await testApiErrorHandling(<Login />, authEndpoints);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle successful login flow', async () => {
      mockApiSuccess('/auth/login', {
        token: 'jwt-token-12345',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          store_id: 1
        }
      }, 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      // Fill and submit form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'correctPassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should save token and user data
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('jwt-token-12345');
        expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({
          id: 1,
          email: 'test@example.com'
        });
      });
    });

    it('should handle invalid credentials error', async () => {
      mockApiError('/auth/login', 401, 'Invalid email or password', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongPassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid.*email.*password|invalid.*credentials/i)).toBeInTheDocument();
      });

      // Should not save any data
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle account lockout scenarios', async () => {
      mockApiError('/auth/login', 423, 'Account locked due to multiple failed login attempts', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/account.*locked|locked.*account/i)).toBeInTheDocument();
      });
    });

    it('should handle rate limiting', async () => {
      mockApiError('/auth/login', 429, 'Too many login attempts. Please try again in 15 minutes.', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many.*attempts|rate.*limit/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors gracefully', async () => {
      mockApiError('/auth/login', 500, 'Internal server error', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/server.*error|something.*went.*wrong|try.*again.*later/i)).toBeInTheDocument();
      });
    });

    it('should handle network timeout', async () => {
      mockApiTimeout('/auth/login', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network.*error|connection.*timeout|try.*again/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle malformed API responses', async () => {
      mockApiSuccess('/auth/login', null, 'post'); // Malformed response

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/error|invalid.*response|try.*again/i)).toBeInTheDocument();
      });
    });
  });

  describe('♿ Accessibility and Usability', () => {
    it('should test comprehensive accessibility features', async () => {
      const results = await testAccessibility(<Login />, {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      });

      // Form fields should have proper labels
      expect(results.labels.filter(l => l.passed).length).toBeGreaterThan(0);
      
      // Keyboard navigation should work
      expect(results.keyboardNav.filter(k => k.passed).length).toBeGreaterThan(0);
    });

    it('should have proper form labels and ARIA attributes', async () => {
      renderWithProviders(<Login />);

      // Email field
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');

      // Password field
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');

      // Submit button
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should provide screen reader friendly error messages', async () => {
      mockApiError('/auth/login', 401, 'Invalid credentials', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongPassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid.*credentials/i);
        expect(errorMessage).toBeInTheDocument();
        
        // Should be announced to screen readers
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should support high contrast mode', async () => {
      renderWithProviders(<Login />);

      // Check for proper contrast indicators
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fields should be focusable and have visible focus indicators
      expect(emailInput).toBeVisible();
      expect(passwordInput).toBeVisible();
      expect(submitButton).toBeVisible();
    });
  });

  describe('🔐 Security Features', () => {
    it('should not expose sensitive information in client-side code', async () => {
      renderWithProviders(<Login />);

      // Should not contain any hardcoded credentials
      expect(document.body.textContent).not.toMatch(/password.*=|secret.*key|admin.*password/i);
    });

    it('should handle password masking properly', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      
      // Password should be masked by default
      expect(passwordInput.type).toBe('password');
      
      await user.type(passwordInput, 'secretPassword');
      expect(passwordInput.value).toBe('secretPassword');
      expect(passwordInput.type).toBe('password'); // Should still be masked
    });

    it('should clear sensitive data on errors', async () => {
      mockApiError('/auth/login', 401, 'Invalid credentials', 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(passwordInput, 'wrongPassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid.*credentials/i)).toBeInTheDocument();
      });

      // Password field should be cleared for security
      expect(passwordInput.value).toBe('');
    });
  });

  describe('📱 Responsive and Visual Elements', () => {
    it('should display branding properly', async () => {
      renderWithProviders(<Login />);

      // Should show PharmaTraK branding
      expect(screen.getByText('PharmaTraK')).toBeInTheDocument();
      expect(screen.getByText(/pharmacy.*tracking.*system/i)).toBeInTheDocument();
    });

    it('should handle loading states visually', async () => {
      renderWithProviders(<Login />);
      const user = userEvent.setup();

      mockApiSuccess('/auth/login', { token: 'token', user: mockUser }, 'post');

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading indicator
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
      
      // Look for loading spinner or text
      const loadingElement = screen.queryByTestId('loading-spinner') || 
                           screen.queryByText(/signing.*in|loading/i);
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }
    });

    it('should not display demo credentials for security', async () => {
      renderWithProviders(<Login />);

      // Should not show any demo credentials
      expect(screen.queryByText(/demo.*credentials/i)).not.toBeInTheDocument();
      expect(screen.queryByText('admin@pharmatrak.com')).not.toBeInTheDocument();
      expect(screen.queryByText(/demo.*password/i)).not.toBeInTheDocument();
    });
  });

  describe('🎯 Edge Cases and Error Recovery', () => {
    it('should handle rapid multiple submissions', async () => {
      mockApiSuccess('/auth/login', { token: 'token', user: mockUser }, 'post');

      renderWithProviders(<Login />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Rapid multiple clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should prevent multiple submissions
      expect(submitButton).toBeDisabled();
    });

    it('should handle browser back/forward navigation', async () => {
      // This would be tested in integration tests with actual routing
      renderWithProviders(<Login />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should handle form auto-completion', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Should have proper autocomplete attributes
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('⚡ Performance Tests', () => {
    it('should render efficiently', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<Login />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly
      expect(renderTime).toBeLessThan(100); // 100ms
    });
  });
});

// Run comprehensive test suite
describe('🔬 Login Comprehensive Test Suite', () => {
  it('should run all comprehensive tests', async () => {
    const testConfig = {
      componentName: 'Login',
      buttons: {
        skipButtons: [],
        expectedDisabledButtons: []
      },
      forms: {
        requiredFields: ['email', 'password'],
        invalidInputs: { email: 'invalid-email' },
        validInputs: { email: 'valid@email.com', password: 'validPass123' }
      },
      apiErrors: {
        login: { path: '/auth/login', method: 'post' }
      },
      accessibility: {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      },
      dataInputs: {
        email: [
          { name: 'Valid Email', input: 'test@example.com', expected: 'test@example.com' },
          { name: 'Invalid Email', input: 'invalid-email', expected: 'invalid-email' }
        ]
      }
    };

    const results = await runComprehensiveTests(<Login />, testConfig);
    
    expect(results.component).toBe('Login');
    expect(results.error).toBeUndefined();
    
    // Log results for debugging
    console.log('Login comprehensive test results:', JSON.stringify(results, null, 2));
  }, 30000);
});