/**
 * PharmaBreadcrumbs Component Tests
 * 
 * Comprehensive test suite for the PharmaBreadcrumbs navigation component
 * including route generation, mobile responsiveness, and accessibility.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, renderForA11y, testKeyboardNavigation, testAriaAttributes } from '../utils/testUtils';
import PharmaBreadcrumbs, {
  BreadcrumbProvider,
  DashboardBreadcrumbs,
  InventoryBreadcrumbs,
  PrescriptionBreadcrumbs,
  CompactBreadcrumbs,
  MobileBreadcrumbs,
  useBreadcrumbs,
  BreadcrumbUtils,
  BREADCRUMB_TYPES,
  ROUTE_PATTERNS
} from '../../components/common/PharmaBreadcrumbs';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/dashboard/inventory/items/123',
    search: '?filter=active',
    hash: '',
    state: null
  })
}));

describe('PharmaBreadcrumbs', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Basic Functionality', () => {
    const basicBreadcrumbs = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Inventory', path: '/dashboard/inventory' },
      { label: 'Items', path: '/dashboard/inventory/items' },
      { label: 'Item Details', path: '/dashboard/inventory/items/123', current: true }
    ];

    test('renders breadcrumb navigation', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={basicBreadcrumbs} />
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/breadcrumb/i)).toBeInTheDocument();
    });

    test('displays all breadcrumb items', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={basicBreadcrumbs} />
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Item Details')).toBeInTheDocument();
    });

    test('renders clickable links for non-current items', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={basicBreadcrumbs} />
      );
      
      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      const inventoryLink = screen.getByRole('link', { name: 'Inventory' });
      const itemsLink = screen.getByRole('link', { name: 'Items' });
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(inventoryLink).toHaveAttribute('href', '/dashboard/inventory');
      expect(itemsLink).toHaveAttribute('href', '/dashboard/inventory/items');
    });

    test('renders current item as non-clickable', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={basicBreadcrumbs} />
      );
      
      const currentItem = screen.getByText('Item Details');
      expect(currentItem).not.toHaveAttribute('href');
      expect(currentItem.closest('li')).toHaveClass('active');
    });

    test('handles navigation clicks', async () => {
      const { user } = renderWithProviders(
        <PharmaBreadcrumbs items={basicBreadcrumbs} />
      );
      
      await user.click(screen.getByRole('link', { name: 'Dashboard' }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Separators and Styling', () => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Products', path: '/products' },
      { label: 'Details', path: '/products/123', current: true }
    ];

    test('renders default separators', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={items} />
      );
      
      const separators = screen.getAllByText('/');
      expect(separators).toHaveLength(1); // Between Home and Products
    });

    test('renders custom separator', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={items} separator="›" />
      );
      
      expect(screen.getByText('›')).toBeInTheDocument();
      expect(screen.queryByText('/')).not.toBeInTheDocument();
    });

    test('renders custom separator component', () => {
      const CustomSeparator = () => <span data-testid="custom-sep">→</span>;
      
      renderWithProviders(
        <PharmaBreadcrumbs items={items} separator={<CustomSeparator />} />
      );
      
      expect(screen.getByTestId('custom-sep')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={items} className="custom-breadcrumbs" />
      );
      
      expect(screen.getByRole('navigation')).toHaveClass('custom-breadcrumbs');
    });
  });

  describe('Maximum Items and Collapsing', () => {
    const manyItems = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Inventory', path: '/dashboard/inventory' },
      { label: 'Categories', path: '/dashboard/inventory/categories' },
      { label: 'Medications', path: '/dashboard/inventory/categories/medications' },
      { label: 'Analgesics', path: '/dashboard/inventory/categories/medications/analgesics' },
      { label: 'Item Details', path: '/dashboard/inventory/categories/medications/analgesics/123', current: true }
    ];

    test('collapses breadcrumbs when exceeding maxItems', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={manyItems} maxItems={4} />
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Analgesics')).toBeInTheDocument();
      expect(screen.getByText('Item Details')).toBeInTheDocument();
      
      // Middle items should be hidden
      expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
      expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    });

    test('shows collapsed items on ellipsis click', async () => {
      const { user } = renderWithProviders(
        <PharmaBreadcrumbs items={manyItems} maxItems={4} collapsible />
      );
      
      const ellipsis = screen.getByText('...');
      await user.click(ellipsis);
      
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('Medications')).toBeInTheDocument();
      });
    });

    test('preserves first and last items when collapsing', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={manyItems} maxItems={3} />
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Item Details')).toBeInTheDocument();
    });
  });

  describe('Icons and Rich Content', () => {
    const itemsWithIcons = [
      { 
        label: 'Dashboard', 
        path: '/dashboard', 
        icon: <span data-testid="dashboard-icon">🏠</span> 
      },
      { 
        label: 'Inventory', 
        path: '/dashboard/inventory',
        icon: <span data-testid="inventory-icon">📦</span>
      },
      { 
        label: 'Current Item', 
        path: '/dashboard/inventory/123', 
        current: true,
        icon: <span data-testid="item-icon">💊</span>
      }
    ];

    test('renders icons with labels', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={itemsWithIcons} />
      );
      
      expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-icon')).toBeInTheDocument();
      expect(screen.getByTestId('item-icon')).toBeInTheDocument();
    });

    test('renders custom content', () => {
      const customItems = [
        { 
          label: (
            <div>
              <strong>Custom</strong>
              <small>Label</small>
            </div>
          ), 
          path: '/custom' 
        },
        { label: 'Normal', path: '/normal', current: true }
      ];

      renderWithProviders(
        <PharmaBreadcrumbs items={customItems} />
      );
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });
  });

  describe('Specialized Breadcrumb Components', () => {
    test('DashboardBreadcrumbs generates appropriate breadcrumbs', () => {
      renderWithProviders(
        <DashboardBreadcrumbs currentPage="Inventory Management" />
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    });

    test('InventoryBreadcrumbs handles inventory navigation', () => {
      renderWithProviders(
        <InventoryBreadcrumbs 
          category="Medications"
          subcategory="Analgesics"
          itemId="123"
        />
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Medications')).toBeInTheDocument();
      expect(screen.getByText('Analgesics')).toBeInTheDocument();
    });

    test('PrescriptionBreadcrumbs shows prescription workflow', () => {
      renderWithProviders(
        <PrescriptionBreadcrumbs 
          patientId="456"
          prescriptionId="RX789"
          step="review"
        />
      );
      
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('Patient 456')).toBeInTheDocument();
      expect(screen.getByText('RX789')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    test('CompactBreadcrumbs shows minimal breadcrumbs', () => {
      const items = [
        { label: 'Home', path: '/' },
        { label: 'Products', path: '/products' },
        { label: 'Details', path: '/products/123', current: true }
      ];

      renderWithProviders(
        <CompactBreadcrumbs items={items} />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('breadcrumb-compact');
    });

    test('MobileBreadcrumbs adapts for mobile screens', () => {
      const items = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Inventory', path: '/dashboard/inventory' },
        { label: 'Items', path: '/dashboard/inventory/items' },
        { label: 'Details', path: '/dashboard/inventory/items/123', current: true }
      ];

      renderWithProviders(
        <MobileBreadcrumbs items={items} />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('breadcrumb-mobile');
    });
  });

  describe('BreadcrumbProvider and useBreadcrumbs Hook', () => {
    test('provides breadcrumb context', () => {
      const TestComponent = () => {
        const { breadcrumbs, setBreadcrumbs } = useBreadcrumbs();
        
        return (
          <div>
            <div data-testid="breadcrumb-count">{breadcrumbs.length}</div>
            <button 
              onClick={() => setBreadcrumbs([
                { label: 'Test', path: '/test', current: true }
              ])}
            >
              Set Breadcrumbs
            </button>
          </div>
        );
      };

      const { user } = renderWithProviders(
        <BreadcrumbProvider>
          <TestComponent />
        </BreadcrumbProvider>
      );
      
      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('0');
    });

    test('updates breadcrumbs through context', async () => {
      const TestComponent = () => {
        const { breadcrumbs, setBreadcrumbs, addBreadcrumb } = useBreadcrumbs();
        
        return (
          <div>
            <div data-testid="breadcrumb-count">{breadcrumbs.length}</div>
            <button onClick={() => addBreadcrumb({ label: 'New', path: '/new' })}>
              Add Breadcrumb
            </button>
            <PharmaBreadcrumbs items={breadcrumbs} />
          </div>
        );
      };

      const { user } = renderWithProviders(
        <BreadcrumbProvider>
          <TestComponent />
        </BreadcrumbProvider>
      );
      
      await user.click(screen.getByText('Add Breadcrumb'));
      
      expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('1');
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    test('generates breadcrumbs from route patterns', () => {
      const TestComponent = () => {
        const { generateFromRoute } = useBreadcrumbs();
        const breadcrumbs = generateFromRoute('/dashboard/inventory/items/123');
        
        return <PharmaBreadcrumbs items={breadcrumbs} />;
      };

      renderWithProviders(
        <BreadcrumbProvider>
          <TestComponent />
        </BreadcrumbProvider>
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });
  });

  describe('BreadcrumbUtils', () => {
    test('generates breadcrumbs from path', () => {
      const breadcrumbs = BreadcrumbUtils.generateFromPath('/dashboard/inventory/items/123');
      
      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs[0]).toMatchObject({ label: 'Dashboard', path: '/dashboard' });
      expect(breadcrumbs[1]).toMatchObject({ label: 'Inventory', path: '/dashboard/inventory' });
      expect(breadcrumbs[2]).toMatchObject({ label: 'Items', path: '/dashboard/inventory/items' });
      expect(breadcrumbs[3]).toMatchObject({ 
        label: '123', 
        path: '/dashboard/inventory/items/123', 
        current: true 
      });
    });

    test('formats labels correctly', () => {
      const formatted = BreadcrumbUtils.formatLabel('user-management');
      expect(formatted).toBe('User Management');
    });

    test('truncates long labels', () => {
      const longLabel = 'This is a very long breadcrumb label that should be truncated';
      const truncated = BreadcrumbUtils.truncateLabel(longLabel, 20);
      
      expect(truncated).toHaveLength(23); // 20 + '...'
      expect(truncated).toMatch(/\.\.\.$/);
    });

    test('validates breadcrumb items', () => {
      const validItem = { label: 'Test', path: '/test' };
      const invalidItem = { label: '', path: '/test' };
      
      expect(BreadcrumbUtils.validateItem(validItem)).toBe(true);
      expect(BreadcrumbUtils.validateItem(invalidItem)).toBe(false);
    });
  });

  describe('Accessibility', () => {
    const accessibleItems = [
      { label: 'Home', path: '/' },
      { label: 'Products', path: '/products' },
      { label: 'Current', path: '/products/123', current: true }
    ];

    test('has no accessibility violations', async () => {
      const { checkA11y } = renderForA11y(
        <PharmaBreadcrumbs items={accessibleItems} />
      );
      
      await checkA11y();
    });

    test('has proper ARIA attributes', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={accessibleItems} />
      );
      
      const nav = screen.getByRole('navigation');
      testAriaAttributes(nav, {
        label: 'breadcrumb'
      });
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const { container } = renderWithProviders(
        <PharmaBreadcrumbs items={accessibleItems} />
      );
      
      await testKeyboardNavigation(container);
    });

    test('announces current page to screen readers', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={accessibleItems} />
      );
      
      const currentItem = screen.getByText('Current');
      testAriaAttributes(currentItem.closest('li'), {
        current: 'page'
      });
    });

    test('provides proper focus management', async () => {
      const { user } = renderWithProviders(
        <PharmaBreadcrumbs items={accessibleItems} />
      );
      
      const firstLink = screen.getByRole('link', { name: 'Home' });
      const secondLink = screen.getByRole('link', { name: 'Products' });
      
      await user.tab();
      expect(firstLink).toHaveFocus();
      
      await user.tab();
      expect(secondLink).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    const responsiveItems = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Inventory Management', path: '/dashboard/inventory' },
      { label: 'Product Categories', path: '/dashboard/inventory/categories' },
      { label: 'Medications', path: '/dashboard/inventory/categories/medications' },
      { label: 'Current Item', path: '/dashboard/inventory/categories/medications/123', current: true }
    ];

    test('adapts to mobile viewport', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithProviders(
        <PharmaBreadcrumbs items={responsiveItems} responsive />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('breadcrumb-mobile');
    });

    test('shows back button on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithProviders(
        <PharmaBreadcrumbs items={responsiveItems} responsive showBackButton />
      );
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('handles back button click', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { user } = renderWithProviders(
        <PharmaBreadcrumbs items={responsiveItems} responsive showBackButton />
      );
      
      await user.click(screen.getByRole('button', { name: /back/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/inventory/categories/medications');
    });
  });

  describe('Performance', () => {
    test('memoizes breadcrumb generation', () => {
      const generateSpy = jest.spyOn(BreadcrumbUtils, 'generateFromPath');
      
      const TestComponent = ({ path }) => {
        const breadcrumbs = BreadcrumbUtils.generateFromPath(path);
        return <PharmaBreadcrumbs items={breadcrumbs} />;
      };

      const { rerender } = renderWithProviders(
        <TestComponent path="/dashboard/inventory" />
      );
      
      generateSpy.mockClear();
      rerender(<TestComponent path="/dashboard/inventory" />);
      
      // Should use memoized result for same path
      expect(generateSpy).toHaveBeenCalledTimes(1);
      
      generateSpy.mockRestore();
    });

    test('efficiently handles large breadcrumb lists', () => {
      const largeBreadcrumbs = Array.from({ length: 100 }, (_, i) => ({
        label: `Level ${i}`,
        path: `/level-${i}`,
        current: i === 99
      }));

      const startTime = performance.now();
      renderWithProviders(
        <PharmaBreadcrumbs items={largeBreadcrumbs} maxItems={5} />
      );
      const endTime = performance.now();
      
      // Should render quickly even with many items
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty breadcrumb array', () => {
      renderWithProviders(
        <PharmaBreadcrumbs items={[]} />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    test('handles single breadcrumb item', () => {
      const singleItem = [{ label: 'Only Item', path: '/only', current: true }];
      
      renderWithProviders(
        <PharmaBreadcrumbs items={singleItem} />
      );
      
      expect(screen.getByText('Only Item')).toBeInTheDocument();
      expect(screen.queryByText('/')).not.toBeInTheDocument(); // No separator
    });

    test('handles items without paths', () => {
      const itemsWithoutPaths = [
        { label: 'Static Label' },
        { label: 'Another Static', current: true }
      ];
      
      renderWithProviders(
        <PharmaBreadcrumbs items={itemsWithoutPaths} />
      );
      
      expect(screen.getByText('Static Label')).toBeInTheDocument();
      expect(screen.getByText('Another Static')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('handles very long breadcrumb labels', () => {
      const longLabelItems = [
        { 
          label: 'This is an extremely long breadcrumb label that might cause layout issues in the navigation', 
          path: '/long' 
        },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderWithProviders(
        <PharmaBreadcrumbs items={longLabelItems} maxLabelLength={20} />
      );
      
      const truncatedLabel = screen.getByText(/This is an extremely.../);
      expect(truncatedLabel).toBeInTheDocument();
    });
  });
});