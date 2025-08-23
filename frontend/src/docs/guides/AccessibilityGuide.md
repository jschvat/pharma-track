# Accessibility Guide

PharmaTraK components are built with accessibility as a core principle, ensuring that pharmacy management systems are usable by everyone, including users with disabilities.

## WCAG 2.1 AA Compliance

All PharmaTraK components meet or exceed WCAG 2.1 AA standards, providing:

- **Perceivable**: Information is presented in ways users can perceive
- **Operable**: Interface components are operable by all users
- **Understandable**: Information and UI operation is understandable
- **Robust**: Content is robust enough for various assistive technologies

## Key Accessibility Features

### 🎯 Focus Management

#### Keyboard Navigation
All components support comprehensive keyboard navigation:

```jsx
// Automatic focus management in modals
<PharmaModal show={showModal} onHide={closeModal} title="Edit Patient">
  <PharmaForm>
    {/* Focus automatically moves to first input */}
    <PharmaFormGroup label="Patient Name" name="name" autoFocus />
    <PharmaFormGroup label="Phone" name="phone" />
    
    {/* Tab order is maintained */}
    <PharmaButton type="submit">Save</PharmaButton>
    <PharmaButton type="button" onClick={closeModal}>Cancel</PharmaButton>
  </PharmaForm>
</PharmaModal>
```

#### Focus Indicators
Clear visual focus indicators for all interactive elements:

```css
/* Built-in focus styles */
.pharma-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.pharma-form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
```

### 🔊 Screen Reader Support

#### Semantic HTML
All components use proper semantic markup:

```jsx
// Proper table structure for inventory data
<PharmaTable
  data={inventory}
  columns={columns}
  caption="Current pharmacy inventory with 150 items"
  summary="Table showing medication name, NDC, quantity, and expiration dates"
/>

// Renders as:
<table role="table" aria-label="Current pharmacy inventory">
  <caption>Current pharmacy inventory with 150 items</caption>
  <thead>
    <tr role="row">
      <th role="columnheader" aria-sort="ascending">Medication</th>
      <th role="columnheader">NDC</th>
      <th role="columnheader">Quantity</th>
    </tr>
  </thead>
  <tbody>
    {/* Table rows with proper ARIA attributes */}
  </tbody>
</table>
```

#### ARIA Labels and Descriptions
Comprehensive ARIA attribute support:

```jsx
function AccessiblePrescriptionForm() {
  return (
    <PharmaForm
      aria-label="New prescription form"
      aria-describedby="form-instructions"
    >
      <div id="form-instructions" className="sr-only">
        Complete all required fields to create a new prescription
      </div>
      
      <PharmaFormGroup
        label="Patient"
        name="patient_id"
        required
        aria-describedby="patient-help"
        aria-invalid={hasPatientError}
        aria-errormessage={hasPatientError ? "patient-error" : undefined}
      />
      
      {hasPatientError && (
        <div id="patient-error" role="alert" className="error-message">
          Please select a valid patient
        </div>
      )}
      
      <PharmaFormGroup
        label="Medication"
        name="drug_id"
        required
        aria-describedby="drug-help"
      >
        <div id="drug-help" className="form-help">
          Search by medication name, NDC, or generic name
        </div>
      </PharmaFormGroup>
    </PharmaForm>
  );
}
```

#### Live Regions
Dynamic content updates are announced to screen readers:

```jsx
function PrescriptionStatus({ prescription }) {
  const [status, setStatus] = useState(prescription.status);
  
  return (
    <div>
      <h3>Prescription Status</h3>
      
      {/* Status updates are announced */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="prescription-status"
      >
        Prescription #{prescription.rx_number} is {status}
      </div>
      
      <PharmaButton
        onClick={() => updateStatus('filled')}
        aria-describedby="fill-description"
      >
        Mark as Filled
      </PharmaButton>
      
      <div id="fill-description" className="sr-only">
        This will mark the prescription as filled and update inventory
      </div>
    </div>
  );
}
```

