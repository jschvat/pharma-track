import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { renderWithProviders, mockApiSuccess, mockApiError, mockApiTimeout } from '../../utils/test-utils';

describe('Login Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('renders login form elements', () => {
      renderWithProviders(<Login />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders PharmaTraK branding', () => {
      renderWithProviders(<Login />);
      
      expect(screen.getByText('PharmaTraK')).toBeInTheDocument();
      expect(screen.getByText(/pharmacy tracking system/i)).toBeInTheDocument();
    });

    it('does not show demo credentials section', () => {
      renderWithProviders(<Login />);
      
      // Verify demo credentials are removed for security
      expect(screen.queryByText(/demo credentials/i)).not.toBeInTheDocument();
      expect(screen.queryByText('admin@pharmatrak.com')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // HTML5 validation should prevent submission
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInvalid();
    });

    it('accepts valid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(emailInput).toBeValid();
    });
  });

  describe('Authentication Flow', () => {
    it('handles successful login', async () => {
      const mockUserData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        store_id: 1
      };

      // Mock successful login API response
      mockApiSuccess('/auth/login', {
        token: 'mock-jwt-token',
        user: mockUserData
      }, 'post');

      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for API call and navigation
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('mock-jwt-token');
        expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUserData);
      });
    });

    it('handles login failure with invalid credentials', async () => {
      mockApiError('/auth/login', 401, 'Invalid credentials', 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
      
      // Should not set localStorage
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('handles rate limiting error', async () => {
      mockApiError('/auth/login', 429, 'Too many login attempts from this IP, please try again after 15 minutes.', 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for rate limit message
      await waitFor(() => {
        expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument();
      });
    });

    it('handles server errors gracefully', async () => {
      mockApiError('/auth/login', 500, 'Internal server error', 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/server error|something went wrong/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout', async () => {
      mockApiTimeout('/auth/login', 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for timeout error
      await waitFor(() => {
        expect(screen.getByText(/network error|timeout/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner during login attempt', async () => {
      // Mock slow API response
      mockApiSuccess('/auth/login', { token: 'token', user: {} }, 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Should show loading state
      expect(screen.getByTestId('loading-spinner') || screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('disables form during submission', async () => {
      mockApiSuccess('/auth/login', { token: 'token', user: {} }, 'post');
      
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Fill out form
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Submit form
      await user.click(submitButton);
      
      // Form should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Tab navigation should work
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
});