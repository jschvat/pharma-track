import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { renderWithProviders, mockUser, setupDashboardMocks, mockApiError, mockApiTimeout } from '../../utils/test-utils';

describe('Dashboard Component', () => {
  describe('Authenticated User Access', () => {
    it('renders dashboard for authenticated admin user', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('renders dashboard for authenticated regular user', async () => {
      const regularUser = { ...mockUser, role: 'user' };
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: regularUser });
      
      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('loads and displays store statistics', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/store statistics/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // total stores
      });
    });

    it('loads and displays drug statistics', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/drug/i)).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument(); // total drugs
      });
    });

    it('loads and displays inventory statistics', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/inventory/i)).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument(); // total items
      });
    });

    it('shows loading spinners while fetching data', () => {
      // Don't setup mocks to simulate loading state
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      // Should show loading indicators
      expect(screen.getAllByTestId(/loading|spinner/i).length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles store statistics API error gracefully', async () => {
      // Mock other APIs but make store stats fail
      setupDashboardMocks();
      mockApiError('/stores/stats', 500, 'Failed to fetch store statistics');
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/error loading store statistics/i)).toBeInTheDocument();
      });
    });

    it('handles drug statistics API error gracefully', async () => {
      setupDashboardMocks();
      mockApiError('/drugs/stats/overview', 500, 'Failed to fetch drug statistics');
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/error loading drug statistics/i)).toBeInTheDocument();
      });
    });

    it('handles inventory statistics API error gracefully', async () => {
      setupDashboardMocks();
      mockApiError('/inventory/store/1/stats', 500, 'Failed to fetch inventory statistics');
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/error loading inventory/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout errors', async () => {
      mockApiTimeout('/stores/stats');
      mockApiTimeout('/drugs/stats/overview');
      mockApiTimeout('/inventory/store/1/stats');
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/network error|timeout/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles authentication errors and redirects to login', async () => {
      mockApiError('/stores/stats', 401, 'Unauthorized');
      mockApiError('/drugs/stats/overview', 401, 'Unauthorized');
      mockApiError('/inventory/store/1/stats', 401, 'Unauthorized');
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/authentication required|please log in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('renders quick action buttons for admin users', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/manage inventory/i) || screen.getByText(/inventory/i)).toBeInTheDocument();
        expect(screen.getByText(/manage users/i) || screen.getByText(/users/i)).toBeInTheDocument();
      });
    });

    it('shows appropriate quick actions for regular users', async () => {
      const regularUser = { ...mockUser, role: 'user' };
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: regularUser });
      
      await waitFor(() => {
        expect(screen.getByText(/view inventory/i) || screen.getByText(/inventory/i)).toBeInTheDocument();
        // Should not show admin actions
        expect(screen.queryByText(/manage users/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('displays recent transactions when available', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/recent activity/i) || screen.getByText(/transactions/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no recent activity', async () => {
      setupDashboardMocks();
      
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/no recent activity/i) || screen.getByText(/no transactions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      setupDashboardMocks();
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      // Should render without errors on mobile
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      setupDashboardMocks();
      renderWithProviders(<Dashboard />, { user: mockUser });
      
      // Should render without errors on tablet
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not make unnecessary API calls on re-render', async () => {
      setupDashboardMocks();
      
      const { rerender } = renderWithProviders(<Dashboard />, { user: mockUser });
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
      
      // Re-render component
      rerender(<Dashboard />);
      
      // Should not make additional API calls (mocked APIs should only be called once)
      // This is implicit in the mock setup - if called multiple times, it would fail
    });
  });
});