# Accessibility Testing Guide

Comprehensive guide for testing accessibility in PharmaTraK components and ensuring WCAG 2.1 AA compliance.

## Overview

PharmaTraK includes a complete accessibility testing suite that validates components against WCAG 2.1 AA standards with pharmacy-specific requirements.

## Testing Tools

### 1. Automated Testing with jest-axe

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PharmaButton } from '../components/common/PharmaButton';

expect.extend(toHaveNoViolations);

test('PharmaButton should not have accessibility violations', async () => {
  const { container } = render(
    <PharmaButton variant="primary">Save Changes</PharmaButton>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Keyboard Navigation Testing

```javascript
import userEvent from '@testing-library/user-event';

test('component should be keyboard accessible', async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();
  
  render(<PharmaButton onClick={handleClick}>Click me</PharmaButton>);
  
  const button = screen.getByRole('button');
  
  // Test tab navigation
  await user.tab();
  expect(button).toHaveFocus();
  
  // Test Enter key activation
  await user.keyboard('{Enter}');
  expect(handleClick).toHaveBeenCalled();
});
```

### 3. Screen Reader Testing

```javascript
test('should announce status changes', async () => {
  render(<StatusComponent status="loading" />);
  
  // Check for proper ARIA live region
  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  expect(liveRegion).toHaveTextContent('Loading...');
});
```

## Running Tests

### Command Line Testing

```bash
# Run all accessibility tests
npm run test:accessibility

# Run with coverage
npm run test:coverage

# Run comprehensive audit
npm run accessibility:audit

# Run audit script
./src/tools/run-accessibility-audit.sh
```

### Continuous Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run accessibility tests
      run: npm run test:accessibility
    
    - name: Run accessibility audit
      run: npm run accessibility:audit
    
    - name: Upload accessibility reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: accessibility-reports
        path: build/accessibility/
```

## Testing Categories

### 1. ARIA Implementation

```javascript
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
```

### 2. Focus Management

```javascript
test('should trap focus in modal', async () => {
  const user = userEvent.setup();
  
  render(
    <PharmaModal show={true} onHide={() => {}}>
      <input type="text" placeholder="First" />
      <input type="text" placeholder="Second" />
      <button>Close</button>
    </PharmaModal>
  );
  
  const firstInput = screen.getByPlaceholderText('First');
  const closeButton = screen.getByRole('button', { name: /close/i });
  
  // First input should have initial focus
  expect(firstInput).toHaveFocus();
  
  // Tab should cycle through modal elements
  await user.tab();
  await user.tab();
  expect(closeButton).toHaveFocus();
  
  // Tab should wrap back to first input
  await user.tab();
  expect(firstInput).toHaveFocus();
});
```

### 3. Form Accessibility

```javascript
test('should associate labels with form controls', () => {
  render(
    <PharmaForm>
      <label htmlFor="patient-name">Patient Name</label>
      <input id="patient-name" type="text" required />
    </PharmaForm>
  );
  
  const input = screen.getByLabelText('Patient Name');
  expect(input).toBeRequired();
  expect(input).toHaveAttribute('id', 'patient-name');
});

test('should announce validation errors', async () => {
  const user = userEvent.setup();
  
  render(
    <PharmaForm validationRules={{ email: [{ type: 'required', message: 'Email required' }] }}>
      <input name="email" type="email" />
      <button type="submit">Submit</button>
    </PharmaForm>
  );
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  const errorMessage = await screen.findByRole('alert');
  expect(errorMessage).toHaveTextContent('Email required');
});
```

### 4. Color and Contrast

```javascript
test('should not rely solely on color', () => {
  render(
    <StatusIndicator status="error">
      <span aria-hidden="true">❌</span>
      <span className="sr-only">Error: </span>
      Operation failed
    </StatusIndicator>
  );
  
  // Visual indicator and text both present
  expect(screen.getByText('❌')).toBeInTheDocument();
  expect(screen.getByText('Error:')).toHaveClass('sr-only');
  expect(screen.getByText('Operation failed')).toBeInTheDocument();
});
```

## Pharmacy-Specific Testing

### Drug Information Accessibility

```javascript
test('should make drug information accessible', () => {
  render(
    <DrugInfo drug={{
      ndc: '12345-678-90',
      name: 'Amoxicillin 500mg',
      warnings: ['Take with food']
    }} />
  );
  
  // NDC should be announced properly
  const ndcElement = screen.getByText('12345-678-90');
  expect(ndcElement).toHaveAttribute('aria-label', 'NDC 12345 678 90');
  
  // Warnings should be announced
  const warning = screen.getByRole('alert');
  expect(warning).toHaveTextContent('Take with food');
});
```

### Prescription Directions

```javascript
test('should make prescription directions accessible', () => {
  render(
    <PrescriptionDirections sig="Take 1 tablet by mouth twice daily" />
  );
  
  const directions = screen.getByRole('text');
  expect(directions).toHaveAttribute('aria-label', 'Prescription directions');
  expect(directions).toHaveTextContent('Take 1 tablet by mouth twice daily');
});
```

### Controlled Substance Warnings

```javascript
test('should announce controlled substance warnings', () => {
  render(
    <ControlledSubstanceWarning deaSchedule="II" />
  );
  
  const warning = screen.getByRole('alert');
  expect(warning).toBeInTheDocument();
  expect(screen.getByText('This is a controlled substance.')).toHaveClass('sr-only');
});
```

## Mobile Accessibility Testing

### Touch Target Size

```javascript
test('should have adequate touch targets', () => {
  render(<MobileButton>Touch Me</MobileButton>);
  
  const button = screen.getByRole('button');
  const styles = window.getComputedStyle(button);
  
  expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
});
```

### Responsive Labels

```javascript
test('should adapt labels for mobile', () => {
  // Mock mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 320,
  });
  
  render(
    <ResponsiveFormGroup 
      label="Prescription Directions" 
      shortLabel="Directions" 
    />
  );
  
  expect(screen.getByLabelText('Directions')).toBeInTheDocument();
});
```

## Performance Testing

### Large Data Sets

```javascript
test('should handle large inventory tables accessibly', async () => {
  const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Drug ${i}`,
    ndc: `${i}${i}${i}${i}${i}-${i}${i}${i}-${i}${i}`
  }));
  
  const { container } = render(
    <PharmaTable 
      data={largeDataSet} 
      columns={columns}
      virtualized={true}
    />
  );
  
  // Should not have accessibility violations even with large data
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  
  // Should maintain keyboard navigation
  const firstCell = screen.getAllByRole('gridcell')[0];
  firstCell.focus();
  expect(firstCell).toHaveFocus();
});
```

## Testing Utilities

### Custom Matchers

```javascript
// Custom Jest matchers for accessibility
expect.extend({
  toBeAccessible: async (received) => {
    const results = await axe(received);
    const pass = results.violations.length === 0;
    
    return {
      pass,
      message: () => pass 
        ? 'Element is accessible'
        : `Element has ${results.violations.length} accessibility violations`
    };
  },
  
  toHaveProperFocus: (received) => {
    const hasFocus = document.activeElement === received;
    const hasVisibleFocus = window.getComputedStyle(received, ':focus').outline !== 'none';
    
    return {
      pass: hasFocus && hasVisibleFocus,
      message: () => 'Element should have proper focus management'
    };
  }
});
```

### Test Helpers

```javascript
export const accessibilityTestHelpers = {
  // Wait for screen reader announcement
  waitForAnnouncement: async (text, timeout = 5000) => {
    return waitFor(() => {
      const liveRegions = screen.getAllByRole('status');
      const alerts = screen.getAllByRole('alert');
      const allRegions = [...liveRegions, ...alerts];
      
      const hasAnnouncement = allRegions.some(region => 
        region.textContent.includes(text)
      );
      
      expect(hasAnnouncement).toBe(true);
    }, { timeout });
  },
  
  // Check focus order
  checkFocusOrder: async (expectedOrder) => {
    const user = userEvent.setup();
    
    for (const selector of expectedOrder) {
      await user.tab();
      const expectedElement = document.querySelector(selector);
      expect(expectedElement).toHaveFocus();
    }
  },
  
  // Simulate screen reader navigation
  simulateScreenReaderNavigation: async (startElement) => {
    const focusableElements = getFocusableElements(startElement);
    const announcements = [];
    
    for (const element of focusableElements) {
      element.focus();
      const announcement = getElementAnnouncement(element);
      announcements.push(announcement);
    }
    
    return announcements;
  }
};
```

## Debugging Accessibility Issues

### Using Browser DevTools

```javascript
// Add debugging helpers for development
if (process.env.NODE_ENV === 'development') {
  window.debugA11y = {
    // Highlight focusable elements
    highlightFocusable: () => {
      const focusable = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable.forEach(el => {
        el.style.outline = '2px solid red';
      });
    },
    
    // Show ARIA attributes
    showAria: () => {
      const elements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
      elements.forEach(el => {
        const ariaInfo = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('aria-') || attr.name === 'role')
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');
        
        console.log(el, ariaInfo);
      });
    }
  };
}
```

### Accessibility Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] ARIA attributes are properly implemented
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Status changes are announced
- [ ] Color is not the only way to convey information
- [ ] Text meets contrast requirements
- [ ] Touch targets are at least 44px
- [ ] Content is readable with screen readers
- [ ] Pharmacy-specific information is properly announced

## Best Practices

1. **Test Early and Often**: Include accessibility tests in your development workflow
2. **Use Real Assistive Technology**: Test with actual screen readers when possible
3. **Test with Users**: Include users with disabilities in your testing process
4. **Automate Where Possible**: Use automated tools but don't rely on them exclusively
5. **Document Issues**: Track accessibility issues and fixes in your project management system

## Resources

- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Testing Library Accessibility](https://testing-library.com/docs/guide-accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Testing Guidelines](https://webaim.org/articles/)