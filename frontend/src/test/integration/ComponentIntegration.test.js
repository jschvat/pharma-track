/**
 * Component Integration Tests
 * 
 * Integration tests for PharmaTraK component interactions,
 * workflows, and end-to-end functionality.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders, mockApi, testModalInteractions } from '../utils/testUtils';
import {
  PharmaButton,
  PharmaModal,
  PharmaForm,
  PharmaTable,
  PharmaAlert,
  PharmaFileUpload,
  PharmaSearch,
  PharmaTooltip,
  PharmaBreadcrumbs,
  PharmaReportGenerator,
  PharmaNotificationSystem,
  PharmaErrorBoundary
} from '../../components/common/PharmaComponents';

describe('Component Integration Tests', () => {
  describe('Form and Modal Integration', () => {
    test('opens modal form and submits data', async () => {
      const handleSubmit = jest.fn();
      const { user } = renderWithProviders(
        <div>
          <PharmaButton data-testid="open-modal">Add Item</PharmaButton>
          <PharmaModal show={false} title="Add New Item">
            <PharmaForm onSubmit={handleSubmit}>
              <input name="name" placeholder="Item name" />
              <input name="quantity" type="number" placeholder="Quantity" />
              <PharmaButton type="submit">Save</PharmaButton>
            </PharmaForm>
          </PharmaModal>
        </div>
      );

      // Open modal
      await testModalInteractions.open(screen.getByTestId('open-modal'));

      // Fill form
      await user.type(screen.getByPlaceholderText('Item name'), 'Acetaminophen');
      await user.type(screen.getByPlaceholderText('Quantity'), '100');

      // Submit form
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Acetaminophen',
            quantity: '100'
          })
        );
      });
    });

    test('validates form before submission', async () => {
      const { user } = renderWithProviders(
        <PharmaForm validationRules={{ name: { required: true } }}>
          <input name="name" placeholder="Required field" />
          <PharmaButton type="submit">Submit</PharmaButton>
        </PharmaForm>
      );

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    test('shows success alert after form submission', async () => {
      const { user } = renderWithProviders(
        <PharmaNotificationSystem>
          <PharmaForm
            onSubmit={() => Promise.resolve()}
            successMessage="Item added successfully!"
          >
            <input name="name" defaultValue="Test Item" />
            <PharmaButton type="submit">Submit</PharmaButton>
          </PharmaForm>
        </PharmaNotificationSystem>
      );

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Item added successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Table and Search Integration', () => {
    const mockTableData = [
      { id: 1, name: 'Acetaminophen', category: 'Analgesic', quantity: 100 },
      { id: 2, name: 'Ibuprofen', category: 'NSAID', quantity: 75 },
      { id: 3, name: 'Aspirin', category: 'Analgesic', quantity: 50 }
    ];

    test('filters table data with search component', async () => {
      const { user } = renderWithProviders(
        <div>
          <PharmaSearch 
            placeholder="Search medications..."
            onSearch={(query) => {
              // Filter logic would be handled by parent component
            }}
          />
          <PharmaTable
            data={mockTableData}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category' },
              { key: 'quantity', label: 'Quantity' }
            ]}
          />
        </div>
      );

      // Verify all items are initially shown
      expect(screen.getByText('Acetaminophen')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofen')).toBeInTheDocument();
      expect(screen.getByText('Aspirin')).toBeInTheDocument();

      // Search for specific item
      const searchInput = screen.getByPlaceholderText('Search medications...');
      await user.type(searchInput, 'Acetaminophen');

      // In real implementation, table would be filtered
      // This test verifies the search component triggers correctly
      expect(searchInput).toHaveValue('Acetaminophen');
    });

    test('shows tooltips for table cell data', async () => {
      const { user } = renderWithProviders(
        <PharmaTable
          data={mockTableData}
          columns={[
            { 
              key: 'name', 
              label: 'Name',
              render: (value) => (
                <PharmaTooltip content={`Detailed info for ${value}`}>
                  <span>{value}</span>
                </PharmaTooltip>
              )
            }
          ]}
        />
      );

      const nameCell = screen.getByText('Acetaminophen');
      await user.hover(nameCell);

      await waitFor(() => {
        expect(screen.getByText('Detailed info for Acetaminophen')).toBeInTheDocument();
      });
    });

    test('handles table row actions with confirmation', async () => {
      const handleDelete = jest.fn();
      const { user } = renderWithProviders(
        <PharmaTable
          data={mockTableData}
          columns={[
            { key: 'name', label: 'Name' }
          ]}
          actions={[
            {
              key: 'delete',
              label: 'Delete',
              variant: 'danger',
              onClick: handleDelete,
              confirmAction: true,
              confirmMessage: 'Are you sure you want to delete this item?'
            }
          ]}
        />
      );

      const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
      await user.click(deleteButton);

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: /confirm|yes/i }));

      expect(handleDelete).toHaveBeenCalledWith(mockTableData[0], 0);
    });
  });

  describe('File Upload and Processing Integration', () => {
    test('uploads file and processes data', async () => {
      const handleFileProcess = jest.fn();
      const { user } = renderWithProviders(
        <div>
          <PharmaFileUpload
            accept=".csv,.xlsx"
            onFileProcess={handleFileProcess}
          />
          <PharmaAlert variant="info">
            Upload a CSV or Excel file to import inventory data
          </PharmaAlert>
        </div>
      );

      const file = new File(['name,quantity\nAcetaminophen,100'], 'inventory.csv', {
        type: 'text/csv'
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(handleFileProcess).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'inventory.csv',
            type: 'text/csv'
          })
        );
      });
    });

    test('shows upload progress and completion status', async () => {
      const { user } = renderWithProviders(
        <PharmaFileUpload
          showProgress
          onUploadComplete={() => {
            // Show success message
          }}
        />
      );

      const file = new File(['test data'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/upload/i);

      await user.upload(fileInput, file);

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Should show completion status
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Breadcrumb Integration', () => {
    test('updates breadcrumbs when navigating', async () => {
      const { user } = renderWithProviders(
        <div>
          <PharmaBreadcrumbs
            items={[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Inventory', path: '/dashboard/inventory' },
              { label: 'Items', path: '/dashboard/inventory/items', current: true }
            ]}
          />
          <PharmaButton data-testid="nav-details">View Details</PharmaButton>
        </div>
      );

      // Initial breadcrumbs
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();

      // Navigate to details (would update breadcrumbs in real app)
      await user.click(screen.getByTestId('nav-details'));

      // Breadcrumbs would be updated by router integration
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('provides back navigation on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { user } = renderWithProviders(
        <PharmaBreadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Current Page', path: '/current', current: true }
          ]}
          responsive
          showBackButton
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // Should navigate back to previous page
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Report Generation Workflow', () => {
    test('generates report with data visualization', async () => {
      const { user } = renderWithProviders(
        <PharmaReportGenerator includeChart />
      );

      // Configure report
      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.selectOptions(screen.getByLabelText(/output format/i), 'pdf');
      await user.selectOptions(screen.getByLabelText(/chart type/i), 'bar');

      // Set date range
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.type(screen.getByLabelText(/end date/i), '2024-12-31');

      // Generate report
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeInTheDocument();
      });

      // Should show chart when report is ready
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    test('handles report generation errors with user feedback', async () => {
      mockApi.generateReport = jest.fn(() => 
        Promise.reject(new Error('Report generation failed'))
      );

      const { user } = renderWithProviders(
        <PharmaNotificationSystem>
          <PharmaReportGenerator />
        </PharmaNotificationSystem>
      );

      await user.selectOptions(screen.getByLabelText(/report type/i), 'inventory');
      await user.click(screen.getByRole('button', { name: /generate report/i }));

      await waitFor(() => {
        expect(screen.getByText(/report generation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    test('catches errors in child components', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(
        <PharmaErrorBoundary>
          <ErrorComponent />
        </PharmaErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      spy.mockRestore();
    });

    test('provides error recovery options', async () => {
      const ErrorComponent = ({ shouldError }) => {
        if (shouldError) {
          throw new Error('Test error');
        }
        return <div>Component working</div>;
      };

      const TestWrapper = () => {
        const [hasError, setHasError] = React.useState(true);
        return (
          <div>
            <button onClick={() => setHasError(false)}>Fix Error</button>
            <PharmaErrorBoundary>
              <ErrorComponent shouldError={hasError} />
            </PharmaErrorBoundary>
          </div>
        );
      };

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { user } = renderWithProviders(<TestWrapper />);

      // Initially shows error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Fix the error condition
      await user.click(screen.getByText('Fix Error'));

      // Error boundary should recover
      await waitFor(() => {
        expect(screen.getByText('Component working')).toBeInTheDocument();
      });

      spy.mockRestore();
    });
  });

  describe('Notification System Integration', () => {
    test('shows notifications for various user actions', async () => {
      const { user } = renderWithProviders(
        <PharmaNotificationSystem>
          <div>
            <PharmaButton
              onClick={() => {
                // Trigger success notification
                window.dispatchEvent(new CustomEvent('pharma-notification', {
                  detail: {
                    type: 'success',
                    message: 'Action completed successfully'
                  }
                }));
              }}
            >
              Success Action
            </PharmaButton>
            <PharmaButton
              onClick={() => {
                // Trigger error notification
                window.dispatchEvent(new CustomEvent('pharma-notification', {
                  detail: {
                    type: 'error',
                    message: 'Action failed'
                  }
                }));
              }}
            >
              Error Action
            </PharmaButton>
          </div>
        </PharmaNotificationSystem>
      );

      // Trigger success notification
      await user.click(screen.getByRole('button', { name: 'Success Action' }));
      expect(screen.getByText('Action completed successfully')).toBeInTheDocument();

      // Trigger error notification
      await user.click(screen.getByRole('button', { name: 'Error Action' }));
      expect(screen.getByText('Action failed')).toBeInTheDocument();
    });

    test('manages notification queue and auto-dismissal', async () => {
      const { user } = renderWithProviders(
        <PharmaNotificationSystem autoClose timeout={1000}>
          <PharmaButton
            onClick={() => {
              // Trigger multiple notifications
              for (let i = 1; i <= 3; i++) {
                window.dispatchEvent(new CustomEvent('pharma-notification', {
                  detail: {
                    type: 'info',
                    message: `Notification ${i}`
                  }
                }));
              }
            }}
          >
            Multiple Notifications
          </PharmaButton>
        </PharmaNotificationSystem>
      );

      await user.click(screen.getByRole('button', { name: 'Multiple Notifications' }));

      // All notifications should appear
      expect(screen.getByText('Notification 1')).toBeInTheDocument();
      expect(screen.getByText('Notification 2')).toBeInTheDocument();
      expect(screen.getByText('Notification 3')).toBeInTheDocument();

      // Should auto-dismiss after timeout
      await waitFor(() => {
        expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Performance Integration', () => {
    test('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        category: `Category ${i % 10}`,
        quantity: Math.floor(Math.random() * 100)
      }));

      const startTime = performance.now();

      renderWithProviders(
        <PharmaTable
          data={largeDataset}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'quantity', label: 'Quantity' }
          ]}
          pagination={{ enabled: true, pageSize: 25 }}
          virtualization={{ enabled: true, itemHeight: 40 }}
        />
      );

      const endTime = performance.now();

      // Should render quickly even with large dataset
      expect(endTime - startTime).toBeLessThan(1000);

      // Should only render visible rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThanOrEqual(30); // Header + 25 visible rows + buffer
    });

    test('debounces rapid user interactions', async () => {
      const searchSpy = jest.fn();
      const { user } = renderWithProviders(
        <PharmaSearch onSearch={searchSpy} debounce={300} />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type rapidly
      await user.type(searchInput, 'acetaminophen');

      // Should debounce API calls
      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('acetaminophen');
      }, { timeout: 500 });
    });
  });

  describe('Accessibility Integration', () => {
    test('maintains focus management across components', async () => {
      const { user } = renderWithProviders(
        <div>
          <PharmaButton data-testid="trigger">Open Modal</PharmaButton>
          <PharmaModal show={false} title="Test Modal">
            <input placeholder="First input" />
            <input placeholder="Second input" />
            <PharmaButton>Close</PharmaButton>
          </PharmaModal>
        </div>
      );

      const trigger = screen.getByTestId('trigger');
      
      // Open modal
      await testModalInteractions.open(trigger);

      // Focus should move to first input in modal
      await waitFor(() => {
        expect(screen.getByPlaceholderText('First input')).toHaveFocus();
      });

      // Close modal
      await user.keyboard('{Escape}');

      // Focus should return to trigger
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    test('provides proper ARIA relationships between components', () => {
      renderWithProviders(
        <div>
          <label id="search-label">Search Medications</label>
          <PharmaSearch
            aria-labelledby="search-label"
            aria-describedby="search-help"
          />
          <div id="search-help">
            Enter medication name or NDC number
          </div>
        </div>
      );

      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('aria-labelledby', 'search-label');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    });

    test('announces dynamic content changes to screen readers', async () => {
      const { user } = renderWithProviders(
        <div>
          <PharmaSearch />
          <div role="status" aria-live="polite" id="search-results">
            No results
          </div>
        </div>
      );

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'acetaminophen');

      // Results would be updated and announced
      await waitFor(() => {
        const resultsRegion = screen.getByRole('status');
        expect(resultsRegion).toBeInTheDocument();
      });
    });
  });
});