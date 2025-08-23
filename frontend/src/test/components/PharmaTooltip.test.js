/**
 * PharmaTooltip Component Tests
 * 
 * Comprehensive test suite for the PharmaTooltip component including
 * positioning, triggers, content types, and accessibility features.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, renderForA11y, testAriaAttributes } from '../utils/testUtils';
import PharmaTooltip, {
  TooltipProvider,
  DrugTooltip,
  DosageTooltip,
  InteractionTooltip,
  InventoryTooltip,
  HelpTooltip,
  useTooltips,
  POSITIONS,
  TOOLTIP_TYPES
} from '../../components/common/PharmaTooltip';

// Mock drug data for testing
const mockDrugData = {
  id: 1,
  ndc: '0378-0781-05',
  generic_name: 'Acetaminophen',
  brand_name: 'Tylenol',
  strength: '500mg',
  dosage_form: 'TABLET',
  route: 'ORAL',
  manufacturer_name: 'Johnson & Johnson',
  active_ingredients: [
    { name: 'Acetaminophen', strength: '500mg', unit: 'mg' }
  ],
  contraindications: ['Liver disease', 'Alcohol dependence'],
  side_effects: ['Nausea', 'Dizziness', 'Liver damage (high doses)']
};

const mockInventoryData = {
  id: 1,
  quantity_on_hand: 50,
  reorder_level: 20,
  max_level: 200,
  lot_number: 'LOT12345',
  expiration_date: '2025-12-31',
  unit_cost: 0.25,
  selling_price: 0.50
};

describe('PharmaTooltip', () => {
  describe('Basic Functionality', () => {
    test('renders trigger element', () => {
      renderWithProviders(
        <PharmaTooltip content="Tooltip content">
          <button>Hover me</button>
        </PharmaTooltip>
      );
      
      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });

    test('shows tooltip on hover', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Test tooltip content">
          <button>Hover me</button>
        </PharmaTooltip>
      );
      
      const trigger = screen.getByRole('button');
      await user.hover(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
      });
    });

    test('hides tooltip on mouse leave', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Test tooltip content">
          <button>Hover me</button>
        </PharmaTooltip>
      );
      
      const trigger = screen.getByRole('button');
      await user.hover(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
      });
      
      await user.unhover(trigger);
      
      await waitFor(() => {
        expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
      });
    });

    test('shows tooltip on focus', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Focus tooltip">
          <button>Focus me</button>
        </PharmaTooltip>
      );
      
      const trigger = screen.getByRole('button');
      await user.click(trigger); // This will focus the button
      
      await waitFor(() => {
        expect(screen.getByText('Focus tooltip')).toBeInTheDocument();
      });
    });

    test('hides tooltip on blur', async () => {
      const { user } = renderWithProviders(
        <div>
          <PharmaTooltip content="Focus tooltip">
            <button>Focus me</button>
          </PharmaTooltip>
          <button>Other button</button>
        </div>
      );
      
      const trigger = screen.getByRole('button', { name: 'Focus me' });
      const otherButton = screen.getByRole('button', { name: 'Other button' });
      
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Focus tooltip')).toBeInTheDocument();
      });
      
      await user.click(otherButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Focus tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    test.each(Object.values(POSITIONS))('supports %s position', (position) => {
      renderWithProviders(
        <PharmaTooltip content="Positioned tooltip" position={position}>
          <button>Trigger</button>
        </PharmaTooltip>
      );
      
      // Position is typically handled via CSS classes or data attributes
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-tooltip-position', position);
    });

    test('defaults to top position', () => {
      renderWithProviders(
        <PharmaTooltip content="Default position">
          <button>Trigger</button>
        </PharmaTooltip>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-tooltip-position', 'top');
    });

    test('adjusts position based on viewport', async () => {
      // Mock getBoundingClientRect to simulate edge of viewport
      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 10,
        left: 10,
        right: window.innerWidth - 10,
        bottom: window.innerHeight - 10,
        width: 100,
        height: 40
      }));

      const { user } = renderWithProviders(
        <PharmaTooltip content="Auto-positioned tooltip" position="auto">
          <button ref={el => el && (el.getBoundingClientRect = mockGetBoundingClientRect)}>
            Edge button
          </button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Auto-positioned tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Trigger Types', () => {
    test('supports hover trigger', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Hover tooltip" trigger="hover">
          <button>Hover trigger</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Hover tooltip')).toBeInTheDocument();
      });
    });

    test('supports click trigger', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Click tooltip" trigger="click">
          <button>Click trigger</button>
        </PharmaTooltip>
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Click tooltip')).toBeInTheDocument();
      });
    });

    test('supports focus trigger', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Focus tooltip" trigger="focus">
          <input placeholder="Focus trigger" />
        </PharmaTooltip>
      );
      
      await user.click(screen.getByPlaceholderText('Focus trigger'));
      
      await waitFor(() => {
        expect(screen.getByText('Focus tooltip')).toBeInTheDocument();
      });
    });

    test('supports manual trigger', () => {
      renderWithProviders(
        <PharmaTooltip content="Manual tooltip" trigger="manual" show={true}>
          <button>Manual trigger</button>
        </PharmaTooltip>
      );
      
      expect(screen.getByText('Manual tooltip')).toBeInTheDocument();
    });
  });

  describe('Content Types', () => {
    test('renders string content', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Simple string content">
          <button>String content</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Simple string content')).toBeInTheDocument();
      });
    });

    test('renders JSX content', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip 
          content={
            <div>
              <strong>Rich Content</strong>
              <p>With multiple elements</p>
            </div>
          }
        >
          <button>Rich content</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Rich Content')).toBeInTheDocument();
        expect(screen.getByText('With multiple elements')).toBeInTheDocument();
      });
    });

    test('renders function content', async () => {
      const contentFunction = jest.fn(() => 'Dynamic content');
      const { user } = renderWithProviders(
        <PharmaTooltip content={contentFunction}>
          <button>Function content</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Dynamic content')).toBeInTheDocument();
      });
      
      expect(contentFunction).toHaveBeenCalled();
    });
  });

  describe('Tooltip Types', () => {
    test.each(Object.values(TOOLTIP_TYPES))('supports %s tooltip type', async (type) => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Typed tooltip" type={type}>
          <button>Typed tooltip</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        const tooltip = screen.getByText('Typed tooltip');
        expect(tooltip.closest('.pharma-tooltip')).toHaveClass(`tooltip-${type}`);
      });
    });
  });

  describe('Specialized Tooltip Components', () => {
    test('DrugTooltip displays drug information', async () => {
      const { user } = renderWithProviders(
        <DrugTooltip drug={mockDrugData}>
          <button>Drug info</button>
        </DrugTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Acetaminophen')).toBeInTheDocument();
        expect(screen.getByText('Tylenol')).toBeInTheDocument();
        expect(screen.getByText('500mg')).toBeInTheDocument();
        expect(screen.getByText('TABLET')).toBeInTheDocument();
      });
    });

    test('DosageTooltip shows dosage information', async () => {
      const { user } = renderWithProviders(
        <DosageTooltip 
          dosage="500mg" 
          frequency="Every 6 hours" 
          maxDaily="3000mg"
        >
          <span>Dosage info</span>
        </DosageTooltip>
      );
      
      await user.hover(screen.getByText('Dosage info'));
      
      await waitFor(() => {
        expect(screen.getByText('500mg')).toBeInTheDocument();
        expect(screen.getByText('Every 6 hours')).toBeInTheDocument();
        expect(screen.getByText(/max daily.*3000mg/i)).toBeInTheDocument();
      });
    });

    test('InteractionTooltip displays interaction warnings', async () => {
      const interactions = [
        { severity: 'major', description: 'Increases risk of liver damage' },
        { severity: 'moderate', description: 'May reduce effectiveness' }
      ];

      const { user } = renderWithProviders(
        <InteractionTooltip interactions={interactions}>
          <span className="interaction-warning">⚠️</span>
        </InteractionTooltip>
      );
      
      await user.hover(screen.getByText('⚠️'));
      
      await waitFor(() => {
        expect(screen.getByText('Increases risk of liver damage')).toBeInTheDocument();
        expect(screen.getByText('May reduce effectiveness')).toBeInTheDocument();
      });
    });

    test('InventoryTooltip shows inventory details', async () => {
      const { user } = renderWithProviders(
        <InventoryTooltip inventory={mockInventoryData}>
          <span>Inventory info</span>
        </InventoryTooltip>
      );
      
      await user.hover(screen.getByText('Inventory info'));
      
      await waitFor(() => {
        expect(screen.getByText(/quantity.*50/i)).toBeInTheDocument();
        expect(screen.getByText(/reorder.*20/i)).toBeInTheDocument();
        expect(screen.getByText(/lot.*LOT12345/i)).toBeInTheDocument();
        expect(screen.getByText(/expires.*2025-12-31/i)).toBeInTheDocument();
      });
    });

    test('HelpTooltip provides help information', async () => {
      const { user } = renderWithProviders(
        <HelpTooltip helpText="This field requires a valid NDC number in format XXXXX-XXXX-XX">
          <span>❓</span>
        </HelpTooltip>
      );
      
      await user.hover(screen.getByText('❓'));
      
      await waitFor(() => {
        expect(screen.getByText(/valid NDC number/i)).toBeInTheDocument();
      });
    });
  });

  describe('TooltipProvider and useTooltips Hook', () => {
    test('TooltipProvider manages global tooltip state', () => {
      const TestComponent = () => {
        const { tooltips, showTooltip, hideTooltip } = useTooltips();
        
        return (
          <div>
            <button onClick={() => showTooltip('test', 'Test content')}>
              Show Tooltip
            </button>
            <div data-testid="tooltip-count">{Object.keys(tooltips).length}</div>
          </div>
        );
      };

      renderWithProviders(
        <TooltipProvider>
          <TestComponent />
        </TooltipProvider>
      );
      
      expect(screen.getByTestId('tooltip-count')).toHaveTextContent('0');
    });

    test('useTooltips hook provides tooltip controls', async () => {
      const TestComponent = () => {
        const { showTooltip, hideTooltip, hideAllTooltips } = useTooltips();
        
        return (
          <div>
            <button onClick={() => showTooltip('test1', 'Content 1')}>
              Show Tooltip 1
            </button>
            <button onClick={() => showTooltip('test2', 'Content 2')}>
              Show Tooltip 2
            </button>
            <button onClick={() => hideTooltip('test1')}>
              Hide Tooltip 1
            </button>
            <button onClick={hideAllTooltips}>
              Hide All
            </button>
          </div>
        );
      };

      const { user } = renderWithProviders(
        <TooltipProvider>
          <TestComponent />
        </TooltipProvider>
      );
      
      await user.click(screen.getByText('Show Tooltip 1'));
      await user.click(screen.getByText('Show Tooltip 2'));
      
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      
      await user.click(screen.getByText('Hide Tooltip 1'));
      
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      
      await user.click(screen.getByText('Hide All'));
      
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { checkA11y } = renderForA11y(
        <PharmaTooltip content="Accessible tooltip">
          <button>Accessible button</button>
        </PharmaTooltip>
      );
      
      await checkA11y();
    });

    test('has proper ARIA attributes', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="ARIA tooltip">
          <button>ARIA button</button>
        </PharmaTooltip>
      );
      
      const trigger = screen.getByRole('button');
      
      testAriaAttributes(trigger, {
        describedby: expect.any(String)
      });
      
      await user.hover(trigger);
      
      await waitFor(() => {
        const tooltip = screen.getByText('ARIA tooltip');
        expect(tooltip).toHaveAttribute('role', 'tooltip');
        expect(tooltip).toHaveAttribute('id', trigger.getAttribute('aria-describedby'));
      });
    });

    test('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Keyboard tooltip" trigger="focus">
          <button>Keyboard button</button>
        </PharmaTooltip>
      );
      
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard tooltip')).toBeInTheDocument();
      });
      
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText('Keyboard tooltip')).not.toBeInTheDocument();
      });
    });

    test('supports escape key to close', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Escapable tooltip" trigger="click">
          <button>Click me</button>
        </PharmaTooltip>
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Escapable tooltip')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByText('Escapable tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('debounces rapid hover events', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Debounced tooltip" delay={100}>
          <button>Rapid hover</button>
        </PharmaTooltip>
      );
      
      const button = screen.getByRole('button');
      
      // Rapid hover/unhover
      await user.hover(button);
      await user.unhover(button);
      await user.hover(button);
      await user.unhover(button);
      await user.hover(button);
      
      // Should only show after delay
      expect(screen.queryByText('Debounced tooltip')).not.toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Debounced tooltip')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    test('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderWithProviders(
        <PharmaTooltip content="Cleanup tooltip">
          <button>Cleanup test</button>
        </PharmaTooltip>
      );
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing content gracefully', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="">
          <button>Empty content</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      // Should not show tooltip with empty content
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    test('handles disabled trigger elements', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Disabled tooltip">
          <button disabled>Disabled button</button>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByRole('button'));
      
      // Should still show tooltip for disabled elements
      await waitFor(() => {
        expect(screen.getByText('Disabled tooltip')).toBeInTheDocument();
      });
    });

    test('handles multiple children elements', async () => {
      const { user } = renderWithProviders(
        <PharmaTooltip content="Multi-child tooltip">
          <div>
            <span>Child 1</span>
            <span>Child 2</span>
          </div>
        </PharmaTooltip>
      );
      
      await user.hover(screen.getByText('Child 1'));
      
      await waitFor(() => {
        expect(screen.getByText('Multi-child tooltip')).toBeInTheDocument();
      });
    });
  });
});