/**
 * PharmaTraK Accessibility Test Suite
 * 
 * Comprehensive accessibility testing for all PharmaTraK components
 * using jest-axe and @testing-library for WCAG 2.1 AA compliance.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import components (adjust paths as needed)
import { PharmaButton } from '../../components/common/PharmaButton';
import { PharmaModal } from '../../components/common/PharmaModal';
import { PharmaForm } from '../../components/common/PharmaForm';
import { PharmaTable } from '../../components/common/PharmaTable';
import { PharmaSearch } from '../../components/common/PharmaSearch';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data for testing
const mockTableData = [
  { id: 1, name: 'Amoxicillin', ndc: '12345-678-90', quantity: 100 },
  { id: 2, name: 'Ibuprofen', ndc: '98765-432-10', quantity: 50 }
];

const mockTableColumns = [
  { key: 'name', label: 'Medication Name', sortable: true },
  { key: 'ndc', label: 'NDC', sortable: false },
  { key: 'quantity', label: 'Quantity', sortable: true, align: 'right' }
];

describe('PharmaTraK Accessibility Test Suite', () => {
  
  describe('PharmaButton Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PharmaButton variant="primary">Save Changes</PharmaButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <PharmaButton onClick={handleClick}>Click me</PharmaButton>
      );
      
      const button = screen.getByRole('button', { name: /click me/i });
      
      // Should be focusable
      await user.tab();
      expect(button).toHaveFocus();
      
      // Should activate on Enter
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Should activate on Space
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    test('should have proper ARIA attributes when loading', () => {
      render(
        <PharmaButton loading loadingText="Saving...">
          Save
        </PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('should announce confirmation dialogs', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <PharmaButton
          confirmAction
          confirmMessage="Are you sure you want to delete this medication?"
          onClick={handleClick}
        >
          Delete
        </PharmaButton>
      );
      
      const button = screen.getByRole('button', { name: /delete/i });
      await user.click(button);
      
      // Confirmation dialog should be announced
      expect(screen.getByText('Are you sure you want to delete this medication?')).toBeInTheDocument();
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should support icon buttons with proper labels', async () => {
      const { container } = render(
        <PharmaButton
          icon={<i className="fas fa-save" />}
          aria-label="Save prescription"
        >
          <span className="sr-only">Save</span>
        </PharmaButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      expect(screen.getByRole('button', { name: /save prescription/i })).toBeInTheDocument();
    });
  });

  describe('PharmaModal Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PharmaModal show={true} onHide={() => {}} title="Test Modal">
          <p>Modal content</p>
        </PharmaModal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const handleHide = jest.fn();
      
      render(
        <div>
          <button>Outside button</button>
          <PharmaModal show={true} onHide={handleHide} title="Test Modal">
            <input type="text" placeholder="First input" />
            <input type="text" placeholder="Second input" />
            <button>Close</button>
          </PharmaModal>
        </div>
      );
      
      // Focus should be trapped in modal
      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      // First input should have focus initially
      expect(firstInput).toHaveFocus();
      
      // Tab should move to second input
      await user.tab();
      expect(secondInput).toHaveFocus();
      
      // Tab should move to close button
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      // Tab should wrap back to first input
      await user.tab();
      expect(firstInput).toHaveFocus();
    });

    test('should close on Escape key', async () => {
      const user = userEvent.setup();
      const handleHide = jest.fn();
      
      render(
        <PharmaModal show={true} onHide={handleHide} title="Test Modal">
          <p>Modal content</p>
        </PharmaModal>
      );
      
      await user.keyboard('{Escape}');
      expect(handleHide).toHaveBeenCalled();
    });

    test('should have proper ARIA attributes', () => {
      render(
        <PharmaModal show={true} onHide={() => {}} title="Test Modal">
          <p>Modal content</p>
        </PharmaModal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });
  });

  describe('PharmaForm Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PharmaForm onSubmit={() => {}}>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" type="text" />
        </PharmaForm>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should associate labels with form controls', () => {
      render(
        <PharmaForm onSubmit={() => {}}>
          <label htmlFor="patient-name">Patient Name</label>
          <input id="patient-name" type="text" required />
          
          <label htmlFor="medication">Medication</label>
          <select id="medication" required>
            <option value="">Select medication</option>
            <option value="amoxicillin">Amoxicillin</option>
          </select>
        </PharmaForm>
      );
      
      const nameInput = screen.getByLabelText('Patient Name');
      const medicationSelect = screen.getByLabelText('Medication');
      
      expect(nameInput).toBeRequired();
      expect(medicationSelect).toBeRequired();
    });

    test('should announce validation errors', async () => {
      const user = userEvent.setup();
      
      render(
        <PharmaForm
          onSubmit={() => {}}
          validationRules={{
            email: [
              { type: 'required', message: 'Email is required' },
              { type: 'email', message: 'Valid email required' }
            ]
          }}
        >
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" />
          <button type="submit">Submit</button>
        </PharmaForm>
      );
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Error should be announced
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Email is required');
      });
    });

    test('should support fieldsets for grouped inputs', async () => {
      const { container } = render(
        <PharmaForm onSubmit={() => {}}>
          <fieldset>
            <legend>Patient Information</legend>
            <label htmlFor="first-name">First Name</label>
            <input id="first-name" type="text" />
            <label htmlFor="last-name">Last Name</label>
            <input id="last-name" type="text" />
          </fieldset>
        </PharmaForm>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      expect(screen.getByRole('group', { name: /patient information/i })).toBeInTheDocument();
    });
  });

  describe('PharmaTable Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PharmaTable
          data={mockTableData}
          columns={mockTableColumns}
          caption="Pharmacy inventory table"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper table structure', () => {
      render(
        <PharmaTable
          data={mockTableData}
          columns={mockTableColumns}
          caption="Pharmacy inventory"
        />
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for caption
      expect(screen.getByText('Pharmacy inventory')).toBeInTheDocument();
      
      // Check for column headers
      expect(screen.getByRole('columnheader', { name: /medication name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /ndc/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /quantity/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <PharmaTable
          data={mockTableData}
          columns={mockTableColumns}
          sortable={true}
        />
      );
      
      const nameHeader = screen.getByRole('columnheader', { name: /medication name/i });
      
      // Should be focusable
      nameHeader.focus();
      expect(nameHeader).toHaveFocus();
      
      // Should sort on Enter
      await user.keyboard('{Enter}');
      expect(nameHeader).toHaveAttribute('aria-sort');
    });

    test('should announce sort state changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PharmaTable
          data={mockTableData}
          columns={mockTableColumns}
          sortable={true}
        />
      );
      
      const nameHeader = screen.getByRole('columnheader', { name: /medication name/i });
      await user.click(nameHeader);
      
      // Should announce sort state
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    test('should have accessible row selection', async () => {
      const user = userEvent.setup();
      const handleSelection = jest.fn();
      
      render(
        <PharmaTable
          data={mockTableData}
          columns={mockTableColumns}
          selection={{ enabled: true, onSelectionChange: handleSelection }}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // First checkbox should be "select all"
      const selectAllCheckbox = checkboxes[0];
      expect(selectAllCheckbox).toHaveAttribute('aria-label', expect.stringMatching(/select all/i));
      
      await user.click(selectAllCheckbox);
      expect(handleSelection).toHaveBeenCalled();
    });
  });

  describe('PharmaSearch Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PharmaSearch
          onSearch={() => {}}
          placeholder="Search medications..."
          aria-label="Medication search"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper search input labeling', () => {
      render(
        <PharmaSearch
          onSearch={() => {}}
          placeholder="Search medications..."
          aria-label="Search for medications by name or NDC"
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search for medications by name or NDC');
    });

    test('should announce search results', async () => {
      const user = userEvent.setup();
      const mockResults = [
        { id: 1, title: 'Amoxicillin 500mg', description: 'NDC: 12345-678-90' },
        { id: 2, title: 'Ibuprofen 200mg', description: 'NDC: 98765-432-10' }
      ];
      
      render(
        <PharmaSearch
          onSearch={() => {}}
          results={mockResults}
          showResults={true}
        />
      );
      
      // Results should be announced
      const resultsList = screen.getByRole('listbox');
      expect(resultsList).toBeInTheDocument();
      expect(resultsList).toHaveAttribute('aria-label', expect.stringMatching(/search results/i));
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    test('should support keyboard navigation in results', async () => {
      const user = userEvent.setup();
      const mockResults = [
        { id: 1, title: 'Amoxicillin 500mg', description: 'NDC: 12345-678-90' },
        { id: 2, title: 'Ibuprofen 200mg', description: 'NDC: 98765-432-10' }
      ];
      
      render(
        <PharmaSearch
          onSearch={() => {}}
          results={mockResults}
          showResults={true}
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();
      
      // Arrow down should move to first result
      await user.keyboard('{ArrowDown}');
      
      const firstOption = screen.getByRole('option', { name: /amoxicillin/i });
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
      
      // Arrow down should move to second result
      await user.keyboard('{ArrowDown}');
      
      const secondOption = screen.getByRole('option', { name: /ibuprofen/i });
      expect(secondOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Pharmacy-Specific Accessibility', () => {
    test('should announce drug warnings appropriately', async () => {
      const DrugWarningComponent = ({ drug }) => (
        <div className="drug-warning">
          <h3>{drug.name}</h3>
          {drug.hasWarning && (
            <div role="alert" aria-live="assertive" className="warning">
              <strong>Warning:</strong> This medication may cause drowsiness
            </div>
          )}
        </div>
      );

      const { rerender } = render(
        <DrugWarningComponent drug={{ name: 'Test Drug', hasWarning: false }} />
      );

      // Add warning - should be announced immediately
      rerender(
        <DrugWarningComponent drug={{ name: 'Test Drug', hasWarning: true }} />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent('Warning: This medication may cause drowsiness');
    });

    test('should make NDC numbers accessible', () => {
      const NDCDisplay = ({ ndc }) => (
        <span aria-label={`NDC ${ndc.replace(/-/g, ' ')}`}>
          {ndc}
        </span>
      );

      render(<NDCDisplay ndc="12345-678-90" />);

      const ndcElement = screen.getByText('12345-678-90');
      expect(ndcElement).toHaveAttribute('aria-label', 'NDC 12345 678 90');
    });

    test('should handle prescription directions accessibility', () => {
      const PrescriptionDirections = ({ sig }) => (
        <div className="prescription-directions">
          <h4>Directions for Use</h4>
          <div
            role="text"
            aria-label="Prescription directions"
            className="directions-text"
          >
            {sig}
          </div>
        </div>
      );

      render(
        <PrescriptionDirections sig="Take 1 tablet by mouth twice daily with food" />
      );

      const directions = screen.getByRole('text');
      expect(directions).toHaveAttribute('aria-label', 'Prescription directions');
      expect(directions).toHaveTextContent('Take 1 tablet by mouth twice daily with food');
    });

    test('should handle controlled substance warnings', () => {
      const ControlledSubstanceWarning = ({ deaSchedule }) => (
        <div className="controlled-substance-warning">
          {deaSchedule && (
            <div role="alert" className="dea-schedule">
              <span className="sr-only">This is a controlled substance.</span>
              <strong>DEA Schedule {deaSchedule}</strong>
            </div>
          )}
        </div>
      );

      render(<ControlledSubstanceWarning deaSchedule="II" />);

      const warning = screen.getByRole('alert');
      expect(warning).toBeInTheDocument();
      expect(screen.getByText('This is a controlled substance.')).toHaveClass('sr-only');
      expect(screen.getByText('DEA Schedule II')).toBeInTheDocument();
    });
  });

  describe('Color and Contrast Accessibility', () => {
    test('should not rely solely on color for information', () => {
      const StatusIndicator = ({ status }) => {
        const getStatusInfo = (status) => {
          switch (status) {
            case 'filled':
              return { className: 'status-filled', icon: '✓', text: 'Filled' };
            case 'pending':
              return { className: 'status-pending', icon: '⏳', text: 'Pending' };
            case 'cancelled':
              return { className: 'status-cancelled', icon: '✗', text: 'Cancelled' };
            default:
              return { className: 'status-unknown', icon: '?', text: 'Unknown' };
          }
        };

        const statusInfo = getStatusInfo(status);

        return (
          <span className={statusInfo.className}>
            <span aria-hidden="true">{statusInfo.icon}</span>
            <span className="sr-only">Status: </span>
            {statusInfo.text}
          </span>
        );
      };

      render(<StatusIndicator status="filled" />);

      const statusElement = screen.getByText('Filled');
      expect(statusElement).toBeInTheDocument();
      expect(screen.getByText('Status:')).toHaveClass('sr-only');
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    test('should have adequate touch targets', () => {
      const MobileButton = ({ children, ...props }) => (
        <button
          {...props}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '12px 16px',
            fontSize: '16px', // Prevents zoom on iOS
            ...props.style
          }}
        >
          {children}
        </button>
      );

      render(<MobileButton>Touch Me</MobileButton>);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check minimum touch target size (44px is iOS/Android minimum)
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Screen Reader Announcements', () => {
    test('should announce loading states', async () => {
      const LoadingComponent = ({ loading }) => (
        <div>
          <button disabled={loading}>
            {loading && (
              <span role="status" aria-live="polite">
                Loading, please wait...
              </span>
            )}
            Save
          </button>
        </div>
      );

      const { rerender } = render(<LoadingComponent loading={false} />);

      // Start loading
      rerender(<LoadingComponent loading={true} />);

      const loadingMessage = screen.getByRole('status');
      expect(loadingMessage).toHaveTextContent('Loading, please wait...');
      expect(loadingMessage).toHaveAttribute('aria-live', 'polite');
    });

    test('should announce form submission results', async () => {
      const FormWithFeedback = () => {
        const [submitted, setSubmitted] = React.useState(false);
        const [error, setError] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          setSubmitted(true);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Enter text" />
            <button type="submit">Submit</button>
            
            {submitted && (
              <div role="status" aria-live="polite">
                Form submitted successfully
              </div>
            )}
            
            {error && (
              <div role="alert" aria-live="assertive">
                {error}
              </div>
            )}
          </form>
        );
      };

      const user = userEvent.setup();
      render(<FormWithFeedback />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      const successMessage = screen.getByRole('status');
      expect(successMessage).toHaveTextContent('Form submitted successfully');
    });
  });
});

// Utility functions for accessibility testing
export const accessibilityTestUtils = {
  /**
   * Check if element has proper focus indicator
   */
  hasFocusIndicator: (element) => {
    const styles = window.getComputedStyle(element, ':focus');
    return styles.outline !== 'none' || styles.boxShadow !== 'none';
  },

  /**
   * Check if text has adequate color contrast
   */
  hasAdequateContrast: (element) => {
    // This would need a proper color contrast calculation
    // For now, return true as a placeholder
    return true;
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container) => {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return container.querySelectorAll(focusableSelectors);
  },

  /**
   * Wait for screen reader announcement
   */
  waitForAnnouncement: async (text, timeout = 5000) => {
    return waitFor(
      () => {
        const liveRegions = screen.getAllByRole('status');
        const alerts = screen.getAllByRole('alert');
        const allAnnouncements = [...liveRegions, ...alerts];
        
        const hasAnnouncement = allAnnouncements.some(region => 
          region.textContent.includes(text)
        );
        
        expect(hasAnnouncement).toBe(true);
      },
      { timeout }
    );
  }
};