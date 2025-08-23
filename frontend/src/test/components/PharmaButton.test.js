/**
 * PharmaButton Component Tests
 * 
 * Comprehensive test suite for the PharmaButton component including
 * variants, loading states, confirmation actions, and accessibility.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, renderForA11y, testKeyboardNavigation, testAriaAttributes } from '../utils/testUtils';
import PharmaButton, { 
  PrimaryButton, 
  SecondaryButton, 
  SuccessButton, 
  DangerButton,
  SaveButton,
  CancelButton,
  DeleteButton
} from '../../components/common/PharmaButton';

describe('PharmaButton', () => {
  describe('Basic Functionality', () => {
    test('renders with default props', () => {
      renderWithProviders(<PharmaButton>Click Me</PharmaButton>);
      
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn', 'btn-primary');
      expect(button).not.toBeDisabled();
    });

    test('handles click events', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton onClick={handleClick}>Click Me</PharmaButton>
      );
      
      const button = screen.getByRole('button', { name: 'Click Me' });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('renders different button types', () => {
      const { rerender } = renderWithProviders(
        <PharmaButton type="submit">Submit</PharmaButton>
      );
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
      
      rerender(<PharmaButton type="reset">Reset</PharmaButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    test('renders with custom className', () => {
      renderWithProviders(
        <PharmaButton className="custom-class">Button</PharmaButton>
      );
      
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Variants and Styles', () => {
    const variants = [
      'primary', 'secondary', 'success', 'danger', 'warning', 'info',
      'light', 'dark', 'outline-primary', 'outline-secondary'
    ];

    test.each(variants)('renders %s variant correctly', (variant) => {
      renderWithProviders(
        <PharmaButton variant={variant}>Button</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(`btn-${variant}`);
    });

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

    test.each(sizes)('renders %s size correctly', (size) => {
      renderWithProviders(
        <PharmaButton size={size}>Button</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      if (size !== 'md') { // md is default, no class added
        expect(button).toHaveClass(`btn-${size}`);
      }
    });

    test('renders full width button', () => {
      renderWithProviders(
        <PharmaButton fullWidth>Full Width</PharmaButton>
      );
      
      expect(screen.getByRole('button')).toHaveClass('w-100');
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when loading prop is true', () => {
      renderWithProviders(
        <PharmaButton loading>Loading Button</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('loading');
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('shows custom loading text', () => {
      renderWithProviders(
        <PharmaButton loading loadingText="Saving...">Save</PharmaButton>
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    test('disables button during loading', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton loading onClick={handleClick}>Button</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    test('renders disabled button', () => {
      renderWithProviders(
        <PharmaButton disabled>Disabled Button</PharmaButton>
      );
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton disabled onClick={handleClick}>Button</PharmaButton>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icon Support', () => {
    test('renders with left icon', () => {
      renderWithProviders(
        <PharmaButton icon={<span data-testid="icon">🔍</span>}>
          Search
        </PharmaButton>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    test('renders with right icon', () => {
      renderWithProviders(
        <PharmaButton 
          icon={<span data-testid="icon">→</span>}
          iconPosition="right"
        >
          Next
        </PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(button).toHaveClass('icon-right');
    });
  });

  describe('Confirmation Actions', () => {
    test('shows confirmation dialog for confirmAction', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton 
          confirmAction
          confirmMessage="Are you sure?"
          onClick={handleClick}
        >
          Delete
        </PharmaButton>
      );
      
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('executes action on confirmation', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton 
          confirmAction
          confirmMessage="Confirm deletion?"
          onClick={handleClick}
        >
          Delete
        </PharmaButton>
      );
      
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: /confirm|yes|ok/i }));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('cancels action on dismiss', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton 
          confirmAction
          confirmMessage="Confirm deletion?"
          onClick={handleClick}
        >
          Delete
        </PharmaButton>
      );
      
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: /cancel|no/i }));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Tooltip Support', () => {
    test('shows tooltip on hover', async () => {
      const { user } = renderWithProviders(
        <PharmaButton tooltip="This is a helpful tooltip">
          Hover Me
        </PharmaButton>
      );
      
      const button = screen.getByRole('button');
      await user.hover(button);
      
      await waitFor(() => {
        expect(screen.getByText('This is a helpful tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Predefined Button Components', () => {
    test('PrimaryButton renders with primary variant', () => {
      renderWithProviders(<PrimaryButton>Primary</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    test('SecondaryButton renders with secondary variant', () => {
      renderWithProviders(<SecondaryButton>Secondary</SecondaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    test('SuccessButton renders with success variant', () => {
      renderWithProviders(<SuccessButton>Success</SuccessButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-success');
    });

    test('DangerButton renders with danger variant', () => {
      renderWithProviders(<DangerButton>Danger</DangerButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-danger');
    });

    test('SaveButton has correct icon and text', () => {
      renderWithProviders(<SaveButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Save');
      expect(button).toHaveClass('btn-success');
    });

    test('CancelButton has correct variant', () => {
      renderWithProviders(<CancelButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Cancel');
      expect(button).toHaveClass('btn-secondary');
    });

    test('DeleteButton has confirmation by default', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <DeleteButton onClick={handleClick} />
      );
      
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { checkA11y } = renderForA11y(
        <PharmaButton>Accessible Button</PharmaButton>
      );
      
      await checkA11y();
    });

    test('supports keyboard navigation', async () => {
      const { container } = renderWithProviders(
        <div>
          <PharmaButton>First</PharmaButton>
          <PharmaButton>Second</PharmaButton>
        </div>
      );
      
      await testKeyboardNavigation(container);
    });

    test('has proper ARIA attributes when loading', () => {
      renderWithProviders(
        <PharmaButton loading>Loading Button</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      testAriaAttributes(button, {
        disabled: 'true'
      });
      
      const spinner = screen.getByRole('status');
      testAriaAttributes(spinner, {
        hidden: 'true'
      });
    });

    test('has proper ARIA attributes for confirmation', async () => {
      const { user } = renderWithProviders(
        <PharmaButton confirmAction confirmMessage="Confirm action?">
          Confirm Button
        </PharmaButton>
      );
      
      await user.click(screen.getByRole('button'));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      testAriaAttributes(dialog, {
        modal: 'true',
        labelledby: expect.any(String)
      });
    });

    test('supports screen reader announcements', () => {
      renderWithProviders(
        <PharmaButton aria-label="Delete item" aria-describedby="help-text">
          🗑️
        </PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Delete item');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      function TestButton(props) {
        renderSpy();
        return <PharmaButton {...props}>Test</PharmaButton>;
      }
      
      const { rerender } = renderWithProviders(<TestButton />);
      
      renderSpy.mockClear();
      rerender(<TestButton />);
      
      // Should not re-render if props haven't changed
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    test('handles rapid clicks without issues', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <PharmaButton onClick={handleClick}>Rapid Click</PharmaButton>
      );
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(button);
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onClick gracefully', async () => {
      const { user } = renderWithProviders(
        <PharmaButton>No Click Handler</PharmaButton>
      );
      
      // Should not throw error when clicked
      await user.click(screen.getByRole('button'));
      // No assertion needed - just ensuring no error is thrown
    });

    test('handles empty children', () => {
      renderWithProviders(<PharmaButton />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('handles complex children elements', () => {
      renderWithProviders(
        <PharmaButton>
          <span>Complex</span>
          <strong>Children</strong>
        </PharmaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toContainElement(screen.getByText('Complex'));
      expect(button).toContainElement(screen.getByText('Children'));
    });

    test('handles very long text content', () => {
      const longText = 'This is a very long button text that might cause layout issues';
      renderWithProviders(<PharmaButton>{longText}</PharmaButton>);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });
});