### 🎨 Visual Design

#### Color Contrast
All color combinations meet WCAG AA contrast requirements:

```css
/* High contrast color palette */
:root {
  --pharma-primary: #0056b3;      /* 4.5:1 contrast ratio */
  --pharma-success: #155724;      /* 7.5:1 contrast ratio */
  --pharma-danger: #721c24;       /* 8.2:1 contrast ratio */
  --pharma-warning: #856404;      /* 4.6:1 contrast ratio */
}

/* Status indicators with multiple cues */
.status-filled {
  background-color: var(--pharma-success);
  color: white;
}

.status-filled::before {
  content: "✓ ";  /* Visual indicator */
}

.status-pending {
  background-color: var(--pharma-warning);
  color: var(--gray-900);
  border-left: 4px solid var(--pharma-warning); /* Additional visual cue */
}
```

#### Text Sizing and Spacing
Flexible text sizing and adequate spacing:

```css
/* Responsive font sizes */
.pharma-text-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.pharma-text-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.pharma-text-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }

/* Adequate spacing for touch targets */
.pharma-button {
  min-height: 44px;  /* WCAG minimum touch target */
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  margin: 0.25rem;   /* Adequate spacing between buttons */
}
```

### ⌨️ Keyboard Navigation Patterns

#### Table Navigation
Full keyboard navigation for data tables:

```jsx
function AccessibleInventoryTable() {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        // Move to next row
        event.preventDefault();
        setFocusedCell(prev => ({ 
          ...prev, 
          row: Math.min(prev.row + 1, data.length - 1) 
        }));
        break;
        
      case 'ArrowUp':
        // Move to previous row
        event.preventDefault();
        setFocusedCell(prev => ({ 
          ...prev, 
          row: Math.max(prev.row - 1, 0) 
        }));
        break;
        
      case 'ArrowRight':
        // Move to next column
        event.preventDefault();
        setFocusedCell(prev => ({ 
          ...prev, 
          col: Math.min(prev.col + 1, columns.length - 1) 
        }));
        break;
        
      case 'ArrowLeft':
        // Move to previous column
        event.preventDefault();
        setFocusedCell(prev => ({ 
          ...prev, 
          col: Math.max(prev.col - 1, 0) 
        }));
        break;
        
      case 'Enter':
      case ' ':
        // Activate focused cell action
        event.preventDefault();
        activateCell(focusedCell.row, focusedCell.col);
        break;
    }
  };
  
  return (
    <PharmaTable
      data={inventory}
      columns={columns}
      onKeyDown={handleKeyDown}
      focusedCell={focusedCell}
      role="grid"
      aria-label="Pharmacy inventory table"
      aria-rowcount={inventory.length}
      aria-colcount={columns.length}
    />
  );
}
```

#### Modal Navigation
Proper focus trapping in modals:

```jsx
function AccessibleModal({ show, onHide, children }) {
  const modalRef = useRef(null);
  const [focusableElements, setFocusableElements] = useState([]);
  
  useEffect(() => {
    if (show && modalRef.current) {
      // Get all focusable elements
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      setFocusableElements(Array.from(focusable));
      
      // Focus first element
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [show]);
  
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    } else if (event.key === 'Escape') {
      onHide();
    }
  };
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
      className="pharma-modal"
    >
      {children}
    </div>
  );
}
```

### 📱 Mobile Accessibility

#### Touch Targets
Adequate touch target sizes for mobile devices:

```jsx
function MobileAccessibleButton({ children, ...props }) {
  return (
    <PharmaButton
      {...props}
      style={{
        minHeight: '44px',      // iOS minimum
        minWidth: '44px',       // iOS minimum
        padding: '12px 16px',   // Adequate padding
        fontSize: '16px',       // Prevents zoom on iOS
        ...props.style
      }}
    >
      {children}
    </PharmaButton>
  );
}
```

