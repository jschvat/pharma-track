import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FDASearch from '../FDASearch';
import { renderWithProviders, mockUser, mockApiSuccess, mockApiError, mockApiTimeout } from '../../utils/test-utils';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((input) => input)
}));

describe('FDASearch Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders FDA search interface', () => {
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      expect(screen.getByText('FDA Drug Search')).toBeInTheDocument();
      expect(screen.getByText(/search the fda drug database/i)).toBeInTheDocument();
      
      // Should show search type buttons
      expect(screen.getByRole('button', { name: 'NDC Number' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generic Name' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Brand Name' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Manufacturer' })).toBeInTheDocument();
      
      // Should show search button
      expect(screen.getByText('Search FDA Database')).toBeInTheDocument();
    });

    it('shows default NDC search form', () => {
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      expect(screen.getByLabelText(/ndc number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., 0069-2587-10/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('10 results')).toBeInTheDocument();
    });

    it('shows empty state when no results', () => {
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      expect(screen.getByText('Search FDA Drug Database')).toBeInTheDocument();
      expect(screen.getByText(/enter search criteria above/i)).toBeInTheDocument();
    });
  });

  describe('Search Type Selection', () => {
    it('switches to generic name search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.click(screen.getByText('Generic Name'));
      
      expect(screen.getByLabelText(/generic name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., acetaminophen/i)).toBeInTheDocument();
    });

    it('switches to brand name search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.click(screen.getByText('Brand Name'));
      
      expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., tylenol/i)).toBeInTheDocument();
    });

    it('switches to manufacturer search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.click(screen.getByText('Manufacturer'));
      
      expect(screen.getByLabelText(/manufacturer/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., johnson & johnson/i)).toBeInTheDocument();
    });

    it('clears form when switching search types', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      // Fill NDC form
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      
      // Switch to generic search
      await user.click(screen.getByText('Generic Name'));
      
      // NDC field should be cleared
      expect(screen.queryByDisplayValue('12345-678-90')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/generic name/i)).toHaveValue('');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Mock successful FDA search response
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand',
            manufacturer_name: 'Test Manufacturer',
            dosage_form: 'TABLET',
            strength: '10 mg',
            route: ['ORAL'],
            package_description: '100 tablets',
            substance_name: 'Test Substance'
          }
        ]
      });
      
      // Mock drug existence check
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
    });

    it('performs NDC search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Search Results (1 found)')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
        expect(screen.getByText('Test Manufacturer')).toBeInTheDocument();
      });
    });

    it('performs generic name search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.click(screen.getByText('Generic Name'));
      await user.type(screen.getByLabelText(/generic name/i), 'acetaminophen');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Search Results (1 found)')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });
    });

    it('shows loading state during search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      // Should show loading spinner
      expect(screen.getByText(/searching fda database/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('validates search term is required', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      // Try to search without entering anything
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a search term/i)).toBeInTheDocument();
      });
    });

    it('allows changing results limit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      const limitSelect = screen.getByLabelText(/results limit/i);
      await user.selectOptions(limitSelect, '25');
      
      expect(screen.getByDisplayValue('25 results')).toBeInTheDocument();
    });
  });

  describe('Search Results Display', () => {
    beforeEach(() => {
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand',
            manufacturer_name: 'Test Manufacturer',
            dosage_form: 'TABLET',
            strength: '10 mg',
            route: ['ORAL'],
            package_description: '100 tablets',
            substance_name: ['Test Substance']
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
    });

    it('displays drug information cards', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        // Should show drug details
        expect(screen.getByText('12345-678-90')).toBeInTheDocument();
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('Test Manufacturer')).toBeInTheDocument();
        expect(screen.getByText('TABLET')).toBeInTheDocument();
        expect(screen.getByText('10 mg')).toBeInTheDocument();
        expect(screen.getByText('ORAL')).toBeInTheDocument();
        expect(screen.getByText('100 tablets')).toBeInTheDocument();
        expect(screen.getByText('Test Substance')).toBeInTheDocument();
      });
    });

    it('shows add to database button for new drugs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
    });

    it('shows already in inventory for existing drugs', async () => {
      const user = userEvent.setup();
      
      // Mock drug as already existing
      mockApiSuccess('/drugs/check-exist', { existingNDCs: ['12345-678-90'] }, 'post');
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Already in Inventory')).toBeInTheDocument();
        expect(screen.queryByText('Add to Database')).not.toBeInTheDocument();
      });
    });
  });

  describe('Add Drug Modal', () => {
    beforeEach(() => {
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand',
            manufacturer_name: 'Test Manufacturer',
            dosage_form: 'TABLET',
            strength: '10 mg',
            packaging: [
              {
                package_ndc: '12345-678-90',
                description: '100 tablets'
              }
            ]
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
      
      // Mock drug existence check for individual drug
      mockApiSuccess('/drugs/search', { drugs: [] });
    });

    it('opens add drug modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Drug to Inventory')).toBeInTheDocument();
        expect(screen.getByText('Drug Information')).toBeInTheDocument();
        expect(screen.getByLabelText(/initial quantity/i)).toBeInTheDocument();
      });
    });

    it('displays drug information in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Generic')).toBeInTheDocument();
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('Test Manufacturer')).toBeInTheDocument();
      });
    });

    it('shows package selection when available', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Select Package Information')).toBeInTheDocument();
        expect(screen.getByText(/choose a package/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Drug to Inventory')).toBeInTheDocument();
      });
      
      // Try to submit without required fields
      await user.click(screen.getByText('Add to Inventory'));
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid initial quantity/i)).toBeInTheDocument();
      });
    });

    it('adds drug with inventory successfully', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/drugs/add-from-fda-with-inventory', { success: true }, 'post');
      
      // Mock window.alert
      window.alert = jest.fn();
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Drug to Inventory')).toBeInTheDocument();
      });
      
      // Fill required fields
      await user.type(screen.getByLabelText(/initial quantity/i), '100');
      await user.selectOptions(screen.getByDisplayValue(/choose a package/i), '12345-678-90');
      
      // Submit form
      await user.click(screen.getByText('Add to Inventory'));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('added to database with initial inventory')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles search API error', async () => {
      const user = userEvent.setup();
      mockApiError('/drugs/search/fda', 500, 'FDA service unavailable');
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText(/fda service unavailable/i)).toBeInTheDocument();
      });
    });

    it('handles no results from search', async () => {
      const user = userEvent.setup();
      mockApiSuccess('/drugs/search/fda', { results: [] });
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });

    it('handles add drug API error', async () => {
      const user = userEvent.setup();
      
      // Setup successful search
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand'
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
      mockApiSuccess('/drugs/search', { drugs: [] });
      
      // Mock add drug error
      mockApiError('/drugs/add-from-fda-with-inventory', 400, 'Validation failed', 'post');
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Drug to Inventory')).toBeInTheDocument();
      });
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/initial quantity/i), '100');
      await user.click(screen.getByText('Add to Inventory'));
      
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout gracefully', async () => {
      const user = userEvent.setup();
      mockApiTimeout('/drugs/search/fda');
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('prevents adding drug without NDC', async () => {
      const user = userEvent.setup();
      
      // Mock search result without NDC
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            generic_name: 'Test Generic',
            brand_name: 'Test Brand'
            // No NDC field
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        const addButton = screen.getByText('Add to Database');
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('Drug Existence Check', () => {
    it('checks if drug already exists before adding', async () => {
      const user = userEvent.setup();
      
      // Setup search results
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand'
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
      
      // Mock drug already exists
      mockApiSuccess('/drugs/search', { 
        drugs: [{ ndc: '12345-678-90', generic_name: 'Test Generic' }] 
      });
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText(/already exists in your database/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates NDC format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      const ndcInput = screen.getByLabelText(/ndc number/i);
      expect(ndcInput).toHaveAttribute('pattern', '[0-9\\-]+');
    });

    it('validates quantity is required in modal', async () => {
      const user = userEvent.setup();
      
      // Setup successful search
      mockApiSuccess('/drugs/search/fda', {
        results: [
          {
            ndc: '12345-678-90',
            generic_name: 'Test Generic',
            brand_name: 'Test Brand'
          }
        ]
      });
      mockApiSuccess('/drugs/check-exist', { existingNDCs: [] }, 'post');
      mockApiSuccess('/drugs/search', { drugs: [] });
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      await user.type(screen.getByLabelText(/ndc number/i), '12345-678-90');
      await user.click(screen.getByText('Search FDA Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add to Database')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Add to Database'));
      
      await waitFor(() => {
        expect(screen.getByText('Add Drug to Inventory')).toBeInTheDocument();
      });
      
      // Try to submit with invalid quantity
      await user.type(screen.getByLabelText(/initial quantity/i), '0');
      await user.click(screen.getByText('Add to Inventory'));
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid initial quantity/i)).toBeInTheDocument();
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
      
      renderWithProviders(<FDASearch />, { user: mockUser });
      
      // Should render without errors on mobile
      expect(screen.getByText('FDA Drug Search')).toBeInTheDocument();
    });
  });
});