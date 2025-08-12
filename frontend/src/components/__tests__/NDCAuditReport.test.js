import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NDCAuditReport from '../NDCAuditReport';
import { renderWithProviders, mockUser, mockApiSuccess, mockApiError, mockApiTimeout } from '../../utils/test-utils';

describe('NDCAuditReport Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('renders audit report interface', () => {
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      expect(screen.getByText('NDC Audit Report')).toBeInTheDocument();
      expect(screen.getByText(/generate comprehensive audit reports/i)).toBeInTheDocument();
      
      // Should show form elements
      expect(screen.getByLabelText(/store/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ndc/i)).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });

    it('shows store selection for non-admin users', () => {
      const userWithStore = { ...mockUser, store_id: 1, store_name: 'Test Pharmacy' };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      expect(screen.getByDisplayValue('Test Pharmacy')).toBeInTheDocument();
      expect(screen.getByText(/you can only generate reports for your assigned store/i)).toBeInTheDocument();
    });

    it('shows store dropdown for admin users', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      renderWithProviders(<NDCAuditReport />, { user: adminUser });
      
      expect(screen.getByText('Select Store...')).toBeInTheDocument();
    });

    it('shows form fields with proper labels', () => {
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      expect(screen.getByLabelText(/ndc/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/audit point date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/restrict to future date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include inactive inventory items/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      // Try to generate report without required fields
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/ndc and store are required/i)).toBeInTheDocument();
      });
    });

    it('validates NDC format', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      const ndcInput = screen.getByLabelText(/ndc/i);
      await user.type(ndcInput, '12345-678-90');
      
      expect(ndcInput).toHaveValue('12345-678-90');
    });

    it('handles date range validation', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      // Set start date
      const startDate = screen.getByLabelText(/audit point date/i);
      await user.type(startDate, '2025-01-01');
      
      // End date should have min attribute set
      const endDate = screen.getByLabelText(/restrict to future date/i);
      expect(endDate).toHaveAttribute('min', '2025-01-01');
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      // Mock successful audit report response
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: {
          ndc: '12345-678-90',
          generic_name: 'Test Generic',
          brand_name: 'Test Brand',
          manufacturer_name: 'Test Manufacturer',
          dosage_form: 'TABLET'
        },
        store_info: {
          name: 'Test Pharmacy',
          address: '123 Main St',
          state: 'NY',
          zipcode: '12345',
          dea_registration_number: 'AB1234567',
          npi: '1234567890'
        },
        audit_summary: {
          total_transactions: 10,
          final_running_total: 50,
          transaction_breakdown: {
            prescription_fills: 5,
            returns_to_stock: 2,
            expired_medications: 1,
            audit_adjustments: 1,
            other_adjustments: 1
          },
          audit_point_date: '2025-01-01',
          restriction_end_date: '2025-01-31'
        },
        audit_entries: [
          {
            transaction_date: '2025-01-15',
            transaction_type: 'prescription_fill',
            quantity_change: -5,
            quantity_before: 100,
            quantity_after: 95,
            running_total: 95,
            performed_by_name: 'Test User',
            performed_by_role: 'admin',
            reason: 'Patient prescription',
            reference_number: 'RX123'
          }
        ],
        generated_at: '2025-01-16T10:00:00Z'
      });
    });

    it('generates audit report with valid data', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      // Fill required fields
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      
      // Generate report
      await user.click(screen.getByText('Generate Report'));
      
      // Should show loading state
      expect(screen.getByText(/generating report/i)).toBeInTheDocument();
      
      // Should show report results
      await waitFor(() => {
        expect(screen.getByText('Drug Information')).toBeInTheDocument();
        expect(screen.getByText('Store Information')).toBeInTheDocument();
        expect(screen.getByText('Audit Summary')).toBeInTheDocument();
      });
    });

    it('displays drug information in report', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('Test Manufacturer')).toBeInTheDocument();
        expect(screen.getByText('TABLET')).toBeInTheDocument();
        expect(screen.getByText('12345-678-90')).toBeInTheDocument();
      });
    });

    it('displays store information in report', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
        expect(screen.getByText(/123 main st/i)).toBeInTheDocument();
        expect(screen.getByText('AB1234567')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
      });
    });

    it('displays audit summary statistics', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // Total transactions
        expect(screen.getByText('50')).toBeInTheDocument(); // Final stock level
        expect(screen.getByText('5')).toBeInTheDocument(); // Prescriptions filled
      });
    });

    it('displays transaction breakdown', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Prescriptions')).toBeInTheDocument();
        expect(screen.getByText('Returns')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getByText('Audits')).toBeInTheDocument();
        expect(screen.getByText('Adjustments')).toBeInTheDocument();
      });
    });

    it('displays detailed transaction history', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Detailed Transaction History')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Patient prescription')).toBeInTheDocument();
        expect(screen.getByText('RX123')).toBeInTheDocument();
        expect(screen.getByText('-5')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
      });
    });

    it('shows report generation timestamp', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/report generated on:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Report Export', () => {
    beforeEach(() => {
      // Mock successful audit report response
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90', generic_name: 'Test Generic' },
        store_info: { name: 'Test Pharmacy' },
        audit_summary: { total_transactions: 10, final_running_total: 50 },
        audit_entries: [],
        generated_at: '2025-01-16T10:00:00Z'
      });
      
      // Mock export responses
      mockApiSuccess('/audit/ndc/1/1234567890/export', 'csv,data,here');
    });

    it('shows export buttons after report generation', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
        expect(screen.getByText('Export JSON')).toBeInTheDocument();
      });
    });

    it('exports report as CSV', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Export CSV'));
      
      // Should trigger download
      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
      });
    });

    it('exports report as JSON', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock URL and document methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      const mockLink = { href: '', download: '', click: jest.fn() };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Export JSON')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Export JSON'));
      
      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('handles checkbox changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      const checkbox = screen.getByLabelText(/include inactive inventory items/i);
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('handles date input changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      const startDate = screen.getByLabelText(/audit point date/i);
      await user.type(startDate, '2025-01-01');
      
      expect(startDate).toHaveValue('2025-01-01');
    });

    it('cleans NDC input by removing non-digits', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock API call that should receive cleaned NDC
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90' },
        audit_summary: { total_transactions: 0 },
        audit_entries: []
      });
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      // Enter NDC with dashes
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      // API should be called with cleaned NDC (digits only)
      await waitFor(() => {
        expect(screen.queryByText(/generating report/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles report generation API error', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      mockApiError('/audit/ndc/1/1234567890', 500, 'Report generation failed');
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/report generation failed/i)).toBeInTheDocument();
      });
    });

    it('handles export API error', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock successful report generation
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90' },
        audit_summary: { total_transactions: 0 },
        audit_entries: []
      });
      
      // Mock export error
      mockApiError('/audit/ndc/1/1234567890/export', 500, 'Export failed');
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Export CSV'));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to export report/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout gracefully', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      mockApiTimeout('/audit/ndc/1/1234567890');
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate report/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('shows error dismissal', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      mockApiError('/audit/ndc/1/1234567890', 400, 'Test error message');
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
      
      // Dismiss error
      const dismissButton = screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);
      
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows no transactions message when audit entries are empty', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock report with no transactions
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90', generic_name: 'Test Generic' },
        store_info: { name: 'Test Pharmacy' },
        audit_summary: { total_transactions: 0, final_running_total: 0 },
        audit_entries: [],
        generated_at: '2025-01-16T10:00:00Z'
      });
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/no transactions found for the specified criteria/i)).toBeInTheDocument();
      });
    });

    it('handles missing store information gracefully', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock report with no store info
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90', generic_name: 'Test Generic' },
        store_info: null,
        audit_summary: { total_transactions: 0, final_running_total: 0 },
        audit_entries: [],
        generated_at: '2025-01-16T10:00:00Z'
      });
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText(/store information not available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Badge Display', () => {
    it('displays correct badges for different transaction types', async () => {
      const user = userEvent.setup();
      const userWithStore = { ...mockUser, store_id: 1 };
      
      // Mock report with various transaction types
      mockApiSuccess('/audit/ndc/1/1234567890', {
        drug_info: { ndc: '12345-678-90', generic_name: 'Test Generic' },
        store_info: { name: 'Test Pharmacy' },
        audit_summary: { total_transactions: 5, final_running_total: 50 },
        audit_entries: [
          { transaction_type: 'prescription_fill', quantity_change: -5, transaction_date: '2025-01-01' },
          { transaction_type: 'return_to_stock', quantity_change: 3, transaction_date: '2025-01-02' },
          { transaction_type: 'expire', quantity_change: -2, transaction_date: '2025-01-03' },
          { transaction_type: 'audit', quantity_change: 1, transaction_date: '2025-01-04' },
          { transaction_type: 'initial_inventory', quantity_change: 100, transaction_date: '2025-01-05' }
        ],
        generated_at: '2025-01-16T10:00:00Z'
      });
      
      renderWithProviders(<NDCAuditReport />, { user: userWithStore });
      
      await user.type(screen.getByLabelText(/ndc/i), '12345-678-90');
      await user.click(screen.getByText('Generate Report'));
      
      await waitFor(() => {
        expect(screen.getByText('Prescription')).toBeInTheDocument();
        expect(screen.getByText('Return')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getByText('Audit')).toBeInTheDocument();
        expect(screen.getByText('Initial')).toBeInTheDocument();
      });
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
      
      renderWithProviders(<NDCAuditReport />, { user: mockUser });
      
      // Should render without errors on mobile
      expect(screen.getByText('NDC Audit Report')).toBeInTheDocument();
    });
  });
});