#### Responsive Labels
Labels that adapt to screen size:

```jsx
function ResponsiveFormGroup({ label, shortLabel, ...props }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <PharmaFormGroup
      label={isMobile && shortLabel ? shortLabel : label}
      {...props}
    />
  );
}

// Usage
<ResponsiveFormGroup
  label="Prescription Directions"
  shortLabel="Directions"
  name="sig"
  fieldType="textarea"
/>
```

## Testing for Accessibility

### Automated Testing
Use jest-axe for automated accessibility testing:

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PharmaButton } from '@pharmatrak/component-library';

expect.extend(toHaveNoViolations);

describe('PharmaButton Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(
      <PharmaButton variant="primary">Click me</PharmaButton>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('should be keyboard accessible', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <PharmaButton onClick={handleClick}>Click me</PharmaButton>
    );
    
    const button = getByRole('button');
    
    // Should be focusable
    button.focus();
    expect(button).toHaveFocus();
    
    // Should activate on Enter
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
    
    // Should activate on Space
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
```

### Screen Reader Testing
Test with actual screen readers:

```jsx
// Testing utilities for screen reader announcements
export const waitForAnnouncement = (text, timeout = 5000) => {
  return waitFor(
    () => {
      const liveRegions = screen.getAllByRole('status');
      const announcements = liveRegions.map(region => region.textContent);
      expect(announcements.some(announcement => 
        announcement.includes(text)
      )).toBe(true);
    },
    { timeout }
  );
};

// Example test
test('announces prescription status changes', async () => {
  render(<PrescriptionManager prescription={mockPrescription} />);
  
  const fillButton = screen.getByRole('button', { name: /fill prescription/i });
  fireEvent.click(fillButton);
  
  await waitForAnnouncement('Prescription has been filled');
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are reachable with Tab
- [ ] Tab order follows logical sequence
- [ ] Shift+Tab moves in reverse order
- [ ] Enter and Space activate buttons and links
- [ ] Arrow keys navigate within component groups
- [ ] Escape closes modals and dropdowns

#### Screen Reader Testing
- [ ] All content is readable by screen reader
- [ ] Headings create logical document outline
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Status changes are announced
- [ ] Required fields are identified

#### Visual Testing
- [ ] Focus indicators are clearly visible
- [ ] Color is not the only way to convey information
- [ ] Text meets contrast requirements
- [ ] Content is readable at 200% zoom
- [ ] UI remains functional at 400% zoom

## Common Accessibility Patterns

### Error Handling
Accessible error messages and validation:

```jsx
function AccessibleFormField({ name, label, validation, ...props }) {
  const [error, setError] = useState('');
  const [hasError, setHasError] = useState(false);
  
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  
  return (
    <div className="form-group">
      <label htmlFor={fieldId} className={hasError ? 'error' : ''}>
        {label}
        {props.required && <span aria-label="required">*</span>}
      </label>
      
      <input
        id={fieldId}
        name={name}
        aria-describedby={`${helpId} ${hasError ? errorId : ''}`}
        aria-invalid={hasError}
        aria-required={props.required}
        {...props}
      />
      
      {props.helpText && (
        <div id={helpId} className="form-help">
          {props.helpText}
        </div>
      )}
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="error-message"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

### Data Tables
Accessible data presentation:

```jsx
function AccessibleDataTable({ data, columns, caption }) {
  return (
    <table role="table" aria-label={caption}>
      <caption className="sr-only">{caption}</caption>
      
      <thead>
        <tr role="row">
          {columns.map((column, index) => (
            <th
              key={column.key}
              role="columnheader"
              aria-sort={column.sortDirection || 'none'}
              tabIndex={column.sortable ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (column.sortable) {
                    handleSort(column.key);
                  }
                }
              }}
            >
              {column.label}
              {column.sortable && (
                <span aria-hidden="true" className="sort-indicator">
                  {column.sortDirection === 'asc' ? ' ↑' : 
                   column.sortDirection === 'desc' ? ' ↓' : ' ↕'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id} role="row">
            {columns.map((column, colIndex) => (
              <td
                key={`${row.id}-${column.key}`}
                role={colIndex === 0 ? 'rowheader' : 'gridcell'}
              >
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Loading States
Accessible loading indicators:

```jsx
function AccessibleLoadingButton({ loading, children, ...props }) {
  return (
    <PharmaButton
      {...props}
      disabled={loading || props.disabled}
      aria-describedby={loading ? 'loading-status' : undefined}
    >
      {loading && (
        <span
          id="loading-status"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          Loading, please wait
        </span>
      )}
      
      {loading && (
        <span aria-hidden="true" className="spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </span>
      )}
      
      <span className={loading ? 'visually-hidden' : ''}>
        {children}
      </span>
    </PharmaButton>
  );
}
```

## Pharmacy-Specific Accessibility

### Medical Data Presentation
Ensure critical medical information is accessible:

```jsx
function AccessibleDrugInformation({ drug }) {
  return (
    <div className="drug-info" role="region" aria-labelledby="drug-title">
      <h3 id="drug-title">
        {drug.generic_name}
        {drug.brand_name && (
          <span className="brand-name"> ({drug.brand_name})</span>
        )}
      </h3>
      
      {/* Critical information announced to screen readers */}
      <div className="drug-details">
        <div>
          <span className="label">NDC:</span>
          <span className="value" aria-label={`NDC ${drug.ndc.replace(/-/g, ' ')}`}>
            {drug.ndc}
          </span>
        </div>
        
        <div>
          <span className="label">Strength:</span>
          <span className="value">{drug.strength}</span>
        </div>
        
        {drug.dea_schedule && (
          <div className="controlled-substance" role="alert">
            <span className="label">DEA Schedule:</span>
            <span className="value">{drug.dea_schedule}</span>
            <span className="sr-only">This is a controlled substance</span>
          </div>
        )}
      </div>
      
      {/* Warnings prominently announced */}
      {drug.warnings && drug.warnings.length > 0 && (
        <div className="warnings" role="region" aria-labelledby="warnings-title">
          <h4 id="warnings-title">Important Warnings</h4>
          <ul role="list">
            {drug.warnings.map((warning, index) => (
              <li key={index} role="listitem">
                <span className="sr-only">Warning:</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Prescription Directions
Make prescription directions clear and accessible:

```jsx
function AccessiblePrescriptionDirections({ sig }) {
  // Parse and format directions for better accessibility
  const formatDirections = (directions) => {
    return directions
      .replace(/\b(\d+)\b/g, (match) => `${match}`) // Emphasize numbers
      .replace(/\b(daily|twice daily|three times daily)\b/gi, (match) => 
        match.toLowerCase()
      );
  };
  
  return (
    <div className="prescription-directions" role="region" aria-labelledby="directions-title">
      <h4 id="directions-title">Prescription Directions</h4>
      
      <div
        className="directions-text"
        aria-label="Prescription directions"
        role="text"
      >
        {formatDirections(sig)}
      </div>
      
      {/* Provide audio reading option for complex directions */}
      <PharmaButton
        variant="outline-info"
        size="sm"
        onClick={() => speakDirections(sig)}
        aria-label="Read directions aloud"
      >
        <i className="fas fa-volume-up" aria-hidden="true"></i>
        Read Aloud
      </PharmaButton>
    </div>
  );
}
```

## Resources and Tools

### Testing Tools
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in Chrome accessibility audit
- **Screen readers**: NVDA (free), JAWS, VoiceOver

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Validation
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)

By following these accessibility guidelines, PharmaTraK ensures that pharmacy management systems are usable by all healthcare professionals, regardless of their abilities or the assistive technologies they use.