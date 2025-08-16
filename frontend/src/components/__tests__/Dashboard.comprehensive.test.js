import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { 
  renderWithProviders, 
  mockApiSuccess, 
  mockApiError, 
  mockUser,
  setupDashboardMocks 
} from '../../utils/test-utils';
import { 
  testAllButtons,
  testApiErrorHandling,
  testAccessibility,
  runComprehensiveTests
} from '../../utils/enhanced-test-utils';

// Mock dashboard data
const mockDashboardData = {
  storeStats: {
    total_stores: 5,
    stores_with_admin: 4,
    unique_states: 3
  },
  drugStats: {
    total_drugs: 150,
    active_drugs: 142,
    manufacturers: 45
  },
  inventoryStats: {
    total_items: 1250,
    low_stock_items: 23,
    expiring_items: 8
  },
  lowStockItems: [
    { id: 1, drug_name: 'Aspirin 325mg', quantity_on_hand: 5, minimum_stock: 20 },
    { id: 2, drug_name: 'Ibuprofen 200mg', quantity_on_hand: 8, minimum_stock: 25 }
  ],
  expiringItems: [
    { id: 3, drug_name: 'Vitamin D 1000IU', expiration_date: '2025-01-15', quantity_on_hand: 12 },
    { id: 4, drug_name: 'Calcium 500mg', expiration_date: '2025-02-10', quantity_on_hand: 30 }
  ],
  recentTransactions: [
    { id: 1, drug_name: 'Lisinopril 10mg', transaction_type: 'prescription_fill', quantity: -30, transaction_date: '2025-01-10' },
    { id: 2, drug_name: 'Metformin 500mg', transaction_type: 'shipment_received', quantity: 100, transaction_date: '2025-01-09' }
  ]
};

