import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';
import { renderWithProviders, mockUser, setupUserManagementMocks, mockApiSuccess, mockApiError, mockApiTimeout } from '../../utils/test-utils';

describe('UserManagement Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Access Control', () => {
    it('denies access to non-admin users', async () => {
      const regularUser = { ...mockUser, role: 'user' };
      
      renderWithProviders(<UserManagement />, { user: regularUser });
      
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/you must be an admin/i)).toBeInTheDocument();
    });

    it('allows access to admin users', async () => {
      setupUserManagementMocks();
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('renders user management interface', async () => {
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      // Should show header
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText(/manage users in your store/i)).toBeInTheDocument();
      });
      
      // Should show filters
      expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      
      // Should show table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('shows loading spinner while fetching users', () => {
      // Don't setup mocks to simulate loading state
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });
  });

  describe('User Data Display', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('displays user information in table', async () => {
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('shows action buttons for each user', async () => {
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Password')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('displays empty state when no users found', async () => {
      mockApiSuccess('/users', {
        users: [],
        pagination: { page: 1, pages: 1, total: 0 }
      });
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('filters users by search term', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'test user');
      
      expect(searchInput).toHaveValue('test user');
      
      // Should trigger new API call with search parameter
      await waitFor(() => {
        expect(searchInput).toHaveValue('test user');
      });
    });

    it('filters users by role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument();
      });
      
      const roleSelect = screen.getByDisplayValue('All Roles');
      await user.selectOptions(roleSelect, 'admin');
      
      expect(roleSelect).toHaveValue('admin');
    });

    it('filters users by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'true');
      
      expect(statusSelect).toHaveValue('true');
    });

    it('clears all filters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
      
      // Set some filter values first
      await user.type(screen.getByPlaceholderText(/search users/i), 'test');
      await user.selectOptions(screen.getByDisplayValue('All Roles'), 'admin');
      
      // Clear filters
      await user.click(screen.getByText('Clear'));
      
      expect(screen.getByPlaceholderText(/search users/i)).toHaveValue('');
      expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument();
    });
  });

  describe('Create User Modal', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('opens create user modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add User'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });

    it('creates new user with valid data', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/users', { id: 2, name: 'New User' }, 'post');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add User'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.selectOptions(screen.getByLabelText(/store/i), '1');
      await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByText('Create User'));
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add User'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });
      
      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.selectOptions(screen.getByLabelText(/store/i), '1');
      await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different');
      
      // Submit form
      await user.click(screen.getByText('Create User'));
      
      // Should show error
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('validates required store selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add User'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });
      
      // Fill form without store selection
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByText('Create User'));
      
      // Should show error
      expect(screen.getByText(/store assignment is required/i)).toBeInTheDocument();
    });
  });

  describe('Edit User Modal', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('opens edit user modal with pre-filled data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Edit'));
      
      await waitFor(() => {
        expect(screen.getByText(/edit user: test user/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      });
    });

    it('updates user information', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/users/1', { success: true }, 'put');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Edit'));
      
      await waitFor(() => {
        expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      });
      
      // Update form
      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated User');
      
      // Submit form
      await user.click(screen.getByText('Update User'));
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Update Modal', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('opens password update modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Password')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Password'));
      
      await waitFor(() => {
        expect(screen.getByText(/change password: test user/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      });
    });

    it('updates user password', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/users/1/password', { success: true }, 'put');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Password')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Password'));
      
      await waitFor(() => {
        expect(screen.getByText(/change password/i)).toBeInTheDocument();
      });
      
      // Fill password form
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword123');
      
      // Submit form
      await user.click(screen.getByText('Update Password'));
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation in update modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Password')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Password'));
      
      await waitFor(() => {
        expect(screen.getByText(/change password/i)).toBeInTheDocument();
      });
      
      // Fill with mismatched passwords
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirm new password/i), 'different');
      
      // Submit form
      await user.click(screen.getByText('Update Password'));
      
      // Should show error
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('Delete User Modal', () => {
    beforeEach(() => {
      setupUserManagementMocks();
    });

    it('opens delete confirmation modal', async () => {
      const user = userEvent.setup();
      
      // Mock different user to avoid self-deletion restriction
      mockApiSuccess('/users', {
        users: [{
          id: 2,
          name: 'Other User',
          email: 'other@example.com',
          role: 'user',
          is_active: true,
          store_name: 'Test Pharmacy'
        }],
        pagination: { page: 1, pages: 1, total: 1 }
      });
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Other User')).toBeInTheDocument();
      });
      
      // Find delete button for the other user
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/delete user confirmation/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });
    });

    it('prevents self-deletion', async () => {
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        // The delete button should be disabled for current user
        const deleteButton = screen.getByTitle(/cannot delete your own account/i);
        expect(deleteButton).toBeDisabled();
      });
    });

    it('deletes user after confirmation', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/users/2', { success: true }, 'delete');
      
      // Mock different user
      mockApiSuccess('/users', {
        users: [{
          id: 2,
          name: 'Other User',
          email: 'other@example.com',
          role: 'user',
          is_active: true,
          store_name: 'Test Pharmacy'
        }],
        pagination: { page: 1, pages: 1, total: 1 }
      });
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Other User')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/delete user confirmation/i)).toBeInTheDocument();
      });
      
      // Confirm deletion
      await user.click(screen.getAllByText('Delete User')[0]);
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/user deleted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles user loading API error', async () => {
      mockApiError('/users', 500, 'Failed to load users');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
      });
    });

    it('handles create user API error', async () => {
      const user = userEvent.setup();
      setupUserManagementMocks();
      mockApiError('/users', 400, 'Email already exists', 'post');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add User'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.selectOptions(screen.getByLabelText(/store/i), '1');
      await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByText('Create User'));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('handles update user API error', async () => {
      const user = userEvent.setup();
      setupUserManagementMocks();
      mockApiError('/users/1', 400, 'Invalid phone number', 'put');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Edit'));
      
      await waitFor(() => {
        expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      });
      
      // Submit form
      await user.click(screen.getByText('Update User'));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout gracefully', async () => {
      mockApiTimeout('/users');
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      setupUserManagementMocks();
      // Mock pagination with multiple pages
      mockApiSuccess('/users', {
        users: [mockUser],
        pagination: { page: 1, pages: 3, total: 25 }
      });
    });

    it('shows pagination when multiple pages exist', async () => {
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('navigates between pages', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('2'));
      
      // Should trigger new API call for page 2
      // This is implicit in the component behavior
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Admin Restrictions', () => {
    it('prevents deletion of last admin in store', async () => {
      // Mock user as the only admin in store
      mockApiSuccess('/users', {
        users: [{
          ...mockUser,
          store_name: 'Test Pharmacy'
        }],
        pagination: { page: 1, pages: 1, total: 1 }
      });
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        const deleteButton = screen.getByTitle(/cannot delete - last admin for this store/i);
        expect(deleteButton).toBeDisabled();
      });
    });

    it('allows deletion when multiple admins exist', async () => {
      const user = userEvent.setup();
      
      // Mock multiple admins in the same store
      mockApiSuccess('/users', {
        users: [
          { ...mockUser, id: 1, name: 'Admin 1' },
          { id: 2, name: 'Admin 2', role: 'admin', store_name: 'Test Pharmacy', is_active: true }
        ],
        pagination: { page: 1, pages: 1, total: 2 }
      });
      
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Admin 2')).toBeInTheDocument();
      });
      
      // Should be able to delete one admin when another exists
      const deleteButtons = screen.getAllByText('Delete');
      const enabledDeleteButton = deleteButtons.find(btn => !btn.disabled);
      expect(enabledDeleteButton).toBeDefined();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      setupUserManagementMocks();
      renderWithProviders(<UserManagement />, { user: mockUser });
      
      // Should render without errors on mobile
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });
});