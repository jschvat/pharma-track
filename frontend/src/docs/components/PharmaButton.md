# PharmaButton

Interactive buttons with pharmacy-specific actions, confirmation dialogs, and accessibility features.

## Features

- **Multiple Variants**: Primary, secondary, success, danger, warning, info, light, dark
- **Loading States**: Built-in spinner and loading text support
- **Confirmation Actions**: Optional confirmation dialogs for destructive actions
- **Icon Support**: Left or right icon positioning
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive**: Adaptive sizing for mobile and desktop

## Basic Usage

```jsx
import { PharmaButton } from '@pharmatrak/component-library';

function BasicExample() {
  return (
    <div>
      <PharmaButton variant="primary">
        Primary Button
      </PharmaButton>
      
      <PharmaButton variant="success" onClick={() => console.log('Clicked!')}>
        Success Button
      </PharmaButton>
      
      <PharmaButton variant="danger" disabled>
        Disabled Button
      </PharmaButton>
    </div>
  );
}
```

## Variants

```jsx
function VariantExample() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <PharmaButton variant="primary">Primary</PharmaButton>
      <PharmaButton variant="secondary">Secondary</PharmaButton>
      <PharmaButton variant="success">Success</PharmaButton>
      <PharmaButton variant="danger">Danger</PharmaButton>
      <PharmaButton variant="warning">Warning</PharmaButton>
      <PharmaButton variant="info">Info</PharmaButton>
      <PharmaButton variant="light">Light</PharmaButton>
      <PharmaButton variant="dark">Dark</PharmaButton>
    </div>
  );
}
```

## Sizes

```jsx
function SizeExample() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <PharmaButton size="xs">Extra Small</PharmaButton>
      <PharmaButton size="sm">Small</PharmaButton>
      <PharmaButton size="md">Medium</PharmaButton>
      <PharmaButton size="lg">Large</PharmaButton>
      <PharmaButton size="xl">Extra Large</PharmaButton>
    </div>
  );
}
```

## Loading States

```jsx
function LoadingExample() {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };
  
  return (
    <div>
      <PharmaButton 
        loading={loading}
        loadingText="Saving..."
        onClick={handleClick}
      >
        Save Changes
      </PharmaButton>
      
      <PharmaButton loading variant="success">
        Processing...
      </PharmaButton>
    </div>
  );
}
```

## Icons

```jsx
function IconExample() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <PharmaButton 
        icon={<i className="fas fa-save" />}
        variant="success"
      >
        Save
      </PharmaButton>
      
      <PharmaButton 
        icon={<i className="fas fa-trash" />}
        iconPosition="left"
        variant="danger"
      >
        Delete
      </PharmaButton>
      
      <PharmaButton 
        icon={<i className="fas fa-arrow-right" />}
        iconPosition="right"
        variant="primary"
      >
        Next
      </PharmaButton>
    </div>
  );
}
```

## Confirmation Actions

```jsx
function ConfirmationExample() {
  const handleDelete = () => {
    console.log('Item deleted!');
  };
  
  return (
    <div>
      <PharmaButton
        variant="danger"
        confirmAction
        confirmMessage="Are you sure you want to delete this medication?"
        onClick={handleDelete}
      >
        Delete Medication
      </PharmaButton>
      
      <PharmaButton
        variant="warning"
        confirmAction
        confirmMessage="This will remove all inventory for this drug. Continue?"
        onClick={() => console.log('Confirmed!')}
      >
        Remove from Inventory
      </PharmaButton>
    </div>
  );
}
```

## Predefined Buttons

```jsx
import { 
  SaveButton, 
  CancelButton, 
  DeleteButton,
  PrimaryButton,
  SecondaryButton 
} from '@pharmatrak/component-library';

function PredefinedExample() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <SaveButton onClick={() => console.log('Saved!')} />
      <CancelButton onClick={() => console.log('Cancelled!')} />
      <DeleteButton onClick={() => console.log('Deleted!')} />
      
      <PrimaryButton>Custom Primary</PrimaryButton>
      <SecondaryButton>Custom Secondary</SecondaryButton>
    </div>
  );
}
```

## Pharmacy-Specific Use Cases

### Prescription Actions

```jsx
function PrescriptionActions({ prescription }) {
  const handleFill = async () => {
    // Fill prescription logic
  };
  
  const handleReturn = async () => {
    // Return to stock logic
  };
  
  return (
    <div className="prescription-actions">
      <PharmaButton
        variant="success"
        icon={<i className="fas fa-pills" />}
        onClick={handleFill}
        loading={prescription.filling}
        loadingText="Filling..."
      >
        Fill Prescription
      </PharmaButton>
      
      <PharmaButton
        variant="warning"
        confirmAction
        confirmMessage="Return this prescription to stock?"
        onClick={handleReturn}
      >
        Return to Stock
      </PharmaButton>
      
      <PharmaButton
        variant="info"
        onClick={() => printLabel(prescription)}
      >
        Print Label
      </PharmaButton>
    </div>
  );
}
```

