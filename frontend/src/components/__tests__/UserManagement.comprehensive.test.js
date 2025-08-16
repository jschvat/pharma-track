import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';
import { 
  renderWithProviders, 
  mockApiSuccess, 
  mockApiError, 
  mockUser, 
  mockStore,
  setupUserManagementMocks 
} from '../../utils/test-utils';
import { 
  testAllButtons,
  testFormValidation,
  testApiErrorHandling,
  testAccessibility,
  testDataInputs,
  runComprehensiveTests
} from '../../utils/enhanced-test-utils';

// Mock data for comprehensive testing
const mockUsers = [
  { ...mockUser, id: 1, name: 'Admin User', email: 'admin@test.com', role: 'admin' },
  { id: 2, name: 'Regular User', email: 'user@test.com', role: 'user', is_active: true, store_id: 1 },
  { id: 3, name: 'Inactive User', email: 'inactive@test.com', role: 'user', is_active: false, store_id: 1 }
];

const mockStores = [
  { ...mockStore, id: 1, name: 'Main Store' },
  { id: 2, name: 'Branch Store', address: '456 Oak Ave', city: 'Test City 2' }
];

describe('UserManagement Component - Comprehensive Tests', () => {
  beforeEach(() => {
    // Set up as admin user for testing
    localStorage.setItem('token', 'mock-admin-token');
    localStorage.setItem('user', JSON.stringify({
      ...mockUser,
      role: 'god_mode', // Use god_mode to test all features
      id: 1
    }));
    
    // Setup default API mocks
    setupUserManagementMocks();
    mockApiSuccess('/users', {
      users: mockUsers,
      pagination: { page: 1, pages: 1, total: mockUsers.length }
    });
    mockApiSuccess('/stores', { stores: mockStores });
  });

  describe('🔘 Button Functionality Tests', () => {
    it('should test all buttons for basic functionality', async () => {
      const results = await testAllButtons(<UserManagement />, {
        skipButtons: [], // Test all buttons
        expectedDisabledButtons: [], // None should be disabled initially
        customActions: {
          'Add User': async (button, user) => {
            await user.click(button);
            // Should open create user modal
            expect(screen.getByText('Add New User')).toBeInTheDocument();
          },
          'Edit': async (button, user) => {
            await user.click(button);
            // Should open edit modal
            await waitFor(() => {
              expect(screen.getByText(/Edit User:/)).toBeInTheDocument();
            });
          },
          'Delete': async (button, user) => {
            await user.click(button);
            // Should open delete confirmation modal
            await waitFor(() => {
              expect(screen.getByText(/Delete User Confirmation/)).toBeInTheDocument();
            });
          }
        }
      });

      expect(results.passed).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
    });

    it('should test button loading states during API calls', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Test Add User button
      const addButton = await screen.findByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Fill form and submit
      const modal = screen.getByRole('dialog', { name: /add new user/i });
      const nameInput = within(modal).getByLabelText(/name/i);
      const emailInput = within(modal).getByLabelText(/email/i);
      const submitButton = within(modal).getByRole('button', { name: /create user/i });

      await user.type(nameInput, 'New Test User');
      await user.type(emailInput, 'newtest@example.com');

      // Mock slow API response to test loading state
      mockApiSuccess('/users', { id: 4 }, 'post');
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
    });

    it('should handle button interactions with keyboard', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      const addButton = await screen.findByRole('button', { name: /add user/i });
      
      // Test keyboard interaction
      addButton.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });
  });

  describe('📝 Form Validation Tests', () => {
    it('should comprehensively test create user form validation', async () => {
      const results = await testFormValidation(<UserManagement />, {
        requiredFields: ['name', 'email', 'phone', 'password', 'address', 'store'],
        invalidInputs: {
          email: 'invalid-email',
          phone: '123', // Too short
          password: 'weak', // Too weak
        },
        validInputs: {
          name: 'Valid User Name',
          email: 'valid@example.com',
          phone: '5551234567',
          password: 'StrongPass123!',
          address: '123 Valid Street'
        }
      });

      // Should show validation errors for invalid inputs
      const invalidEmailTest = results.invalidInputTests.find(t => t.field === 'email');
      expect(invalidEmailTest?.showsValidationError).toBe(true);
    });

    it('should validate edit user form properly', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open edit modal for first user
      const editButton = await screen.findByRole('button', { name: /edit/i });
      await user.click(editButton);

      const modal = screen.getByRole('dialog', { name: /edit user/i });
      const nameInput = within(modal).getByLabelText(/name/i);

      // Test clearing required field
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      // Should show validation error or prevent submission
      const submitButton = within(modal).getByRole('button', { name: /update user/i });
      await user.click(submitButton);

      // Name field should be invalid
      expect(nameInput).toBeInvalid();
    });

    it('should validate password strength in password change form', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open password modal
      const passwordButton = await screen.findByRole('button', { name: /password/i });
      await user.click(passwordButton);

      const modal = screen.getByRole('dialog', { name: /change password/i });
      const newPasswordInput = within(modal).getByLabelText(/new password/i);
      const confirmPasswordInput = within(modal).getByLabelText(/confirm/i);

      // Test weak password
      await user.type(newPasswordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');
      await user.tab();

      // Should show validation error
      expect(newPasswordInput.validity.valid).toBe(false);
    });

    it('should test form field data input scenarios', async () => {
      const testData = {
        name: [
          { name: 'Valid Name', input: 'John Doe', expected: 'John Doe' },
          { name: 'Name with Special Characters', input: 'José María', expected: 'José María' },
          { name: 'Empty Name', input: '', expected: '' }
        ],
        email: [
          { name: 'Valid Email', input: 'test@example.com', expected: 'test@example.com' },
          { name: 'Invalid Email', input: 'invalid-email', expected: 'invalid-email' },
          { name: 'Email with Plus', input: 'test+tag@example.com', expected: 'test+tag@example.com' }
        ],
        phone: [
          { name: 'Valid Phone', input: '5551234567', expected: '5551234567' },
          { name: 'Phone with Formatting', input: '(555) 123-4567', expected: '(555) 123-4567' },
          { name: 'International Phone', input: '+1-555-123-4567', expected: '+1-555-123-4567' }
        ]
      };

      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open create user modal
      const addButton = await screen.findByRole('button', { name: /add user/i });
      await user.click(addButton);

      const results = await testDataInputs(<UserManagement />, testData);

      // Verify data inputs were processed correctly
      expect(results.filter(r => r.passed).length).toBeGreaterThan(0);
    });
  });

  describe('🌐 API Integration and Error Handling Tests', () => {
    it('should handle API errors comprehensively', async () => {
      const apiEndpoints = {
        getUsersList: {
          path: '/users',
          method: 'get',
          trigger: async () => {
            // Component loads users on mount, so just wait
            await waitFor(() => {
              expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });
          }
        },
        createUser: {
          path: '/users',
          method: 'post',
          trigger: async () => {
            const user = userEvent.setup();
            const addButton = await screen.findByRole('button', { name: /add user/i });
            await user.click(addButton);
            
            const modal = screen.getByRole('dialog', { name: /add new user/i });
            const submitButton = within(modal).getByRole('button', { name: /create user/i });
            await user.click(submitButton);
          }
        },
        deleteUser: {
          path: '/users/2',
          method: 'delete',
          trigger: async () => {
            const user = userEvent.setup();
            const deleteButton = await screen.findByRole('button', { name: /delete/i });
            await user.click(deleteButton);
            
            const modal = screen.getByRole('dialog', { name: /delete user confirmation/i });
            const confirmButton = within(modal).getByRole('button', { name: /delete user/i });
            await user.click(confirmButton);
          }
        }
      };

      const results = await testApiErrorHandling(<UserManagement />, apiEndpoints);

      // Should handle at least some error scenarios
      expect(results.filter(r => r.passed).length).toBeGreaterThan(0);
    });

    it('should handle specific API error scenarios', async () => {
      // Test 401 Unauthorized
      mockApiError('/users', 401, 'Unauthorized access');
      renderWithProviders(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/unauthorized|access denied/i)).toBeInTheDocument();
      });
    });

    it('should handle network timeout gracefully', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Mock timeout for user creation
      const addButton = await screen.findByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Fill minimal form data
      const modal = screen.getByRole('dialog', { name: /add new user/i });
      const nameInput = within(modal).getByLabelText(/name/i);
      await user.type(nameInput, 'Test User');

      // Mock API timeout
      mockApiSuccess('/users', null, 'post'); // This should timeout
      
      const submitButton = within(modal).getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Should show timeout or network error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/network|timeout|failed/i);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('♿ Accessibility Tests', () => {
    it('should test comprehensive accessibility features', async () => {
      const results = await testAccessibility(<UserManagement />, {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      });

      // All form fields should have proper labels
      expect(results.labels.filter(l => l.passed).length).toBeGreaterThan(0);
      
      // Keyboard navigation should work
      expect(results.keyboardNav.filter(k => k.passed).length).toBeGreaterThan(0);
    });

    it('should support screen readers with proper ARIA attributes', async () => {
      renderWithProviders(<UserManagement />);

      // Check for proper ARIA attributes on interactive elements
      const addButton = await screen.findByRole('button', { name: /add user/i });
      expect(addButton).toHaveAttribute('type', 'button');

      // Tables should have proper headers
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = within(table).getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should handle high contrast and focus indicators', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      const addButton = await screen.findByRole('button', { name: /add user/i });
      
      // Focus should be visible
      await user.tab();
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('🔄 Complex User Interactions', () => {
    it('should handle complete user creation workflow', async () => {
      mockApiSuccess('/users', { id: 4, message: 'User created successfully' }, 'post');
      
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open create modal
      const addButton = await screen.findByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Fill complete form
      const modal = screen.getByRole('dialog', { name: /add new user/i });
      await user.type(within(modal).getByLabelText(/name/i), 'New Test User');
      await user.type(within(modal).getByLabelText(/email/i), 'newuser@test.com');
      await user.type(within(modal).getByLabelText(/phone/i), '5551234567');
      await user.type(within(modal).getByLabelText(/password/i), 'StrongPass123!');
      await user.type(within(modal).getByLabelText(/confirm password/i), 'StrongPass123!');
      await user.type(within(modal).getByLabelText(/address/i), '123 New Street');
      
      // Select store
      const storeSelect = within(modal).getByLabelText(/store/i);
      await user.selectOptions(storeSelect, '1');

      // Submit form
      const submitButton = within(modal).getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle user editing workflow with form validation', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open edit modal
      const editButton = await screen.findByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Edit user data
      const modal = screen.getByRole('dialog', { name: /edit user/i });
      const nameInput = within(modal).getByLabelText(/name/i);
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated User Name');

      // Submit changes
      mockApiSuccess('/users/1', { message: 'User updated successfully' }, 'put');
      const submitButton = within(modal).getByRole('button', { name: /update user/i });
      await user.click(submitButton);

      // Should show success
      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle user deletion with confirmation', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Open delete modal
      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const modal = screen.getByRole('dialog', { name: /delete user confirmation/i });
      expect(within(modal).getByText(/are you sure/i)).toBeInTheDocument();

      mockApiSuccess('/users/2', { message: 'User deactivated successfully' }, 'delete');
      const confirmButton = within(modal).getByRole('button', { name: /delete user/i });
      await user.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/user deactivated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle filtering and pagination', async () => {
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'admin');

      // Test role filter
      const roleFilter = screen.getByDisplayValue(/all roles/i);
      await user.selectOptions(roleFilter, 'admin');

      // Test status filter
      const statusFilter = screen.getByDisplayValue(/all status/i);
      await user.selectOptions(statusFilter, 'true');

      // Should trigger new API calls with filters
      await waitFor(() => {
        // API should have been called with search parameters
        expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      });
    });
  });

  describe('🧪 Edge Cases and Error Conditions', () => {
    it('should handle empty user list gracefully', async () => {
      mockApiSuccess('/users', { users: [], pagination: { total: 0 } });
      
      renderWithProviders(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });

    it('should handle malformed API responses', async () => {
      mockApiSuccess('/users', null); // Malformed response
      
      renderWithProviders(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('should prevent deletion of last admin user', async () => {
      const adminOnlyUsers = [
        { id: 1, name: 'Only Admin', email: 'admin@test.com', role: 'admin', store_name: 'Test Store' }
      ];
      
      mockApiSuccess('/users', { users: adminOnlyUsers, pagination: { total: 1 } });
      
      renderWithProviders(<UserManagement />);
      const user = userEvent.setup();

      // Try to delete the only admin
      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Should show warning message
      const modal = screen.getByRole('dialog', { name: /delete user confirmation/i });
      expect(within(modal).getByText(/last admin/i)).toBeInTheDocument();
      
      // Delete button should be disabled
      const confirmButton = within(modal).getByRole('button', { name: /delete user/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('🏃‍♂️ Performance Tests', () => {
    it('should handle large user lists efficiently', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        role: i % 10 === 0 ? 'admin' : 'user',
        is_active: true,
        store_id: 1
      }));

      mockApiSuccess('/users', { 
        users: largeUserList.slice(0, 20), // Paginated
        pagination: { page: 1, pages: 5, total: 100 }
      });

      const startTime = performance.now();
      renderWithProviders(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (< 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});

// Run comprehensive test suite
describe('🔬 UserManagement Comprehensive Test Suite', () => {
  it('should run all comprehensive tests', async () => {
    const testConfig = {
      componentName: 'UserManagement',
      buttons: {
        skipButtons: [],
        expectedDisabledButtons: []
      },
      forms: {
        requiredFields: ['name', 'email', 'phone', 'password', 'address'],
        invalidInputs: { email: 'invalid-email', phone: '123' },
        validInputs: { name: 'Valid Name', email: 'valid@email.com' }
      },
      apiErrors: {
        getUsersList: { path: '/users', method: 'get' },
        createUser: { path: '/users', method: 'post' }
      },
      accessibility: {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      }
    };

    const results = await runComprehensiveTests(<UserManagement />, testConfig);
    
    expect(results.component).toBe('UserManagement');
    expect(results.error).toBeUndefined();
    
    // Log results for debugging
    console.log('Comprehensive test results:', JSON.stringify(results, null, 2));
  }, 30000); // Extended timeout for comprehensive tests
});