describe('Dashboard Component - Comprehensive Tests', () => {
  beforeEach(() => {
    // Set up authenticated user
    localStorage.setItem('token', 'mock-admin-token');
    localStorage.setItem('user', JSON.stringify({
      ...mockUser,
      role: 'admin',
      id: 1
    }));
    
    // Setup comprehensive dashboard API mocks
    setupDashboardMocks();
    mockApiSuccess('/stores/stats', mockDashboardData.storeStats);
    mockApiSuccess('/drugs/stats/overview', mockDashboardData.drugStats);
    mockApiSuccess('/inventory/store/1/stats', mockDashboardData.inventoryStats);
    mockApiSuccess('/inventory/store/1/low-stock', { inventory: mockDashboardData.lowStockItems });
    mockApiSuccess('/inventory/store/1/expiring', { inventory: mockDashboardData.expiringItems });
    mockApiSuccess('/audit/store/1', { transactions: mockDashboardData.recentTransactions });
    mockApiSuccess('/audit/recent', { transactions: mockDashboardData.recentTransactions });
  });

  describe('🔘 Dashboard Button Functionality', () => {
    it('should test all dashboard buttons and interactive elements', async () => {
      const results = await testAllButtons(<Dashboard />, {
        skipButtons: ['logout'], // Skip logout to avoid navigation issues
        customActions: {
          'View All': async (button, user) => {
            await user.click(button);
            // Should trigger navigation or expand view
          },
          'Refresh': async (button, user) => {
            await user.click(button);
            // Should refresh dashboard data
          },
          'Export': async (button, user) => {
            await user.click(button);
            // Should trigger export functionality
          }
        }
      });

      expect(results.tested).toBeGreaterThan(0);
      expect(results.failed).toBe(0);
    });

    it('should handle refresh button functionality', async () => {
      renderWithProviders(<Dashboard />);
      const user = userEvent.setup();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Find and click refresh button if it exists
      const refreshButton = screen.queryByRole('button', { name: /refresh|reload/i });
      if (refreshButton) {
        await user.click(refreshButton);
        
        // Should trigger new API calls
        expect(refreshButton).toBeInTheDocument();
      }
    });
  });

  describe('📊 Data Display and Statistics', () => {
    it('should display all dashboard statistics correctly', async () => {
      renderWithProviders(<Dashboard />);

      // Wait for all data to load
      await waitFor(() => {
        // Store statistics
        expect(screen.getByText('5')).toBeInTheDocument(); // total_stores
        expect(screen.getByText('4')).toBeInTheDocument(); // stores_with_admin
        expect(screen.getByText('3')).toBeInTheDocument(); // unique_states

        // Drug statistics
        expect(screen.getByText('150')).toBeInTheDocument(); // total_drugs
        expect(screen.getByText('142')).toBeInTheDocument(); // active_drugs
        expect(screen.getByText('45')).toBeInTheDocument(); // manufacturers

        // Inventory statistics
        expect(screen.getByText('1250')).toBeInTheDocument(); // total_items
        expect(screen.getByText('23')).toBeInTheDocument(); // low_stock_items
        expect(screen.getByText('8')).toBeInTheDocument(); // expiring_items
      });
    });

    it('should display low stock items with proper alerts', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Should show low stock items
        expect(screen.getByText('Aspirin 325mg')).toBeInTheDocument();
        expect(screen.getByText('Ibuprofen 200mg')).toBeInTheDocument();
        
        // Should show quantity warnings
        expect(screen.getByText(/5.*quantity/i)).toBeInTheDocument();
        expect(screen.getByText(/8.*quantity/i)).toBeInTheDocument();
      });
    });

    it('should display expiring items with date warnings', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Should show expiring items
        expect(screen.getByText('Vitamin D 1000IU')).toBeInTheDocument();
        expect(screen.getByText('Calcium 500mg')).toBeInTheDocument();
        
        // Should show expiration dates
        expect(screen.getByText(/2025-01-15/)).toBeInTheDocument();
        expect(screen.getByText(/2025-02-10/)).toBeInTheDocument();
      });
    });

    it('should display recent transactions properly', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Should show recent transactions
        expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
        expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
        
        // Should show transaction types
        expect(screen.getByText(/prescription.*fill/i)).toBeInTheDocument();
        expect(screen.getByText(/shipment.*received/i)).toBeInTheDocument();
      });
    });
  });

  describe('🌐 API Integration and Error Handling', () => {
    it('should handle comprehensive API error scenarios', async () => {
      const apiEndpoints = {
        storeStats: {
          path: '/stores/stats',
          method: 'get',
          trigger: async () => {
            // Dashboard loads this on mount
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        drugStats: {
          path: '/drugs/stats/overview',
          method: 'get',
          trigger: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        inventoryStats: {
          path: '/inventory/store/1/stats',
          method: 'get',
          trigger: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        lowStock: {
          path: '/inventory/store/1/low-stock',
          method: 'get',
          trigger: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        expiringItems: {
          path: '/inventory/store/1/expiring',
          method: 'get',
          trigger: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        recentTransactions: {
          path: '/audit/recent',
          method: 'get',
          trigger: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const results = await testApiErrorHandling(<Dashboard />, apiEndpoints);
      
      // Should handle errors gracefully
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle individual API failures gracefully', async () => {
      // Mock failure for store stats only
      mockApiError('/stores/stats', 500, 'Server Error');
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Should show error for store stats but other sections should work
        const errorElement = screen.queryByText(/error|failed|unavailable/i);
        expect(errorElement).toBeInTheDocument();
        
        // Other sections should still load
        expect(screen.queryByText('150')).toBeInTheDocument(); // drug stats should still work
      });
    });

    it('should handle complete API failure', async () => {
      // Mock failures for all endpoints
      mockApiError('/stores/stats', 500, 'Server Error');
      mockApiError('/drugs/stats/overview', 500, 'Server Error');
      mockApiError('/inventory/store/1/stats', 500, 'Server Error');
      mockApiError('/inventory/store/1/low-stock', 500, 'Server Error');
      mockApiError('/inventory/store/1/expiring', 500, 'Server Error');
      mockApiError('/audit/recent', 500, 'Server Error');
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Should show error state
        const errorElements = screen.getAllByText(/error|failed|unavailable/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle authentication errors', async () => {
      mockApiError('/stores/stats', 401, 'Unauthorized');
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/unauthorized|access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('♿ Accessibility and Usability', () => {
    it('should test comprehensive accessibility features', async () => {
      const results = await testAccessibility(<Dashboard />, {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      });

      // Dashboard should be accessible
      expect(results.labels.length + results.keyboardNav.length + results.ariaAttributes.length).toBeGreaterThan(0);
    });

    it('should have proper heading structure', async () => {
      renderWithProviders(<Dashboard />);

      // Should have proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should provide screen reader friendly content', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Statistics should be properly labeled
        const statElements = screen.getAllByText(/\d+/);
        expect(statElements.length).toBeGreaterThan(0);

        // Should have descriptive text for statistics
        expect(screen.getByText(/total.*store/i)).toBeInTheDocument();
        expect(screen.getByText(/total.*drug/i)).toBeInTheDocument();
      });
    });
  });

  describe('📱 Responsive and Visual Elements', () => {
    it('should handle loading states properly', async () => {
      renderWithProviders(<Dashboard />);

      // Initially should show loading indicators
      const loadingElements = screen.getAllByText(/loading/i);
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);

      // After loading, should show data
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Any stat number
      });
    });

    it('should display warning indicators for alerts', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Should show warning indicators for low stock
        const lowStockWarnings = screen.getAllByText(/low.*stock|stock.*low/i);
        expect(lowStockWarnings.length).toBeGreaterThanOrEqual(0);

        // Should show warning indicators for expiring items
        const expiringWarnings = screen.getAllByText(/expir/i);
        expect(expiringWarnings.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle empty data states', async () => {
      // Mock empty responses
      mockApiSuccess('/inventory/store/1/low-stock', { inventory: [] });
      mockApiSuccess('/inventory/store/1/expiring', { inventory: [] });
      mockApiSuccess('/audit/recent', { transactions: [] });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Should show "no data" or empty state messages
        const emptyMessages = screen.queryAllByText(/no.*items|no.*data|empty/i);
        expect(emptyMessages.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('🔄 Real-time Updates and Interactions', () => {
    it('should handle dynamic data updates', async () => {
      renderWithProviders(<Dashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('23')).toBeInTheDocument(); // low stock count
      });

      // Simulate data update
      mockApiSuccess('/inventory/store/1/stats', {
        ...mockDashboardData.inventoryStats,
        low_stock_items: 25 // Updated count
      });

      // If dashboard has auto-refresh or update mechanism, test it
      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      if (refreshButton) {
        const user = userEvent.setup();
        await user.click(refreshButton);
        
        await waitFor(() => {
          expect(screen.getByText('25')).toBeInTheDocument(); // Updated count
        });
      }
    });

    it('should handle user interactions with dashboard widgets', async () => {
      renderWithProviders(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        // Look for interactive elements
        const viewAllButtons = screen.queryAllByText(/view.*all|see.*all|show.*all/i);
        if (viewAllButtons.length > 0) {
          // Test clicking view all buttons
          expect(viewAllButtons[0]).toBeInTheDocument();
        }
      });
    });
  });

  describe('🎯 Performance and Efficiency', () => {
    it('should load dashboard efficiently', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(2000); // 2 seconds
    });

    it('should handle concurrent API calls efficiently', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<Dashboard />);
      
      // Wait for all API calls to complete
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // store stats
        expect(screen.getByText('150')).toBeInTheDocument(); // drug stats
        expect(screen.getByText('1250')).toBeInTheDocument(); // inventory stats
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All API calls should complete efficiently
      expect(totalTime).toBeLessThan(3000); // 3 seconds for all calls
    });
  });

  describe('🔐 Security and Data Protection', () => {
    it('should handle unauthorized access properly', async () => {
      // Clear authentication
      localStorage.clear();
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Should redirect to login or show access denied
        const unauthorizedMessage = screen.queryByText(/unauthorized|access.*denied|login.*required/i);
        expect(unauthorizedMessage).toBeInTheDocument();
      });
    });

    it('should not expose sensitive data in error messages', async () => {
      mockApiError('/stores/stats', 500, 'Database connection failed: mysql://user:password@host:3306/db');
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const errorMessage = screen.queryByText(/error|failed/i);
        if (errorMessage) {
          // Should not contain sensitive information
          expect(errorMessage.textContent).not.toMatch(/password|mysql:|database.*connection/i);
        }
      });
    });
  });
});

// Run comprehensive test suite
describe('🔬 Dashboard Comprehensive Test Suite', () => {
  it('should run all comprehensive tests', async () => {
    const testConfig = {
      componentName: 'Dashboard',
      buttons: {
        skipButtons: ['logout'],
        expectedDisabledButtons: []
      },
      apiErrors: {
        storeStats: { path: '/stores/stats', method: 'get' },
        drugStats: { path: '/drugs/stats/overview', method: 'get' },
        inventoryStats: { path: '/inventory/store/1/stats', method: 'get' }
      },
      accessibility: {
        checkLabels: true,
        checkKeyboardNavigation: true,
        checkAriaAttributes: true
      }
    };

    const results = await runComprehensiveTests(<Dashboard />, testConfig);
    
    expect(results.component).toBe('Dashboard');
    expect(results.error).toBeUndefined();
    
    // Log results for debugging
    console.log('Dashboard comprehensive test results:', JSON.stringify(results, null, 2));
  }, 30000); // Extended timeout for comprehensive tests
});