### Inventory Management

```jsx
function InventoryActions({ item }) {
  return (
    <div className="inventory-actions">
      <PharmaButton
        size="sm"
        variant="primary"
        onClick={() => editInventory(item.id)}
      >
        Edit
      </PharmaButton>
      
      <PharmaButton
        size="sm"
        variant="warning"
        onClick={() => adjustQuantity(item.id)}
      >
        Adjust Qty
      </PharmaButton>
      
      <PharmaButton
        size="sm"
        variant="danger"
        confirmAction
        confirmMessage={`Remove ${item.name} from inventory?`}
        onClick={() => removeInventory(item.id)}
      >
        Remove
      </PharmaButton>
    </div>
  );
}
```

## Accessibility Features

### Keyboard Navigation

```jsx
function AccessibilityExample() {
  return (
    <div>
      <PharmaButton
        aria-label="Save prescription changes"
        aria-describedby="save-help"
      >
        Save
      </PharmaButton>
      <div id="save-help" className="sr-only">
        Saves all changes to the prescription
      </div>
      
      <PharmaButton
        aria-expanded={false}
        aria-controls="dropdown-menu"
        onClick={toggleDropdown}
      >
        Options
      </PharmaButton>
    </div>
  );
}
```

### Screen Reader Support

```jsx
function ScreenReaderExample() {
  const [saving, setSaving] = useState(false);
  
  return (
    <PharmaButton
      onClick={handleSave}
      loading={saving}
      aria-live="polite"
      aria-describedby="save-status"
    >
      {saving ? 'Saving...' : 'Save Changes'}
    </PharmaButton>
  );
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `ButtonVariant` | `'primary'` | Button style variant |
| `size` | `ComponentSize` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading state |
| `loadingText` | `string` | `undefined` | Text to show when loading |
| `icon` | `ReactNode` | `undefined` | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `onClick` | `function` | `undefined` | Click event handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |
| `fullWidth` | `boolean` | `false` | Full width button |
| `confirmAction` | `boolean` | `false` | Show confirmation dialog |
| `confirmMessage` | `string` | `undefined` | Confirmation message |
| `tooltip` | `string` | `undefined` | Tooltip text |
| `className` | `string` | `undefined` | Additional CSS classes |
| `children` | `ReactNode` | `undefined` | Button content |

## TypeScript

```typescript
import { PharmaButtonProps } from '@pharmatrak/component-library';

interface CustomButtonProps extends PharmaButtonProps {
  pharmacyAction?: 'fill' | 'return' | 'adjust' | 'remove';
  prescriptionId?: string;
}

const CustomPharmacyButton: React.FC<CustomButtonProps> = ({
  pharmacyAction,
  prescriptionId,
  ...props
}) => {
  const handlePharmacyAction = () => {
    switch (pharmacyAction) {
      case 'fill':
        fillPrescription(prescriptionId);
        break;
      case 'return':
        returnToStock(prescriptionId);
        break;
      // ... other cases
    }
  };

  return (
    <PharmaButton
      {...props}
      onClick={handlePharmacyAction}
    />
  );
};
```

## Testing

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PharmaButton } from '@pharmatrak/component-library';

describe('PharmaButton', () => {
  test('handles click events', async () => {
    const handleClick = jest.fn();
    render(<PharmaButton onClick={handleClick}>Click me</PharmaButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows confirmation dialog', async () => {
    const handleClick = jest.fn();
    render(
      <PharmaButton
        confirmAction
        confirmMessage="Are you sure?"
        onClick={handleClick}
      >
        Delete
      </PharmaButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  test('shows loading state', () => {
    render(<PharmaButton loading>Loading</PharmaButton>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

## Best Practices

### ✅ Do

- Use semantic button types (`submit`, `reset`) for forms
- Provide clear, action-oriented labels
- Use confirmation dialogs for destructive actions
- Include loading states for async operations
- Add tooltips for icon-only buttons
- Use appropriate variants for action context

### ❌ Don't

- Use buttons for navigation (use links instead)
- Create buttons without accessible labels
- Use too many button variants in one interface
- Make buttons too small for touch targets
- Skip confirmation for destructive pharmacy actions

## Related Components

- [PharmaModal](pharma-modal) - For complex confirmation dialogs
- [PharmaForm](pharma-form) - For form submission buttons
- [PharmaTooltip](pharma-tooltip) - For button help text
- [PharmaAlert](pharma-alert) - For action feedback