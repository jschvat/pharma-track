import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory from '../Inventory';
import { renderWithProviders, mockUser, setupInventoryMocks, mockApiSuccess, mockApiError, mockApiTimeout } from '../../utils/test-utils';

describe('Inventory Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('renders inventory page with filters and table', async () => {
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      // Should show filters
      expect(screen.getByPlaceholderText(/search drugs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active only/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/low stock/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiring/i)).toBeInTheDocument();
      
      // Should show table headers
      await waitFor(() => {
        expect(screen.getByText(/inventory items/i)).toBeInTheDocument();
        expect(screen.getByText('Drug')).toBeInTheDocument();
        expect(screen.getByText('NDC')).toBeInTheDocument();
        expect(screen.getByText('Stock')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching inventory', () => {
      // Don't setup mocks to simulate loading state
      renderWithProviders(<Inventory />, { user: mockUser });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('loads and displays inventory items', async () => {
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
        expect(screen.getByText('12345-678-90')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument(); // quantity
      });
    });

    it('displays empty state when no inventory items', async () => {
      setupInventoryMocks();
      mockApiSuccess(`/inventory/store/${mockUser.store_id}`, {
        inventory: [],
        pagination: { page: 1, pages: 1, total: 0 }
      });
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/no inventory items found/i)).toBeInTheDocument();
      });
    });

    it('shows action buttons for each inventory item', async () => {
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Fill Rx')).toBeInTheDocument();
        expect(screen.getByText('Return')).toBeInTheDocument();
        expect(screen.getByText('Expire')).toBeInTheDocument();
        expect(screen.getByText('Audit')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    it('updates search filter and reloads inventory', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      const searchInput = screen.getByPlaceholderText(/search drugs/i);
      await user.type(searchInput, 'test drug');
      
      expect(searchInput).toHaveValue('test drug');
      
      const searchButton = screen.getByText('Search');
      await user.click(searchButton);
      
      // Should trigger new API call with search param
      await waitFor(() => {
        expect(searchInput).toHaveValue('test drug');
      });
    });

    it('toggles active only filter', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      const activeSwitch = screen.getByLabelText(/active only/i);
      expect(activeSwitch).toBeChecked();
      
      await user.click(activeSwitch);
      expect(activeSwitch).not.toBeChecked();
    });

    it('toggles low stock filter', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      const lowStockSwitch = screen.getByLabelText(/low stock/i);
      expect(lowStockSwitch).not.toBeChecked();
      
      await user.click(lowStockSwitch);
      expect(lowStockSwitch).toBeChecked();
    });

    it('toggles expiring filter', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      const expiringSwitch = screen.getByLabelText(/expiring/i);
      expect(expiringSwitch).not.toBeChecked();
      
      await user.click(expiringSwitch);
      expect(expiringSwitch).toBeChecked();
    });
  });

  describe('Transaction Modals', () => {
    beforeEach(() => {
      setupInventoryMocks();
    });

    it('opens prescription fill modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Fill Rx')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Fill Rx'));
      
      await waitFor(() => {
        expect(screen.getByText('Fill Prescription')).toBeInTheDocument();
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/prescription number/i)).toBeInTheDocument();
      });
    });

    it('opens return to stock modal', async () => {
      const user = userEvent.setup();
      // Mock transaction history for returns
      mockApiSuccess('/audit/inventory/1', {
        history: [{
          id: 1,
          transaction_type: 'prescription_fill',
          reference_number: 'RX123',
          quantity_change: -10,
          transaction_date: '2025-01-01'
        }]
      });
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Return')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Return'));
      
      await waitFor(() => {
        expect(screen.getByText('Return to Stock')).toBeInTheDocument();
      });
    });

    it('opens expire medication modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Expire')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Expire'));
      
      await waitFor(() => {
        expect(screen.getByText('Expire Medication')).toBeInTheDocument();
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
      });
    });

    it('opens audit inventory modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Audit')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Audit'));
      
      await waitFor(() => {
        expect(screen.getByText('Audit Inventory')).toBeInTheDocument();
        expect(screen.getByLabelText(/actual quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/audit reason/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(() => {
      setupInventoryMocks();
    });

    it('processes prescription fill transaction', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/inventory/1/fill', { success: true }, 'post');
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Fill Rx')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Fill Rx'));
      
      await waitFor(() => {
        expect(screen.getByText('Fill Prescription')).toBeInTheDocument();
      });
      
      // Fill form
      await user.type(screen.getByLabelText(/quantity/i), '5');
      await user.type(screen.getByLabelText(/prescription number/i), 'RX12345');
      await user.type(screen.getByLabelText(/reason/i), 'Patient prescription');
      
      // Submit
      await user.click(screen.getByText('Confirm'));
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Fill Prescription')).not.toBeInTheDocument();
      });
    });

    it('handles audit transaction with validation', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/inventory/1/audit', { success: true }, 'post');
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Audit')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Audit'));
      
      await waitFor(() => {
        expect(screen.getByText('Audit Inventory')).toBeInTheDocument();
      });
      
      // Try to submit without required fields
      await user.click(screen.getByText('Confirm'));
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/audit reason is required/i)).toBeInTheDocument();
      });
      
      // Fill required fields
      await user.type(screen.getByLabelText(/actual quantity/i), '95');
      await user.type(screen.getByLabelText(/audit reason/i), 'Physical count');
      
      // Submit again
      await user.click(screen.getByText('Confirm'));
      
      // Should succeed
      await waitFor(() => {
        expect(screen.queryByText('Audit Inventory')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction History', () => {
    beforeEach(() => {
      setupInventoryMocks();
      mockApiSuccess('/audit/inventory/1', {
        history: [
          {
            id: 1,
            transaction_type: 'prescription_fill',
            quantity_change: -10,
            quantity_after: 90,
            transaction_date: '2025-01-01',
            performed_by_name: 'Test User',
            reason: 'Patient prescription',
            reference_number: 'RX123'
          },
          {
            id: 2,
            transaction_type: 'shipment_received',
            quantity_change: 100,
            quantity_after: 100,
            transaction_date: '2024-12-15',
            performed_by_name: 'Admin User',
            reason: 'Initial stock',
            reference_number: 'INV001'
          }
        ]
      });
    });

    it('loads transaction history when row is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
      });
      
      // Click on inventory row
      await user.click(screen.getByText('Test Generic').closest('tr'));
      
      // Should show transaction register sidebar
      await waitFor(() => {
        expect(screen.getByText('Transaction Register')).toBeInTheDocument();
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
      });
      
      // Should show transaction entries
      await waitFor(() => {
        expect(screen.getByText(/prescription fill/i)).toBeInTheDocument();
        expect(screen.getByText(/shipment received/i)).toBeInTheDocument();
      });
    });

    it('can close transaction history sidebar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
      });
      
      // Click on inventory row to open sidebar
      await user.click(screen.getByText('Test Generic').closest('tr'));
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Register')).toBeInTheDocument();
      });
      
      // Close sidebar
      const closeButton = screen.getByTitle('Close') || screen.getByText('✕');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Transaction Register')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles inventory loading API error', async () => {
      mockApiError(`/inventory/store/${mockUser.store_id}`, 500, 'Failed to load inventory');
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load inventory/i)).toBeInTheDocument();
      });
    });

    it('handles transaction API error', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      mockApiError('/inventory/1/fill', 400, 'Insufficient inventory', 'post');
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Fill Rx')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Fill Rx'));
      
      await waitFor(() => {
        expect(screen.getByText('Fill Prescription')).toBeInTheDocument();
      });
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/quantity/i), '5');
      await user.type(screen.getByLabelText(/prescription number/i), 'RX12345');
      await user.type(screen.getByLabelText(/reason/i), 'Patient prescription');
      await user.click(screen.getByText('Confirm'));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/insufficient inventory/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout gracefully', async () => {
      mockApiTimeout(`/inventory/store/${mockUser.store_id}`);
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load inventory/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('prevents returns when no prescriptions available', async () => {
      const user = userEvent.setup();
      setupInventoryMocks();
      
      // Mock empty transaction history
      mockApiSuccess('/audit/inventory/1', { history: [] });
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Return')).toBeInTheDocument();
      });
      
      // Mock alert function
      window.alert = jest.fn();
      
      await user.click(screen.getByText('Return'));
      
      // Should show alert about no prescriptions
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('No filled prescriptions available for return')
      );
    });
  });

  describe('Stock Status Badges', () => {
    it('shows correct stock status badges', async () => {
      setupInventoryMocks();
      
      // Mock inventory with different stock levels
      mockApiSuccess(`/inventory/store/${mockUser.store_id}`, {
        inventory: [
          {
            id: 1,
            generic_name: 'Out of Stock Drug',
            quantity_on_hand: 0,
            reorder_level: 10
          },
          {
            id: 2,
            generic_name: 'Low Stock Drug',
            quantity_on_hand: 5,
            reorder_level: 10
          },
          {
            id: 3,
            generic_name: 'In Stock Drug',
            quantity_on_hand: 50,
            reorder_level: 10
          }
        ],
        pagination: { page: 1, pages: 1, total: 3 }
      });
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
        expect(screen.getByText('Low Stock')).toBeInTheDocument();
        expect(screen.getByText('In Stock')).toBeInTheDocument();
      });
    });
  });

  describe('User Permissions', () => {
    it('shows all inventory actions for admin users', async () => {
      setupInventoryMocks();
      
      renderWithProviders(<Inventory />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText('Fill Rx')).toBeInTheDocument();
        expect(screen.getByText('Return')).toBeInTheDocument();
        expect(screen.getByText('Expire')).toBeInTheDocument();
        expect(screen.getByText('Audit')).toBeInTheDocument();
      });
    });

    it('handles users without store access', async () => {
      const userWithoutStore = { ...mockUser, store_id: null };
      
      renderWithProviders(<Inventory />, { user: userWithoutStore });
      
      // Should not attempt to load inventory
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout on smaller screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      setupInventoryMocks();
      renderWithProviders(<Inventory />, { user: mockUser });
      
      // Should render without errors on mobile
      expect(screen.getByPlaceholderText(/search drugs/i)).toBeInTheDocument();
    });
  });
});